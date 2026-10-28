# Dataset Attribution and Provenance

## AH&AITD — Arslan's Human and AI Text Database

### Provenance & Citation
- **Dataset Title:** AH&AITD – Arslan's Human and AI Text Database
- **Persistent Identifier (DOI):** [10.5281/zenodo.15506369](https://doi.org/10.5281/zenodo.15506369)
- **Zenodo Archive:** [https://zenodo.org/records/15506369](https://zenodo.org/records/15506369)
- **Figshare Repository:** [https://figshare.com/articles/dataset/AH_AITD_Arslan_s_Human_and_AI_Text_Database/29144348](https://figshare.com/articles/dataset/AH_AITD_Arslan_s_Human_and_AI_Text_Database/29144348)
- **Declared License:** Creative Commons Attribution 4.0 International ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))

### BibTeX Citation
```bibtex
@dataset{arslan_2025_ah_aitd,
  author       = {Arslan, Muhammad},
  title        = {{AH&AITD – Arslan's Human and AI Text Database}},
  month        = jan,
  year         = 2025,
  publisher    = {Zenodo},
  doi          = {10.5281/zenodo.15506369},
  url          = {https://doi.org/10.5281/zenodo.15506369}
}
```

### Dataset Composition
The dataset contains 11,580 multi-domain text samples designed for benchmarking AI-generated text detection algorithms:

1. **Human-Written Samples (5,790 raw):**
   - Open Web Text (2,343 samples)
   - Opinion Statements (1,549 samples)
   - Q&A Platforms (670 samples)
   - News Articles (430 samples)
   - Web Text (397 samples)
   - Scientific Research Abstracts (205 samples)
   - Blogs (196 samples)

2. **AI-Generated Samples (5,790 raw):**
   - Paraphrase Models (1,694 samples)
   - ChatGPT (1,130 samples)
   - GPT-4 (744 samples)
   - DaVinci (GPT-3.5 variant) (433 samples)
   - OPT-IML (406 samples)
   - Flan-T5 (395 samples)
   - GPT-3.5 (364 samples)
   - GPT-2 (328 samples)
   - GPT-3 (296 samples)

### Data Audit Findings
- **Raw File:** `Dataset.xlsx` (21,413,357 bytes, MD5: `55f3d63b9c3fecfd9807fdd4b5473d3b`)
- **Null / Empty Texts:** 0
- **Null Labels:** 0
- **Exact Duplicates:** 25 duplicate texts identified and removed prior to train/val/test splitting to prevent data leakage.
- **Conflicting Labels:** 0
- **Clean Sample Count:** 11,555 unique texts (5,766 Human, 5,789 AI).
- **Text Length Statistics:**
  - Character length: Mean 4,295 chars (Median: 3,275 chars, Min: 1,379 chars, Max: 32,767 chars).
  - Word count: Mean 727 words (Median: 552 words, Min: 266 words, Max: 5,958 words).

### Licensing Compliance & Terms
Under CC BY 4.0, users are free to:
- **Share:** copy and redistribute the material in any medium or format.
- **Adapt:** remix, transform, and build upon the material for any purpose, including commercial.
- **Attribution:** Appropriate credit must be given, with a link to the license and an indication if changes were made.
- Raw dataset files are stored in gitignored local data directories (`ml-backend/data/`) and are not committed to source control.
