from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

from plant_dataset import (
    DEFAULT_IMAGE_SIZE,
    build_plant_preprocessing,
    save_class_mapping,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_DIR = PROJECT_ROOT / "datasets" / "plant_dataset"
DEFAULT_MAPPING_PATH = Path(__file__).resolve().parent / "plant_class_to_idx.json"


def format_distribution(title: str, counts: Counter[str]) -> None:
    print(f"\n{title}")
    print("-" * len(title))
    for class_name, count in sorted(counts.items()):
        print(f"{class_name}: {count}")


def collect_dataset_counts(dataset) -> Counter[str]:
    return Counter(record.class_name for record in dataset.records)


def print_preprocessing_stats(bundle, mapping_path: Path, use_weighted_sampler: bool) -> None:
    train_counts = collect_dataset_counts(bundle.train_dataset)
    val_counts = collect_dataset_counts(bundle.val_dataset)
    test_counts = collect_dataset_counts(bundle.test_dataset)
    total_counts = train_counts + val_counts + test_counts
    total_images = sum(total_counts.values())
    min_class = min(total_counts.items(), key=lambda item: item[1])
    max_class = max(total_counts.items(), key=lambda item: item[1])
    imbalance_ratio = max_class[1] / min_class[1]

    print("\nPlant Disease Preprocessing Summary")
    print("=" * 36)
    print(f"Classes: {len(bundle.class_to_idx)}")
    print(f"Valid images: {total_images}")
    print(f"Ignored files: {len(bundle.ignored_files)}")
    print(f"Train images: {len(bundle.train_dataset)}")
    print(f"Validation images: {len(bundle.val_dataset)}")
    print(f"Test images: {len(bundle.test_dataset)}")
    print(f"Image size: {DEFAULT_IMAGE_SIZE}x{DEFAULT_IMAGE_SIZE}")
    print("Normalization: ImageNet mean/std")
    print("Train augmentation: resize, flips, rotation, color jitter")
    print(f"Imbalance handling: {'weighted sampler + class weights' if use_weighted_sampler else 'class weights only'}")
    print(f"Smallest class: {min_class[0]} ({min_class[1]})")
    print(f"Largest class: {max_class[0]} ({max_class[1]})")
    print(f"Imbalance ratio: {imbalance_ratio:.2f}x")
    print(f"Class mapping saved: {mapping_path}")

    format_distribution("Total class distribution", total_counts)
    format_distribution("Train class distribution", train_counts)
    format_distribution("Validation class distribution", val_counts)
    format_distribution("Test class distribution", test_counts)

    print("\nClass weights")
    print("-------------")
    idx_to_class = {idx: class_name for class_name, idx in bundle.class_to_idx.items()}
    for idx, weight in enumerate(bundle.class_weights.tolist()):
        print(f"{idx_to_class[idx]}: {weight:.4f}")

    if bundle.ignored_files:
        print("\nIgnored files")
        print("-------------")
        for ignored in bundle.ignored_files[:20]:
            print(f"{ignored.reason}: {ignored.path}")
        if len(bundle.ignored_files) > 20:
            print(f"... {len(bundle.ignored_files) - 20} more")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare PyTorch dataloaders for the plant disease dataset without training."
    )
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATASET_DIR)
    parser.add_argument("--mapping-path", type=Path, default=DEFAULT_MAPPING_PATH)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--validation-workers", type=int, default=None)
    parser.add_argument("--val-size", type=float, default=0.15)
    parser.add_argument("--test-size", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--no-weighted-sampler",
        action="store_true",
        help="Use class weights only and leave the train loader shuffled.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    use_weighted_sampler = not args.no_weighted_sampler

    bundle = build_plant_preprocessing(
        dataset_dir=args.data_dir,
        batch_size=args.batch_size,
        num_workers=args.num_workers,
        image_size=DEFAULT_IMAGE_SIZE,
        val_size=args.val_size,
        test_size=args.test_size,
        random_state=args.seed,
        use_weighted_sampler=use_weighted_sampler,
        validation_workers=args.validation_workers,
    )

    save_class_mapping(bundle.class_to_idx, args.mapping_path)
    print_preprocessing_stats(bundle, args.mapping_path, use_weighted_sampler)


if __name__ == "__main__":
    main()
