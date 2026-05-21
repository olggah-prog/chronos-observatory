FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Verify pyswisseph imported successfully at build time
RUN python -c "import swisseph; print('swisseph OK')"

COPY . .

# Shell form so $PORT is expanded from Railway's runtime environment
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
