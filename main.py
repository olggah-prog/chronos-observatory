
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
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

@app.get("/debug/raw")
def debug_raw():
    import swisseph as swe, os
    swe.set_ephe_path(os.getenv("EPHE_PATH", "/app/ephe"))
    swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
    flag = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    results = {}
    for name in ["Aldebaran", "Regulus", "Spica"]:
        try:
            a, b, c = swe.fixstar2(name, 2451545.0, flag)
            results[name] = {
                "a_type": str(type(a)),
                "a_val": str(a)[:80],
                "b_type": str(type(b)),
                "b_val": str(b)[:80],
            }
        except Exception as e:
            results[name] = {"error": str(e)}
    return results


# Serve frontend
dist = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
if os.path.exists(dist):
    app.mount('/assets', StaticFiles(directory=os.path.join(dist, 'assets')), name='assets')
    @app.get('/{full_path:path}')
    def serve_frontend(full_path: str):
        index = os.path.join(dist, 'index.html')
        return FileResponse(index)
