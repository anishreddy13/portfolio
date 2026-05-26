from __future__ import annotations

import argparse
import csv
import json
import random
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim

from plant_dataset import (
    DEFAULT_IMAGE_SIZE,
    build_plant_preprocessing,
    save_class_mapping,
)
from plant_model import (
    build_efficientnet_b0,
    count_total_parameters,
    count_trainable_parameters,
    freeze_efficientnet_backbone,
    unfreeze_last_feature_blocks,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_DIR = PROJECT_ROOT / "datasets" / "plant_dataset"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "models" / "plant_disease"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


@dataclass
class EpochResult:
    loss: float
    accuracy: float
    macro_f1: float
    balanced_accuracy: float
    per_class_recall: dict[str, float]
    confusion_matrix: list[list[int]]


class EarlyStopping:
    def __init__(
        self,
        patience: int = 4,
        min_delta: float = 0.0005,
        best_score: float | None = None,
    ) -> None:
        self.patience = patience
        self.min_delta = min_delta
        self.best_score = best_score
        self.bad_epochs = 0

    def step(self, score: float) -> bool:
        if self.best_score is None or score > self.best_score + self.min_delta:
            self.best_score = score
            self.bad_epochs = 0
            return False

        self.bad_epochs += 1
        return self.bad_epochs >= self.patience


class ProgressBar:
    def __init__(self, total: int, label: str, width: int = 24) -> None:
        self.total = max(total, 1)
        self.label = label
        self.width = width

    def update(self, current: int, loss: float, accuracy: float) -> None:
        filled = int(self.width * current / self.total)
        bar = "#" * filled + "-" * (self.width - filled)
        sys.stdout.write(
            f"\r{self.label} [{bar}] {current:>4}/{self.total:<4} "
            f"loss={loss:.4f} acc={accuracy:.4f}"
        )
        sys.stdout.flush()

    def close(self) -> None:
        sys.stdout.write("\n")
        sys.stdout.flush()


def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def describe_device(device: torch.device) -> str:
    if device.type == "cuda":
        return f"cuda ({torch.cuda.get_device_name(0)})"
    return "cpu"


def class_names_from_mapping(class_to_idx: dict[str, int]) -> list[str]:
    return [
        class_name
        for class_name, _ in sorted(class_to_idx.items(), key=lambda item: item[1])
    ]


def update_confusion_matrix(confusion: torch.Tensor, labels: torch.Tensor, predictions: torch.Tensor) -> None:
    for label, prediction in zip(labels.view(-1), predictions.view(-1)):
        confusion[int(label), int(prediction)] += 1


def metrics_from_confusion(confusion: torch.Tensor, class_names: list[str], loss: float) -> EpochResult:
    confusion = confusion.to(torch.float64)
    total = confusion.sum().item()
    correct = confusion.diag().sum().item()
    accuracy = correct / total if total else 0.0

    recalls = []
    f1_scores = []
    per_class_recall: dict[str, float] = {}

    for idx, class_name in enumerate(class_names):
        tp = confusion[idx, idx].item()
        row_total = confusion[idx, :].sum().item()
        col_total = confusion[:, idx].sum().item()
        recall = tp / row_total if row_total else 0.0
        precision = tp / col_total if col_total else 0.0
        f1 = 2.0 * precision * recall / (precision + recall) if precision + recall else 0.0

        recalls.append(recall)
        f1_scores.append(f1)
        per_class_recall[class_name] = recall

    balanced_accuracy = sum(recalls) / len(recalls) if recalls else 0.0
    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0

    return EpochResult(
        loss=loss,
        accuracy=accuracy,
        macro_f1=macro_f1,
        balanced_accuracy=balanced_accuracy,
        per_class_recall=per_class_recall,
        confusion_matrix=confusion.to(torch.int64).tolist(),
    )


def run_epoch(
    model: nn.Module,
    data_loader,
    criterion: nn.Module,
    class_names: list[str],
    optimizer: optim.Optimizer | None = None,
    phase: str = "train",
    max_batches: int | None = None,
) -> EpochResult:
    is_training = optimizer is not None
    model.train(is_training)

    confusion = torch.zeros(len(class_names), len(class_names), dtype=torch.int64)
    running_loss = 0.0
    seen = 0
    correct = 0
    total_batches = len(data_loader)
    if max_batches is not None:
        total_batches = min(total_batches, max_batches)
    progress = ProgressBar(total_batches, phase)

    for batch_idx, (images, labels) in enumerate(data_loader, start=1):
        if max_batches is not None and batch_idx > max_batches:
            break

        non_blocking = DEVICE.type == "cuda"
        images = images.to(DEVICE, non_blocking=non_blocking)
        labels = labels.to(DEVICE, non_blocking=non_blocking)

        if is_training:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(is_training):
            outputs = model(images)
            loss = criterion(outputs, labels)
            if is_training:
                loss.backward()
                optimizer.step()

        batch_size = labels.size(0)
        predictions = outputs.argmax(dim=1)
        running_loss += loss.item() * batch_size
        seen += batch_size
        correct += int((predictions == labels).sum().item())
        update_confusion_matrix(confusion, labels.cpu(), predictions.cpu())
        progress.update(batch_idx, running_loss / seen, correct / seen)

    progress.close()
    epoch_loss = running_loss / seen if seen else 0.0
    return metrics_from_confusion(confusion, class_names, epoch_loss)


def save_json(payload: dict | list, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def save_confusion_matrix_csv(confusion_matrix: list[list[int]], class_names: list[str], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["actual\\predicted", *class_names])
        for class_name, row in zip(class_names, confusion_matrix):
            writer.writerow([class_name, *row])


def save_checkpoint(
    model: nn.Module,
    optimizer: optim.Optimizer,
    output_dir: Path,
    epoch: int,
    phase: str,
    metric_name: str,
    metric_value: float,
    class_to_idx: dict[str, int],
    args: argparse.Namespace,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = output_dir / "best_model.pt"
    torch.save(
        {
            "epoch": epoch,
            "phase": phase,
            "metric_name": metric_name,
            "metric_value": metric_value,
            "model_architecture": "efficientnet_b0",
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "class_to_idx": class_to_idx,
            "image_size": DEFAULT_IMAGE_SIZE,
            "args": vars(args),
        },
        checkpoint_path,
    )
    return checkpoint_path


def train_phase(
    model: nn.Module,
    bundle,
    class_names: list[str],
    phase_name: str,
    epochs: int,
    learning_rate: float,
    weight_decay: float,
    start_epoch: int,
    early_stopping: EarlyStopping,
    output_dir: Path,
    history: list[dict],
    best_metric: float,
    args: argparse.Namespace,
) -> tuple[int, float, bool]:
    if epochs <= 0:
        return start_epoch, best_metric, False

    optimizer = optim.AdamW(
        [param for param in model.parameters() if param.requires_grad],
        lr=learning_rate,
        weight_decay=weight_decay,
    )
    criterion = nn.CrossEntropyLoss(weight=bundle.class_weights.to(DEVICE))
    stopped = False
    current_epoch = start_epoch

    for _ in range(epochs):
        current_epoch += 1
        print(f"\nEpoch {current_epoch} | phase={phase_name} | lr={learning_rate:g}")
        started_at = time.time()

        train_result = run_epoch(
            model=model,
            data_loader=bundle.train_loader,
            criterion=criterion,
            class_names=class_names,
            optimizer=optimizer,
            phase="train",
            max_batches=args.max_train_batches,
        )
        val_result = run_epoch(
            model=model,
            data_loader=bundle.val_loader,
            criterion=criterion,
            class_names=class_names,
            optimizer=None,
            phase="val",
            max_batches=args.max_eval_batches,
        )

        elapsed = time.time() - started_at
        print(
            "  "
            f"train_loss={train_result.loss:.4f} "
            f"train_acc={train_result.accuracy:.4f} "
            f"train_macro_f1={train_result.macro_f1:.4f} | "
            f"val_loss={val_result.loss:.4f} "
            f"val_acc={val_result.accuracy:.4f} "
            f"val_macro_f1={val_result.macro_f1:.4f} "
            f"val_bal_acc={val_result.balanced_accuracy:.4f} "
            f"time={elapsed:.1f}s"
        )

        history_row = {
            "epoch": current_epoch,
            "phase": phase_name,
            "train": asdict(train_result),
            "validation": asdict(val_result),
            "elapsed_seconds": elapsed,
        }
        history.append(history_row)
        save_json(history, output_dir / "training_history.json")

        score = val_result.macro_f1
        if score > best_metric:
            best_metric = score
            checkpoint_path = save_checkpoint(
                model=model,
                optimizer=optimizer,
                output_dir=output_dir,
                epoch=current_epoch,
                phase=phase_name,
                metric_name="validation_macro_f1",
                metric_value=score,
                class_to_idx=bundle.class_to_idx,
                args=args,
            )
            print(f"  saved best checkpoint: {checkpoint_path} ({score:.4f})")

        if early_stopping.step(score):
            print(f"  early stopping triggered after {early_stopping.bad_epochs} stale epochs")
            stopped = True
            break

    return current_epoch, best_metric, stopped


def save_final_metrics(test_result: EpochResult, class_names: list[str], output_dir: Path) -> None:
    save_json(asdict(test_result), output_dir / "test_metrics.json")
    save_json(
        {
            "class_names": class_names,
            "matrix": test_result.confusion_matrix,
            "orientation": "rows=actual, columns=predicted",
        },
        output_dir / "confusion_matrix.json",
    )
    save_confusion_matrix_csv(
        test_result.confusion_matrix,
        class_names,
        output_dir / "confusion_matrix.csv",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train EfficientNet-B0 for plant disease classification."
    )
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATASET_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--validation-workers", type=int, default=32)
    parser.add_argument("--head-epochs", type=int, default=3)
    parser.add_argument("--fine-tune-epochs", type=int, default=5)
    parser.add_argument("--fine-tune-blocks", type=int, default=2)
    parser.add_argument("--head-lr", type=float, default=1e-3)
    parser.add_argument("--fine-tune-lr", type=float, default=1e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--patience", type=int, default=4)
    parser.add_argument("--min-delta", type=float, default=0.0005)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--val-size", type=float, default=0.15)
    parser.add_argument("--test-size", type=float, default=0.15)
    parser.add_argument("--max-train-batches", type=int, default=None)
    parser.add_argument("--max-eval-batches", type=int, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print("Plant Disease EfficientNet-B0 Training")
    print("=" * 42)
    print(f"Selected device: {describe_device(DEVICE)}")
    print(f"Dataset: {args.data_dir}")
    print(f"Output: {args.output_dir}")
    print(f"Batch size: {args.batch_size}")
    print(f"DataLoader workers: {args.num_workers}")
    print(f"Pin memory: {DEVICE.type == 'cuda'}")

    bundle = build_plant_preprocessing(
        dataset_dir=args.data_dir,
        batch_size=args.batch_size,
        num_workers=args.num_workers,
        image_size=DEFAULT_IMAGE_SIZE,
        val_size=args.val_size,
        test_size=args.test_size,
        random_state=args.seed,
        use_weighted_sampler=True,
        validation_workers=args.validation_workers,
        pin_memory=DEVICE.type == "cuda",
    )
    save_class_mapping(bundle.class_to_idx, args.output_dir / "plant_class_to_idx.json")

    class_names = class_names_from_mapping(bundle.class_to_idx)
    model = build_efficientnet_b0(num_classes=len(class_names), freeze_backbone=True).to(DEVICE)
    print(f"Classes: {len(class_names)}")
    print(f"Train/val/test: {len(bundle.train_dataset)}/{len(bundle.val_dataset)}/{len(bundle.test_dataset)}")
    print(f"Total params: {count_total_parameters(model):,}")
    print(f"Trainable params: {count_trainable_parameters(model):,} (classifier head)")

    history: list[dict] = []
    early_stopping = EarlyStopping(patience=args.patience, min_delta=args.min_delta)
    current_epoch = 0
    best_metric = -1.0

    freeze_efficientnet_backbone(model)
    current_epoch, best_metric, stopped = train_phase(
        model=model,
        bundle=bundle,
        class_names=class_names,
        phase_name="classifier_head",
        epochs=args.head_epochs,
        learning_rate=args.head_lr,
        weight_decay=args.weight_decay,
        start_epoch=current_epoch,
        early_stopping=early_stopping,
        output_dir=args.output_dir,
        history=history,
        best_metric=best_metric,
        args=args,
    )

    if not stopped and args.fine_tune_epochs > 0:
        unfreeze_last_feature_blocks(model, blocks=args.fine_tune_blocks)
        print(f"\nFine-tuning last {args.fine_tune_blocks} EfficientNet feature block(s)")
        print(f"Trainable params: {count_trainable_parameters(model):,}")
        early_stopping = EarlyStopping(
            patience=args.patience,
            min_delta=args.min_delta,
            best_score=best_metric,
        )
        current_epoch, best_metric, stopped = train_phase(
            model=model,
            bundle=bundle,
            class_names=class_names,
            phase_name="fine_tune",
            epochs=args.fine_tune_epochs,
            learning_rate=args.fine_tune_lr,
            weight_decay=args.weight_decay,
            start_epoch=current_epoch,
            early_stopping=early_stopping,
            output_dir=args.output_dir,
            history=history,
            best_metric=best_metric,
            args=args,
        )

    checkpoint_path = args.output_dir / "best_model.pt"
    if checkpoint_path.exists():
        checkpoint = torch.load(checkpoint_path, map_location=DEVICE)
        model.load_state_dict(checkpoint["model_state_dict"])
        print(f"\nLoaded best checkpoint from epoch {checkpoint['epoch']} for test evaluation")
    else:
        print("\nNo checkpoint was saved; evaluating current model state")

    criterion = nn.CrossEntropyLoss(weight=bundle.class_weights.to(DEVICE))
    test_result = run_epoch(
        model=model,
        data_loader=bundle.test_loader,
        criterion=criterion,
        class_names=class_names,
        optimizer=None,
        phase="test",
        max_batches=args.max_eval_batches,
    )
    save_final_metrics(test_result, class_names, args.output_dir)

    print("\nFinal test metrics")
    print("------------------")
    print(f"accuracy={test_result.accuracy:.4f}")
    print(f"macro_f1={test_result.macro_f1:.4f}")
    print(f"balanced_accuracy={test_result.balanced_accuracy:.4f}")
    print(f"best_validation_macro_f1={best_metric:.4f}")
    print(f"Artifacts saved in: {args.output_dir}")


if __name__ == "__main__":
    main()
