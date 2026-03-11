FROM python:3.12-slim

WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev deps, no virtualenv in container)
RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --no-root

# Copy application code
COPY app/ ./app/

# Create data directory for persistent SQLite database
RUN mkdir -p /data

# Expose port
EXPOSE 8000

# Start the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
