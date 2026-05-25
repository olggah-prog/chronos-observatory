
## Local Development

```bash
# One command to start everything:
./dev.sh
```

This starts:
- **Backend** (FastAPI + Swiss Ephemeris) on `http://localhost:8000`
- **Frontend** (React + Vite) on `http://localhost:3000`

Stop with `Ctrl+C`.

### Claude Code
Use Claude Code for editing and assistance only.
The servers are managed by `./dev.sh` — not by Claude Code.

# Chronos Observatory

A FastAPI backend for real-time and historical planetary positions using the Swiss Ephemeris.

## Requirements

- Python 3.9+
- See `requirements.txt`

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

## Endpoints

### `GET /`

Health check.

```json
{"service": "Chronos Observatory", "version": "1.0.0"}
```

### `GET /sky`

Returns current planetary positions (Sun, Moon, and all planets).

**Query parameters:**

| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| `dt`      | string | No       | UTC datetime in ISO 8601 (e.g. `2026-05-20T12:00:00`). Defaults to now. |

**Example request:**

```
GET /sky
GET /sky?dt=2026-05-20T12:00:00
```

**Example response:**

```json
{
  "timestamp_utc": "2026-05-20T12:00:00+00:00",
  "julian_day": 2461182.0,
  "planets": [
    {
      "name": "Sun",
      "longitude": 59.1234,
      "latitude": 0.0001,
      "distance_au": 1.011,
      "speed_deg_per_day": 0.9653,
      "zodiac_sign": "Taurus",
      "retrograde": false
    }
  ]
}
```

## Interactive Docs

FastAPI auto-generates docs at `http://localhost:8000/docs`.
