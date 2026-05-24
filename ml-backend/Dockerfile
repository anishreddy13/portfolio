# ─────────────────────────────────────────────────────────────
# Hugging Face Spaces — Background Worker
# Runs: data_ingestion + prediction_worker combined
#
# WHY DOCKERFILE ON HF SPACES:
# HF Spaces supports Docker natively.
# We get full control over Python version,
# dependencies, and startup command.
# ─────────────────────────────────────────────────────────────

FROM python:3.11.7-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data (needed by model.py)
RUN python -c "import nltk; \
    nltk.download('stopwords'); \
    nltk.download('wordnet'); \
    nltk.download('omw-1.4')"

# Copy all backend files
COPY . .

# ─────────────────────────────────────────────────────────────
# HF Spaces requires port 7860 to be exposed
# even for background workers
# ─────────────────────────────────────────────────────────────
EXPOSE 7860

# Start combined workers
CMD ["python", "start_workers.py"]