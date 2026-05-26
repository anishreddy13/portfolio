from __future__ import annotations

import json
import os
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import torch
from PIL import Image, UnidentifiedImageError
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import transforms


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
DEFAULT_IMAGE_SIZE = 224


@dataclass(frozen=True)
class PlantImageRecord:
    path: Path
    class_name: str
    label: int


@dataclass(frozen=True)
class IgnoredFile:
    path: Path
    reason: str


@dataclass(frozen=True)
class PlantSplits:
    train: list[PlantImageRecord]
    val: list[PlantImageRecord]
    test: list[PlantImageRecord]
    class_to_idx: dict[str, int]
    ignored_files: list[IgnoredFile]


@dataclass(frozen=True)
class PlantPreprocessingBundle:
    train_dataset: "PlantDiseaseDataset"
    val_dataset: "PlantDiseaseDataset"
    test_dataset: "PlantDiseaseDataset"
    train_loader: DataLoader
    val_loader: DataLoader
    test_loader: DataLoader
    class_to_idx: dict[str, int]
    class_weights: torch.Tensor
    ignored_files: list[IgnoredFile]


class PlantDiseaseDataset(Dataset):
    def __init__(
        self,
        records: Iterable[PlantImageRecord],
        transform: transforms.Compose | None = None,
    ) -> None:
        self.records = list(records)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        record = self.records[idx]
        with Image.open(record.path) as image:
            image = image.convert("RGB")

        if self.transform is not None:
            image = self.transform(image)

        return image, record.label


def get_plant_transforms(image_size: int = DEFAULT_IMAGE_SIZE) -> tuple[transforms.Compose, transforms.Compose]:
    train_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.2),
            transforms.RandomRotation(degrees=20),
            transforms.ColorJitter(
                brightness=0.2,
                contrast=0.2,
                saturation=0.2,
                hue=0.03,
            ),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )

    eval_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )

    return train_transform, eval_transform


