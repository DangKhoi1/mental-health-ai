# ── Python AI Service ─────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Cài dependencies trước để tận dụng cache layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK & TextBlob data
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True)"
RUN python -c "from textblob import download_corpora; download_corpora()" 2>/dev/null || true

COPY . .

EXPOSE 5001

ENV APP_ENV=production
ENV PORT=5001
ENV WORKERS=2

CMD ["python", "main.py"]
