"""
Dataset acquisition, validation, and audit for AH&AITD (Arslan's Human and AI Text Database).
Downloads from Zenodo (CC BY 4.0), verifies MD5 checksum, audits data quality,
and produces dataset_manifest.json.
"""
import hashlib
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, Any, Tuple

import pandas as pd
import requests

try:
    from authorship.config import (
        DATA_DIR,
        RAW_DATASET_PATH,
        DATASET_NAME,
        DATASET_URL,
        DATASET_API_URL,
        DATASET_DOI,
        DATASET_LICENSE,
        EXPECTED_MD5,
        DATASET_MANIFEST_PATH,
        RANDOM_SEED
    )
except ImportError:
    from config import (
        DATA_DIR,
        RAW_DATASET_PATH,
        DATASET_NAME,
        DATASET_URL,
        DATASET_API_URL,
        DATASET_DOI,
        DATASET_LICENSE,
        EXPECTED_MD5,
        DATASET_MANIFEST_PATH,
        RANDOM_SEED
    )

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def compute_md5(file_path: Path) -> str:
    """Compute MD5 checksum of a file in chunks."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def download_dataset(force: bool = False) -> Path:
    """
    Download Dataset.xlsx from Zenodo if not present.
    Verifies MD5 checksum against published record.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if RAW_DATASET_PATH.exists() and not force:
        logger.info(f"Dataset already exists at {RAW_DATASET_PATH} ({RAW_DATASET_PATH.stat().st_size} bytes)")
        actual_md5 = compute_md5(RAW_DATASET_PATH)
        if actual_md5 == EXPECTED_MD5:
            logger.info("MD5 checksum verified successfully.")
            return RAW_DATASET_PATH
        else:
            logger.warning(f"MD5 mismatch (got {actual_md5}, expected {EXPECTED_MD5}). Re-downloading...")

    urls = [DATASET_URL, DATASET_API_URL]
    download_success = False
    for url in urls:
        logger.info(f"Downloading from {url}...")
        try:
            with requests.get(url, stream=True, timeout=120) as r:
                r.raise_for_status()
                total_size = int(r.headers.get("content-length", 0))
                downloaded = 0
                with open(RAW_DATASET_PATH, "wb") as f:
                    for chunk in r.iter_content(chunk_size=1024 * 512):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0 and downloaded % (1024 * 1024 * 5) < 1024 * 512:
                                logger.info(f"Downloaded {downloaded / (1024*1024):.1f} / {total_size / (1024*1024):.1f} MB")
            download_success = True
            break
        except Exception as e:
            logger.warning(f"Download failed from {url}: {e}")

    if not download_success or not RAW_DATASET_PATH.exists():
        raise RuntimeError("Failed to download dataset from all Zenodo endpoints.")

    actual_md5 = compute_md5(RAW_DATASET_PATH)
    logger.info(f"Download finished. File size: {RAW_DATASET_PATH.stat().st_size} bytes, MD5: {actual_md5}")
    if actual_md5 != EXPECTED_MD5:
        logger.warning(f"MD5 checksum ({actual_md5}) differs from expected ({EXPECTED_MD5}). Proceeding with caution.")
    else:
        logger.info("MD5 checksum matches published Zenodo record.")

    return RAW_DATASET_PATH