def is_supported_image(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def is_readable_image(path: Path) -> bool:
    try:
        with Image.open(path) as image:
            image.verify()
        return True
    except (OSError, UnidentifiedImageError):
        return False


def scan_plant_dataset(
    dataset_dir: Path,
    validation_workers: int | None = None,
) -> tuple[list[PlantImageRecord], dict[str, int], list[IgnoredFile]]:
    dataset_dir = Path(dataset_dir)
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Plant dataset directory not found: {dataset_dir}")

    class_dirs = sorted([path for path in dataset_dir.iterdir() if path.is_dir()], key=lambda path: path.name)
    if not class_dirs:
        raise ValueError(f"No class folders found in: {dataset_dir}")

    class_to_idx = {class_dir.name: idx for idx, class_dir in enumerate(class_dirs)}
    records: list[PlantImageRecord] = []
    ignored_files: list[IgnoredFile] = []
    candidates: list[tuple[Path, str, int]] = []

    for class_dir in class_dirs:
        label = class_to_idx[class_dir.name]
        for path in sorted(class_dir.rglob("*")):
            if not path.is_file():
                continue

            if not is_supported_image(path):
                ignored_files.append(IgnoredFile(path=path, reason="unsupported_extension"))
                continue

            candidates.append((path, class_dir.name, label))

    workers = validation_workers or min(32, (os.cpu_count() or 1) + 4)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        readability = list(executor.map(lambda item: is_readable_image(item[0]), candidates))

    for (path, class_name, label), readable in zip(candidates, readability):
        if not readable:
            ignored_files.append(IgnoredFile(path=path, reason="corrupt_or_unreadable"))
            continue

        records.append(
            PlantImageRecord(
                path=path,
                class_name=class_name,
                label=label,
            )
        )

    missing_classes = [
        class_name
        for class_name, class_idx in class_to_idx.items()
        if not any(record.label == class_idx for record in records)
    ]
    if missing_classes:
        raise ValueError(f"No valid images found for classes: {missing_classes}")

    return records, class_to_idx, ignored_files


def create_stratified_splits(
    records: list[PlantImageRecord],
    class_to_idx: dict[str, int],
    ignored_files: list[IgnoredFile],
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42,
) -> PlantSplits:
    if val_size <= 0 or test_size <= 0 or val_size + test_size >= 1:
        raise ValueError("val_size and test_size must be positive and sum to less than 1.")

    labels = [record.label for record in records]
    class_counts = Counter(labels)
    if min(class_counts.values()) < 3:
        raise ValueError("Each class needs at least 3 valid images for train/val/test stratification.")

    train_val_records, test_records = train_test_split(
        records,
        test_size=test_size,
        random_state=random_state,
        stratify=labels,
    )

    train_val_labels = [record.label for record in train_val_records]
    relative_val_size = val_size / (1.0 - test_size)
    train_records, val_records = train_test_split(
        train_val_records,
        test_size=relative_val_size,
        random_state=random_state,
        stratify=train_val_labels,
    )

    return PlantSplits(
        train=list(train_records),
        val=list(val_records),
        test=list(test_records),
        class_to_idx=class_to_idx,
        ignored_files=ignored_files,
    )


def compute_class_weights(records: Iterable[PlantImageRecord], num_classes: int) -> torch.Tensor:
    labels = [record.label for record in records]
    class_counts = Counter(labels)
    total = len(labels)

    weights = [
        total / (num_classes * class_counts[class_idx])
        for class_idx in range(num_classes)
    ]
    return torch.tensor(weights, dtype=torch.float32)


def create_weighted_sampler(records: Iterable[PlantImageRecord], num_classes: int) -> WeightedRandomSampler:
    records = list(records)
    class_weights = compute_class_weights(records, num_classes)
    sample_weights = [float(class_weights[record.label]) for record in records]

    return WeightedRandomSampler(
        weights=torch.DoubleTensor(sample_weights),
        num_samples=len(sample_weights),
        replacement=True,
    )


def save_class_mapping(class_to_idx: dict[str, int], output_path: Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    idx_to_class = {str(idx): class_name for class_name, idx in class_to_idx.items()}
    payload = {
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "num_classes": len(class_to_idx),
    }
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def build_plant_preprocessing(
    dataset_dir: Path,
    batch_size: int = 32,
    num_workers: int = 0,
    image_size: int = DEFAULT_IMAGE_SIZE,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42,
    use_weighted_sampler: bool = True,
    validation_workers: int | None = None,
    pin_memory: bool | None = None,
) -> PlantPreprocessingBundle:
    records, class_to_idx, ignored_files = scan_plant_dataset(
        Path(dataset_dir),
        validation_workers=validation_workers,
    )
    splits = create_stratified_splits(
        records=records,
        class_to_idx=class_to_idx,
        ignored_files=ignored_files,
        val_size=val_size,
        test_size=test_size,
        random_state=random_state,
    )

    train_transform, eval_transform = get_plant_transforms(image_size=image_size)
    train_dataset = PlantDiseaseDataset(splits.train, transform=train_transform)
    val_dataset = PlantDiseaseDataset(splits.val, transform=eval_transform)
    test_dataset = PlantDiseaseDataset(splits.test, transform=eval_transform)

    sampler = None
    shuffle_train = True
    if use_weighted_sampler:
        sampler = create_weighted_sampler(splits.train, num_classes=len(class_to_idx))
        shuffle_train = False

    use_pin_memory = torch.cuda.is_available() if pin_memory is None else pin_memory

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=shuffle_train,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=use_pin_memory,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=use_pin_memory,
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=use_pin_memory,
    )

    return PlantPreprocessingBundle(
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        test_dataset=test_dataset,
        train_loader=train_loader,
        val_loader=val_loader,
        test_loader=test_loader,
        class_to_idx=class_to_idx,
        class_weights=compute_class_weights(splits.train, num_classes=len(class_to_idx)),
        ignored_files=splits.ignored_files,
    )


def count_by_class(records: Iterable[PlantImageRecord]) -> Counter[str]:
    return Counter(record.class_name for record in records)
