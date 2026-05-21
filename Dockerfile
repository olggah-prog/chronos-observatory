FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    libsqlite3-dev \
    gcc \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "import swisseph; print('swisseph OK')"

COPY . .

RUN cd /app/frontend && npm install && npm run build

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

ENV EPHE_PATH=/app/ephe