def audit_and_prepare_dataset(file_path: Path) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Load raw Excel dataset, inspect sheets and columns,
    check class distributions, empty rows, duplicate texts, and label consistency.
    Returns clean DataFrame and audit manifest dictionary.
    """
    logger.info(f"Loading raw Excel workbook from {file_path}...")
    excel_file = pd.ExcelFile(file_path)
    logger.info(f"Sheets found: {excel_file.sheet_names}")

    # Load main sheet (first sheet or named sheet)
    sheet_name = excel_file.sheet_names[0]
    df_raw = pd.read_excel(excel_file, sheet_name=sheet_name)
    logger.info(f"Raw shape: {df_raw.shape}, Columns: {list(df_raw.columns)}")

    raw_count = len(df_raw)
    columns_info = {col: str(df_raw[col].dtype) for col in df_raw.columns}

    # Identify relevant columns
    # Common column names in AH&AITD: 'Text', 'Label', 'Source'/'Domain', 'Model'
    text_col = None
    label_col = None
    source_col = None
    model_col = None

    for col in df_raw.columns:
        col_lower = str(col).strip().lower()
        if "text" in col_lower or "content" in col_lower or "essay" in col_lower or "sample" in col_lower:
            text_col = col
        elif "label" in col_lower or "class" in col_lower or "target" in col_lower:
            label_col = col
        elif "source" in col_lower or "domain" in col_lower or "category" in col_lower:
            source_col = col
        elif "model" in col_lower or "generator" in col_lower:
            model_col = col

    # Fallback by column position if not matched by name
    if text_col is None:
        text_col = df_raw.columns[0]
    if label_col is None:
        label_col = df_raw.columns[1]

    logger.info(f"Identified columns: Text='{text_col}', Label='{label_col}', Source='{source_col}', Model='{model_col}'")

    # Audit nulls and empty strings
    null_texts = int(df_raw[text_col].isna().sum())
    null_labels = int(df_raw[label_col].isna().sum())

    df = df_raw.dropna(subset=[text_col, label_col]).copy()
    df[text_col] = df[text_col].astype(str).str.strip()
    df = df[df[text_col].str.len() > 0].copy()
    empty_removed = raw_count - len(df)

    # Standardize label: AI = 1, Human = 0
    raw_labels = df[label_col].value_counts().to_dict()
    logger.info(f"Raw label distribution: {raw_labels}")

    def normalize_label(val):
        val_str = str(val).strip().lower()
        if val_str in ["1", "1.0", "ai", "ai-generated", "ai_generated", "generated", "machine", "synthetic", "gpt"]:
            return 1
        elif val_str in ["0", "0.0", "human", "human-written", "human_written", "real", "original"]:
            return 0
        else:
            raise ValueError(f"Unknown label value: {val}")

    df["target"] = df[label_col].apply(normalize_label)
    df["clean_text"] = df[text_col]

    # Check duplicates
    total_samples = len(df)
    unique_texts = df["clean_text"].nunique()
    exact_duplicates_count = total_samples - unique_texts
    logger.info(f"Total valid samples: {total_samples}, Unique texts: {unique_texts}, Exact duplicates: {exact_duplicates_count}")

    # Check for conflicting labels among duplicates
    conflicting_labels = 0
    grouped = df.groupby("clean_text")["target"].nunique()
    conflicts = grouped[grouped > 1]
    conflicting_labels = len(conflicts)
    if conflicting_labels > 0:
        logger.warning(f"Found {conflicting_labels} duplicate texts with conflicting labels! Removing conflicts.")
        conflict_texts = set(conflicts.index)
        df = df[~df["clean_text"].isin(conflict_texts)].copy()

    # Deduplicate exact texts, keeping first occurrence
    df = df.drop_duplicates(subset=["clean_text"]).copy()
    dedup_count = len(df)

    # Compute text statistics
    df["char_len"] = df["clean_text"].str.len()
    df["word_count"] = df["clean_text"].apply(lambda t: len(t.split()))

    class_distribution = {
        "Human (0)": int((df["target"] == 0).sum()),
        "AI (1)": int((df["target"] == 1).sum())
    }

    # Domain / Source breakdown
    source_distribution = {}
    if source_col and source_col in df.columns:
        source_distribution = df[source_col].value_counts().to_dict()

    # Model / Generator breakdown
    model_distribution = {}
    if model_col and model_col in df.columns:
        model_distribution = df[model_col].value_counts().to_dict()

    audit_manifest = {
        "dataset_name": DATASET_NAME,
        "source_url": DATASET_URL,
        "doi": DATASET_DOI,
        "license": DATASET_LICENSE,
        "md5_checksum": EXPECTED_MD5,
        "raw_sample_count": raw_count,
        "raw_columns": list(columns_info.keys()),
        "columns_dtypes": columns_info,
        "detected_text_column": str(text_col),
        "detected_label_column": str(label_col),
        "detected_source_column": str(source_col) if source_col else None,
        "detected_model_column": str(model_col) if model_col else None,
        "null_texts_removed": null_texts,
        "null_labels_removed": null_labels,
        "empty_texts_removed": empty_removed,
        "exact_duplicates_removed": exact_duplicates_count,
        "conflicting_duplicate_texts_removed": conflicting_labels,
        "final_clean_sample_count": dedup_count,
        "final_class_distribution": class_distribution,
        "text_statistics": {
            "char_len_min": int(df["char_len"].min()),
            "char_len_mean": float(df["char_len"].mean()),
            "char_len_median": float(df["char_len"].median()),
            "char_len_max": int(df["char_len"].max()),
            "word_count_min": int(df["word_count"].min()),
            "word_count_mean": float(df["word_count"].mean()),
            "word_count_median": float(df["word_count"].median()),
            "word_count_max": int(df["word_count"].max()),
        },
        "source_distribution": {str(k): int(v) for k, v in source_distribution.items()},
        "model_distribution": {str(k): int(v) for k, v in model_distribution.items()}
    }

    # Save manifest
    with open(DATASET_MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(audit_manifest, f, indent=2)
    logger.info(f"Saved dataset manifest to {DATASET_MANIFEST_PATH}")

    return df, audit_manifest


if __name__ == "__main__":
    logger.info("Starting dataset acquisition...")
    path = download_dataset()
    df_clean, manifest = audit_and_prepare_dataset(path)
    logger.info("Dataset acquisition and audit complete.")
    logger.info(f"Clean samples: {len(df_clean)}, Distribution: {manifest['final_class_distribution']}")
