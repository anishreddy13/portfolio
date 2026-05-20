import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import torchvision.transforms as transforms
from PIL import Image
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from collections import Counter
from skin_model import (
    build_model, save_skin_model, CLASS_NAMES,
    CANCER_LABELS, NUM_CLASSES
)

# ── Config ─────────────────────────────────────────────────────────────────────
DATA_DIR    = Path('skin_data')
META_CSV    = DATA_DIR / 'HAM10000_metadata.csv'
IMG_DIR_1   = DATA_DIR / 'HAM10000_images_part_1'
IMG_DIR_2   = DATA_DIR / 'HAM10000_images_part_2'
BATCH_SIZE  = 32
EPOCHS      = 15
LR          = 0.001
DEVICE      = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

print(f"Using device: {DEVICE}")

# ── Transforms ─────────────────────────────────────────────────────────────────
TRAIN_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

VAL_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ── Dataset ────────────────────────────────────────────────────────────────────
class SkinCancerDataset(Dataset):
    def __init__(self, df, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform
        self.class_to_idx = {cls: i for i, cls in enumerate(CLASS_NAMES)}

    def __len__(self):
        return len(self.df)

    def find_image(self, image_id):
        for img_dir in [IMG_DIR_1, IMG_DIR_2]:
            path = img_dir / f'{image_id}.jpg'
            if path.exists():
                return path
        return None

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = self.find_image(row['image_id'])

        if img_path is None:
            # Return blank image if not found
            image = Image.fromarray(np.zeros((224, 224, 3), dtype=np.uint8))
        else:
            image = Image.open(img_path).convert('RGB')

        if self.transform:
            image = self.transform(image)

        label = self.class_to_idx[row['dx']]
        return image, label

# ── Training ───────────────────────────────────────────────────────────────────
def train():
    print("=" * 60)
    print("SKIN CANCER IMAGE CLASSIFICATION TRAINING")
    print("Using: ResNet18 Transfer Learning")
    print(f"Device: {DEVICE}")
    print("=" * 60)

    # Load metadata
    if not META_CSV.exists():
        raise FileNotFoundError(
            f"Metadata not found at {META_CSV}\n"
            "Download HAM10000 dataset from:\n"
            "https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000\n"
            "Place files in ml-backend/skin_data/"
        )

    df = pd.read_csv(META_CSV)
    print(f"\nTotal samples: {len(df)}")
    print(f"Class distribution:\n{df['dx'].value_counts()}")

    # Only keep rows where image exists
    def image_exists(image_id):
        for d in [IMG_DIR_1, IMG_DIR_2]:
            if (d / f'{image_id}.jpg').exists():
                return True
        return False

    print("\nVerifying images exist...")
    df['exists'] = df['image_id'].apply(image_exists)
    df = df[df['exists']].drop(columns=['exists'])
    print(f"Valid images found: {len(df)}")

    # Train/val split
    train_df, val_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df['dx']
    )
    print(f"Train: {len(train_df)} | Val: {len(val_df)}")

    # Datasets
    train_dataset = SkinCancerDataset(train_df, TRAIN_TRANSFORMS)
    val_dataset   = SkinCancerDataset(val_df,   VAL_TRANSFORMS)

    # Weighted sampler to handle class imbalance
    class_to_idx = {cls: i for i, cls in enumerate(CLASS_NAMES)}
    labels = [class_to_idx[dx] for dx in train_df['dx']]
    class_counts = Counter(labels)
    weights = [1.0 / class_counts[l] for l in labels]
    sampler = WeightedRandomSampler(weights, len(weights))

    train_loader = DataLoader(
        train_dataset, batch_size=BATCH_SIZE,
        sampler=sampler, num_workers=0
    )
    val_loader = DataLoader(
        val_dataset, batch_size=BATCH_SIZE,
        shuffle=False, num_workers=0
    )

    # Build model
    model = build_model(NUM_CLASSES).to(DEVICE)
    print(f"\nModel: ResNet18 with custom head")
    print(f"Trainable params: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

    # Loss and optimizer
    # Use class weights to handle imbalance
    total = len(labels)
    class_weights = torch.tensor(
        [total / (NUM_CLASSES * class_counts.get(i, 1)) for i in range(NUM_CLASSES)],
        dtype=torch.float
    ).to(DEVICE)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR, weight_decay=1e-4
    )
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

    # Training loop
    best_val_acc = 0.0
    print("\nStarting training...\n")

    for epoch in range(EPOCHS):
        # ── Train ──
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for batch_idx, (images, labels_batch) in enumerate(train_loader):
            images = images.to(DEVICE)
            labels_batch = labels_batch.to(DEVICE)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels_batch)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels_batch.size(0)
            train_correct += predicted.eq(labels_batch).sum().item()

            if (batch_idx + 1) % 20 == 0:
                print(f"  Epoch {epoch+1}/{EPOCHS} | Batch {batch_idx+1}/{len(train_loader)} | Loss: {loss.item():.4f}")

        train_acc = 100.0 * train_correct / train_total

        # ── Validate ──
        model.eval()
        val_correct = 0
        val_total = 0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for images, labels_batch in val_loader:
                images = images.to(DEVICE)
                labels_batch = labels_batch.to(DEVICE)
                outputs = model(images)
                _, predicted = outputs.max(1)
                val_total += labels_batch.size(0)
                val_correct += predicted.eq(labels_batch).sum().item()
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels_batch.cpu().numpy())

        val_acc = 100.0 * val_correct / val_total
        scheduler.step()

        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print(f"  Train Loss: {train_loss/len(train_loader):.4f} | Train Acc: {train_acc:.2f}%")
        print(f"  Val Acc: {val_acc:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_skin_model(model, 'skin_model.pth')
            print(f"  ✅ Best model saved! Val Acc: {val_acc:.2f}%")

        print()

    # Final evaluation
    print("=" * 60)
    print(f"Training complete! Best Val Accuracy: {best_val_acc:.2f}%")
    print("\nFinal Classification Report:")
    print(classification_report(
        all_labels, all_preds,
        target_names=CLASS_NAMES,
        zero_division=0
    ))

    # Cancer vs Non-Cancer binary accuracy
    cancer_indices = {
        i for i, cls in enumerate(CLASS_NAMES)
        if CANCER_LABELS[cls]['cancerous']
    }
    binary_preds  = [1 if p in cancer_indices else 0 for p in all_preds]
    binary_labels = [1 if l in cancer_indices else 0 for l in all_labels]
    binary_acc = accuracy_score(binary_labels, binary_preds)
    print(f"\nBinary Cancer Detection Accuracy: {binary_acc * 100:.2f}%")
    print("✅ Skin cancer model training complete!")


if __name__ == "__main__":
    train()