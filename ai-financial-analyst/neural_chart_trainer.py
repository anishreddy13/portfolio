"""
neural_chart_trainer.py - Phase 2 trainer for Neural Chart Vision.

Trains a multimodal deep-learning model from Phase 1 artifacts. A CNN reads
candlestick images while a Transformer reads normalized OHLCV feature sequences.
The fused model predicts pattern probabilities and a five-day return together.
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

try:
    import torch
    from torch import Tensor, nn
    from torch.nn import functional as F
    from torch.utils.data import DataLoader, Dataset
except ImportError as exc:
    raise SystemExit(
        "PyTorch is required for Neural Chart Vision training. "
        "Install the project requirements before running this command."
    ) from exc


MODEL_FORMAT_VERSION = 1


@dataclass(frozen=True)
class TrainingConfig:
    dataset_dir: Path
    output_dir: Path
    epochs: int
    batch_size: int
    learning_rate: float
    weight_decay: float
    hidden_dim: int
    transformer_layers: int
    transformer_heads: int
    dropout: float
    image_encoder_width: int
    regression_weight: float
    patience: int
    validation_fraction: float
    test_fraction: float
    embargo_days: int
    seed: int
    device: str
    sequence_only: bool
    num_workers: int


@dataclass
class DatasetArtifacts:
    sequences: np.ndarray
    masks: np.ndarray
    images: np.ndarray | None
    labels: np.ndarray
    forward_returns: np.ndarray
    metadata: pd.DataFrame
    manifest: dict[str, Any]


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def load_artifacts(dataset_dir: Path) -> DatasetArtifacts:
    required = ["X_sequence.npy", "X_sequence_mask.npy", "y_patterns.npy", "metadata.csv", "manifest.json"]
    missing = [name for name in required if not (dataset_dir / name).exists()]
    if missing:
        raise FileNotFoundError(f"Dataset is missing required artifacts: {', '.join(missing)}")

    manifest = json.loads((dataset_dir / "manifest.json").read_text(encoding="utf-8"))
    sequences = np.load(dataset_dir / "X_sequence.npy", mmap_mode="r")
    masks = np.load(dataset_dir / "X_sequence_mask.npy", mmap_mode="r")
    labels = np.load(dataset_dir / "y_patterns.npy", mmap_mode="r")
    images_path = dataset_dir / "X_chart_images.npy"
    images = np.load(images_path, mmap_mode="r") if images_path.exists() else None
    metadata = pd.read_csv(dataset_dir / "metadata.csv")

    sample_count = len(metadata)
    if sample_count < 24:
        raise ValueError("At least 24 dataset windows are required to train and evaluate the model")
    if sequences.ndim != 3 or masks.ndim != 2 or labels.ndim != 2:
        raise ValueError("Dataset tensors have invalid shapes; rebuild the Phase 1 dataset")
    if sequences.shape[:2] != masks.shape or sequences.shape[0] != labels.shape[0] or sequences.shape[0] != sample_count:
        raise ValueError("Dataset tensors and metadata have inconsistent sample counts")
    if images is not None and (images.ndim != 4 or images.shape[0] != sample_count or images.shape[1] != 3):
        raise ValueError("Chart image tensor must have shape [samples, 3, height, width]")
    if labels.shape[1] != len(manifest.get("patterns", [])):
        raise ValueError("Pattern labels do not match the dataset manifest")
    if "forward_5d_return" not in metadata.columns:
        raise ValueError("Dataset metadata is missing forward_5d_return; rebuild the Phase 1 dataset")

    return DatasetArtifacts(
        sequences=sequences,
        masks=masks,
        images=images,
        labels=labels,
        forward_returns=pd.to_numeric(metadata["forward_5d_return"], errors="coerce").to_numpy(dtype=np.float32),
        metadata=metadata,
        manifest=manifest,
    )


def chronological_splits(
    metadata: pd.DataFrame,
    validation_fraction: float,
    test_fraction: float,
    embargo_days: int,
) -> dict[str, np.ndarray]:
    if validation_fraction <= 0 or test_fraction <= 0 or validation_fraction + test_fraction >= 0.8:
        raise ValueError("Validation and test fractions must be positive and leave most data for training")
    if embargo_days < 0:
        raise ValueError("embargo_days must be zero or greater")

    required = {"ticker", "start_date", "end_date"}
    missing = required.difference(metadata.columns)
    if missing:
        raise ValueError(f"Dataset metadata is missing split columns: {', '.join(sorted(missing))}")

    frame = metadata.reset_index(drop=True).copy()
    frame["start_date"] = pd.to_datetime(frame["start_date"], errors="coerce")
    frame["end_date"] = pd.to_datetime(frame["end_date"], errors="coerce")
    if frame[["start_date", "end_date"]].isna().any().any():
        raise ValueError("Dataset metadata contains invalid window dates")

    pieces: dict[str, list[np.ndarray]] = {"train": [], "validation": [], "test": []}
    embargo = pd.Timedelta(days=embargo_days)
    for ticker, group in frame.groupby("ticker", sort=False):
        dates = np.sort(group["end_date"].unique())
        if len(dates) < 12:
            raise ValueError(f"Ticker {ticker} does not have enough dated windows for a chronological split")

        train_cut = dates[max(1, int(len(dates) * (1 - validation_fraction - test_fraction)) - 1)]
        validation_cut = dates[max(2, int(len(dates) * (1 - test_fraction)) - 1)]
        train = group.loc[group["end_date"] <= train_cut].index.to_numpy(dtype=np.int64)
        validation = group.loc[
            (group["start_date"] > train_cut + embargo) & (group["end_date"] <= validation_cut)
        ].index.to_numpy(dtype=np.int64)
        test = group.loc[group["start_date"] > validation_cut + embargo].index.to_numpy(dtype=np.int64)

        if not len(train) or not len(validation) or not len(test):
            raise ValueError(
                f"Ticker {ticker} has no samples in one split after the {embargo_days}-day purge. "
                "Build more history or lower --embargo-days."
            )
        pieces["train"].append(train)
        pieces["validation"].append(validation)
        pieces["test"].append(test)

    return {name: np.concatenate(indices) for name, indices in pieces.items()}


def fit_normalizer(sequences: np.ndarray, masks: np.ndarray, train_indices: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    train_sequences = np.asarray(sequences[train_indices], dtype=np.float32)
    train_masks = np.asarray(masks[train_indices], dtype=bool)
    active_steps = train_sequences[train_masks]
    if not len(active_steps):
        raise ValueError("Training split has no valid sequence timesteps")
    mean = active_steps.mean(axis=0, dtype=np.float64).astype(np.float32)
    std = active_steps.std(axis=0, dtype=np.float64).astype(np.float32)
    return mean, np.maximum(std, 1e-6)


class NeuralChartDataset(Dataset[dict[str, Tensor]]):
    def __init__(
        self,
        artifacts: DatasetArtifacts,
        indices: np.ndarray,
        feature_mean: np.ndarray,
        feature_std: np.ndarray,
        use_images: bool,
    ) -> None:
        self.artifacts = artifacts
        self.indices = indices.astype(np.int64)
        self.feature_mean = feature_mean.astype(np.float32)
        self.feature_std = feature_std.astype(np.float32)
        self.use_images = use_images

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, item: int) -> dict[str, Tensor]:
        index = int(self.indices[item])
        sequence = np.asarray(self.artifacts.sequences[index], dtype=np.float32).copy()
        mask = np.asarray(self.artifacts.masks[index], dtype=np.float32).copy()
        sequence = (sequence - self.feature_mean) / self.feature_std
        sequence[mask <= 0] = 0

        forward_return = self.artifacts.forward_returns[index]
        sample = {
            "sequence": torch.from_numpy(sequence),
            "mask": torch.from_numpy(mask),
            "labels": torch.from_numpy(np.asarray(self.artifacts.labels[index], dtype=np.float32).copy()),
            "forward_return": torch.tensor(0.0 if np.isnan(forward_return) else forward_return, dtype=torch.float32),
            "return_mask": torch.tensor(float(np.isfinite(forward_return)), dtype=torch.float32),
        }
        if self.use_images:
            if self.artifacts.images is None:
                raise RuntimeError("Model was configured for images but X_chart_images.npy is unavailable")
            sample["image"] = torch.from_numpy(np.asarray(self.artifacts.images[index], dtype=np.float32).copy())
        return sample


class SequenceEncoder(nn.Module):
    def __init__(self, feature_count: int, max_steps: int, hidden_dim: int, layers: int, heads: int, dropout: float) -> None:
        super().__init__()
        if hidden_dim % heads:
            raise ValueError("hidden_dim must be divisible by transformer_heads")
        self.max_steps = max_steps
        self.input_norm = nn.LayerNorm(feature_count)
        self.input_projection = nn.Linear(feature_count, hidden_dim)
        self.position = nn.Parameter(torch.zeros(1, max_steps, hidden_dim))
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=heads,
            dim_feedforward=hidden_dim * 4,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=layers)
        self.output_norm = nn.LayerNorm(hidden_dim)
        nn.init.trunc_normal_(self.position, std=0.02)

    def forward(self, sequence: Tensor, mask: Tensor) -> Tensor:
        if sequence.shape[1] > self.max_steps:
            raise ValueError("Sequence exceeds the maximum model length")
        x = self.input_projection(self.input_norm(sequence)) + self.position[:, : sequence.shape[1]]
        padding_mask = mask <= 0
        encoded = self.encoder(x, src_key_padding_mask=padding_mask)
        weights = mask.unsqueeze(-1)
        pooled = (encoded * weights).sum(dim=1) / weights.sum(dim=1).clamp_min(1.0)
        return self.output_norm(pooled)


def group_count(channels: int) -> int:
    for groups in range(min(8, channels), 0, -1):
        if channels % groups == 0:
            return groups
    return 1


def conv_block(in_channels: int, out_channels: int) -> nn.Sequential:
    return nn.Sequential(
        nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=2, padding=1),
        nn.GroupNorm(num_groups=group_count(out_channels), num_channels=out_channels),
        nn.GELU(),
    )


class ChartImageEncoder(nn.Module):
    def __init__(self, width: int) -> None:
        super().__init__()
        self.layers = nn.Sequential(
            conv_block(3, width),
            conv_block(width, width * 2),
            conv_block(width * 2, width * 4),
            nn.AdaptiveAvgPool2d(1),
        )
        self.output_dim = width * 4

    def forward(self, image: Tensor) -> Tensor:
        return self.layers(image).flatten(1)


class NeuralChartVision(nn.Module):
    def __init__(
        self,
        feature_count: int,
        max_steps: int,
        pattern_count: int,
        hidden_dim: int,
        transformer_layers: int,
        transformer_heads: int,
        dropout: float,
        image_encoder_width: int,
        use_images: bool,
    ) -> None:
        super().__init__()
        self.use_images = use_images
        self.sequence_encoder = SequenceEncoder(
            feature_count,
            max_steps,
            hidden_dim,
            transformer_layers,
            transformer_heads,
            dropout,
        )
        fusion_input = hidden_dim
        if use_images:
            self.image_encoder = ChartImageEncoder(image_encoder_width)
            fusion_input += self.image_encoder.output_dim
        self.fusion = nn.Sequential(
            nn.LayerNorm(fusion_input),
            nn.Linear(fusion_input, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
        )
        self.pattern_head = nn.Linear(hidden_dim, pattern_count)
        self.return_head = nn.Linear(hidden_dim, 1)

    def forward(self, sequence: Tensor, mask: Tensor, image: Tensor | None = None) -> dict[str, Tensor]:
        representations = [self.sequence_encoder(sequence, mask)]
        if self.use_images:
            if image is None:
                raise ValueError("Chart image input is required for this model")
            representations.append(self.image_encoder(image))
        fused = self.fusion(torch.cat(representations, dim=1))
        return {
            "pattern_logits": self.pattern_head(fused),
            "forward_return": self.return_head(fused).squeeze(1),
        }


def move_batch(batch: dict[str, Tensor], device: torch.device) -> dict[str, Tensor]:
    return {name: value.to(device, non_blocking=True) for name, value in batch.items()}


def calculate_loss(
    output: dict[str, Tensor],
    batch: dict[str, Tensor],
    positive_weights: Tensor,
    regression_weight: float,
) -> tuple[Tensor, Tensor, Tensor]:
    classification_loss = F.binary_cross_entropy_with_logits(
        output["pattern_logits"],
        batch["labels"],
        pos_weight=positive_weights,
    )
    return_mask = batch["return_mask"] > 0
    if bool(return_mask.any()):
        regression_loss = F.smooth_l1_loss(
            output["forward_return"][return_mask],
            batch["forward_return"][return_mask],
        )
    else:
        regression_loss = classification_loss.new_zeros(())
    return classification_loss + regression_weight * regression_loss, classification_loss, regression_loss


def run_epoch(
    model: NeuralChartVision,
    loader: DataLoader[dict[str, Tensor]],
    device: torch.device,
    positive_weights: Tensor,
    regression_weight: float,
    optimizer: torch.optim.Optimizer | None = None,
    collect_predictions: bool = False,
) -> tuple[dict[str, float], dict[str, np.ndarray] | None]:
    training = optimizer is not None
    model.train(training)
    totals = {"loss": 0.0, "classification_loss": 0.0, "regression_loss": 0.0, "samples": 0}
    prediction_batches: dict[str, list[np.ndarray]] = {
        "labels": [],
        "probabilities": [],
        "forward_return": [],
        "forward_return_prediction": [],
        "return_mask": [],
    }

    for batch in loader:
        batch = move_batch(batch, device)
        if training:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(training):
            output = model(batch["sequence"], batch["mask"], batch.get("image"))
            loss, classification_loss, regression_loss = calculate_loss(
                output,
                batch,
                positive_weights,
                regression_weight,
            )
            if training:
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()

        batch_size = len(batch["labels"])
        totals["loss"] += float(loss.detach()) * batch_size
        totals["classification_loss"] += float(classification_loss.detach()) * batch_size
        totals["regression_loss"] += float(regression_loss.detach()) * batch_size
        totals["samples"] += batch_size

        if collect_predictions:
            prediction_batches["labels"].append(batch["labels"].detach().cpu().numpy())
            prediction_batches["probabilities"].append(torch.sigmoid(output["pattern_logits"]).detach().cpu().numpy())
            prediction_batches["forward_return"].append(batch["forward_return"].detach().cpu().numpy())
            prediction_batches["forward_return_prediction"].append(output["forward_return"].detach().cpu().numpy())
            prediction_batches["return_mask"].append(batch["return_mask"].detach().cpu().numpy())

    if not totals["samples"]:
        raise RuntimeError("Data loader produced no samples")
    losses = {key: value / totals["samples"] for key, value in totals.items() if key != "samples"}
    if not collect_predictions:
        return losses, None
    return losses, {name: np.concatenate(values) for name, values in prediction_batches.items()}


def rounded(value: float) -> float:
    return round(float(value), 6)


def calculate_metrics(predictions: dict[str, np.ndarray], patterns: list[str]) -> dict[str, Any]:
    labels = predictions["labels"]
    probabilities = predictions["probabilities"]
    pattern_metrics: dict[str, dict[str, float | int | None]] = {}
    f1_scores: list[float] = []
    for position, pattern in enumerate(patterns):
        truth = labels[:, position] >= 0.5
        predicted = probabilities[:, position] >= 0.5
        true_positive = int(np.logical_and(truth, predicted).sum())
        false_positive = int(np.logical_and(~truth, predicted).sum())
        false_negative = int(np.logical_and(truth, ~predicted).sum())
        support = int(truth.sum())
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        if support:
            f1_scores.append(f1)
        pattern_metrics[pattern] = {
            "support": support,
            "precision": rounded(precision),
            "recall": rounded(recall),
            "f1": rounded(f1) if support else None,
        }

    return_mask = predictions["return_mask"] > 0.5
    actual_return = predictions["forward_return"][return_mask]
    predicted_return = predictions["forward_return_prediction"][return_mask]
    return_metrics: dict[str, float | int | None]
    if len(actual_return):
        return_metrics = {
            "samples": int(len(actual_return)),
            "mae": rounded(np.abs(predicted_return - actual_return).mean()),
            "rmse": rounded(np.sqrt(np.square(predicted_return - actual_return).mean())),
            "directional_accuracy": rounded(np.mean((predicted_return >= 0) == (actual_return >= 0))),
        }
    else:
        return_metrics = {"samples": 0, "mae": None, "rmse": None, "directional_accuracy": None}

    return {
        "pattern_metrics": pattern_metrics,
        "macro_f1_supported_patterns": rounded(np.mean(f1_scores)) if f1_scores else None,
        "return_metrics": return_metrics,
    }


def make_model_config(artifacts: DatasetArtifacts, config: TrainingConfig, use_images: bool) -> dict[str, Any]:
    return {
        "feature_count": int(artifacts.sequences.shape[2]),
        "max_steps": int(artifacts.sequences.shape[1]),
        "pattern_count": int(artifacts.labels.shape[1]),
        "hidden_dim": config.hidden_dim,
        "transformer_layers": config.transformer_layers,
        "transformer_heads": config.transformer_heads,
        "dropout": config.dropout,
        "image_encoder_width": config.image_encoder_width,
        "use_images": use_images,
    }


def train(config: TrainingConfig) -> dict[str, Any]:
    set_seed(config.seed)
    artifacts = load_artifacts(config.dataset_dir)
    use_images = not config.sequence_only
    if use_images and artifacts.images is None:
        raise ValueError("Multimodal training requires X_chart_images.npy. Rebuild Phase 1 with --render-images.")

    splits = chronological_splits(
        artifacts.metadata,
        config.validation_fraction,
        config.test_fraction,
        config.embargo_days,
    )
    feature_mean, feature_std = fit_normalizer(artifacts.sequences, artifacts.masks, splits["train"])
    datasets = {
        name: NeuralChartDataset(artifacts, indices, feature_mean, feature_std, use_images)
        for name, indices in splits.items()
    }
    loaders = {
        "train": DataLoader(datasets["train"], batch_size=config.batch_size, shuffle=True, num_workers=config.num_workers),
        "validation": DataLoader(datasets["validation"], batch_size=config.batch_size, shuffle=False, num_workers=config.num_workers),
        "test": DataLoader(datasets["test"], batch_size=config.batch_size, shuffle=False, num_workers=config.num_workers),
    }

    device_name = config.device
    if device_name == "auto":
        device_name = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_name)
    model_config = make_model_config(artifacts, config, use_images)
    model = NeuralChartVision(**model_config).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay)

    training_labels = np.asarray(artifacts.labels[splits["train"]], dtype=np.float32)
    positives = training_labels.sum(axis=0)
    negatives = len(training_labels) - positives
    positive_weights = np.ones_like(positives, dtype=np.float32)
    supported_patterns = positives > 0
    positive_weights[supported_patterns] = np.clip(
        negatives[supported_patterns] / positives[supported_patterns],
        1.0,
        20.0,
    )
    positive_weights_tensor = torch.from_numpy(positive_weights).to(device)

    config.output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = config.output_dir / "model.pt"
    history: list[dict[str, Any]] = []
    best_validation_loss = float("inf")
    best_epoch = 0
    stale_epochs = 0
    for epoch in range(1, config.epochs + 1):
        train_loss, _ = run_epoch(
            model,
            loaders["train"],
            device,
            positive_weights_tensor,
            config.regression_weight,
            optimizer=optimizer,
        )
        validation_loss, validation_predictions = run_epoch(
            model,
            loaders["validation"],
            device,
            positive_weights_tensor,
            config.regression_weight,
            collect_predictions=True,
        )
        validation_metrics = calculate_metrics(validation_predictions, artifacts.manifest["patterns"])
        epoch_record = {
            "epoch": epoch,
            "train": train_loss,
            "validation": {**validation_loss, **validation_metrics},
        }
        history.append(epoch_record)
        print(
            f"[NEURAL_CHART] epoch={epoch}/{config.epochs} "
            f"train_loss={train_loss['loss']:.5f} validation_loss={validation_loss['loss']:.5f}"
        )

        if validation_loss["loss"] < best_validation_loss:
            best_validation_loss = validation_loss["loss"]
            best_epoch = epoch
            stale_epochs = 0
            torch.save(
                {
                    "format_version": MODEL_FORMAT_VERSION,
                    "state_dict": model.state_dict(),
                    "model_config": model_config,
                    "feature_mean": feature_mean.tolist(),
                    "feature_std": feature_std.tolist(),
                    "feature_columns": artifacts.manifest["feature_columns"],
                    "patterns": artifacts.manifest["patterns"],
                    "dataset_manifest": artifacts.manifest,
                    "best_epoch": best_epoch,
                    "validation_loss": best_validation_loss,
                },
                checkpoint_path,
            )
        else:
            stale_epochs += 1
            if stale_epochs >= config.patience:
                print(f"[NEURAL_CHART] Early stopping at epoch {epoch}")
                break

    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["state_dict"])
    test_loss, test_predictions = run_epoch(
        model,
        loaders["test"],
        device,
        positive_weights_tensor,
        config.regression_weight,
        collect_predictions=True,
    )
    test_metrics = calculate_metrics(test_predictions, artifacts.manifest["patterns"])
    metrics = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "device": str(device),
        "best_epoch": best_epoch,
        "best_validation_loss": rounded(best_validation_loss),
        "split_samples": {name: int(len(indices)) for name, indices in splits.items()},
        "positive_class_weights": {pattern: rounded(weight) for pattern, weight in zip(artifacts.manifest["patterns"], positive_weights)},
        "test": {**test_loss, **test_metrics},
    }
    checkpoint["metrics"] = metrics
    torch.save(checkpoint, checkpoint_path)
    (config.output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (config.output_dir / "training_history.json").write_text(json.dumps(history, indent=2), encoding="utf-8")
    training_config = asdict(config)
    training_config["dataset_dir"] = str(config.dataset_dir)
    training_config["output_dir"] = str(config.output_dir)
    (config.output_dir / "training_config.json").write_text(json.dumps(training_config, indent=2), encoding="utf-8")
    print(
        f"[NEURAL_CHART] Saved model to {checkpoint_path} "
        f"(best_epoch={best_epoch}, test_loss={test_loss['loss']:.5f})"
    )
    return metrics


def parse_args() -> TrainingConfig:
    parser = argparse.ArgumentParser(description="Train the Phase 2 Neural Chart Vision model.")
    parser.add_argument("--dataset-dir", default="dataset/neural_chart_vision")
    parser.add_argument("--output-dir", default="models/neural_chart_vision/v1")
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--transformer-layers", type=int, default=3)
    parser.add_argument("--transformer-heads", type=int, default=4)
    parser.add_argument("--dropout", type=float, default=0.15)
    parser.add_argument("--image-encoder-width", type=int, default=24)
    parser.add_argument("--regression-weight", type=float, default=0.5)
    parser.add_argument("--patience", type=int, default=8)
    parser.add_argument("--validation-fraction", type=float, default=0.15)
    parser.add_argument("--test-fraction", type=float, default=0.15)
    parser.add_argument("--embargo-days", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", default="auto", help="auto, cpu, cuda, or a valid torch device")
    parser.add_argument("--sequence-only", action="store_true")
    parser.add_argument("--num-workers", type=int, default=0)
    args = parser.parse_args()

    if args.epochs < 1 or args.batch_size < 1 or args.patience < 1:
        parser.error("epochs, batch-size, and patience must be positive")
    if args.hidden_dim < 16 or args.transformer_layers < 1 or args.transformer_heads < 1:
        parser.error("hidden-dim must be at least 16 and Transformer settings must be positive")
    if args.num_workers < 0 or args.regression_weight < 0:
        parser.error("num-workers and regression-weight cannot be negative")

    return TrainingConfig(
        dataset_dir=Path(args.dataset_dir),
        output_dir=Path(args.output_dir),
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        hidden_dim=args.hidden_dim,
        transformer_layers=args.transformer_layers,
        transformer_heads=args.transformer_heads,
        dropout=args.dropout,
        image_encoder_width=args.image_encoder_width,
        regression_weight=args.regression_weight,
        patience=args.patience,
        validation_fraction=args.validation_fraction,
        test_fraction=args.test_fraction,
        embargo_days=args.embargo_days,
        seed=args.seed,
        device=args.device,
        sequence_only=args.sequence_only,
        num_workers=args.num_workers,
    )


if __name__ == "__main__":
    train(parse_args())
