from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sky_engine import get_sky_snapshot

app = FastAPI(
    title="Chronos Observatory",
    description="Real-time and historical planetary positions via Swiss Ephemeris.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "Chronos Observatory", "version": "1.0.0"}


@app.get("/sky")
def sky(
    dt: Optional[str] = Query(
        None,
        description="UTC datetime in ISO 8601 format (e.g. 2026-05-20T12:00:00). Defaults to now.",
    ),
    lat: float = Query(54.35,  description="Observer latitude in decimal degrees."),
    lon: float = Query(18.65,  description="Observer longitude in decimal degrees."),
):
    parsed_dt = None
    if dt:
        try:
            parsed_dt = datetime.fromisoformat(dt).replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid datetime format: '{dt}'. Use ISO 8601, e.g. 2026-05-20T12:00:00",
            )

    return get_sky_snapshot(parsed_dt, observer_lat=lat, observer_lon=lon)
