from datetime import datetime, timezone
from typing import Optional

import swisseph as swe

PLANETS = {
    "Sun":    swe.SUN,
    "Moon":   swe.MOON,
    "Mercury":swe.MERCURY,
    "Venus":  swe.VENUS,
    "Mars":   swe.MARS,
    "Jupiter":swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune":swe.NEPTUNE,
    "Pluto":  swe.PLUTO,
    "NNode":  swe.MEAN_NODE,   # Mean Lunar North Node
}

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

INNER_PLANETS = {"Mercury", "Venus"}


def _zodiac_sign(longitude: float) -> str:
    return ZODIAC_SIGNS[int(longitude / 30) % 12]


def get_sky_snapshot(
    dt: Optional[datetime] = None,
    observer_lat: float = 54.35,    # Gdańsk
    observer_lon: float = 18.65,
) -> dict:
    if dt is None:
        dt = datetime.now(timezone.utc)

    jd = swe.julday(
        dt.year, dt.month, dt.day,
        dt.hour + dt.minute / 60.0 + dt.second / 3600.0,
    )

    geopos = [observer_lon, observer_lat, 0.0]

    sun_ecl, _ = swe.calc_ut(jd, swe.SUN)
    sun_lon = sun_ecl[0]

    planets = []
    for name, planet_id in PLANETS.items():
        ecl, _ = swe.calc_ut(jd, planet_id)
        lon, lat, dist, speed = ecl[0], ecl[1], ecl[2], ecl[3]

        # Altitude / azimuth (xin needs lon, lat, dist)
        xaz = swe.azalt(jd, swe.ECL2HOR, geopos, 1013.25, 15.0, [lon, lat, dist])
        azimuth = round(xaz[0], 2)
        altitude = round(xaz[1], 2)
        above_horizon = altitude > 0

        # Elongation: absolute angular distance from the Sun
        delta = (lon - sun_lon + 360.0) % 360.0
        elongation = round(delta if delta <= 180.0 else 360.0 - delta, 2)
        eastern = delta <= 180.0  # planet east of Sun

        # Visible: above horizon and not lost in solar glare
        # Nodes are abstract points — no solar-glare check applies
        if name in ("Sun", "NNode"):
            visible = above_horizon
        else:
            visible = above_horizon and elongation > 10.0

        entry = {
            "name": name,
            "longitude": round(lon, 4),
            "latitude": round(lat, 4),
            "distance_au": round(dist, 6),
            "speed_deg_per_day": round(speed, 6),
            "zodiac_sign": _zodiac_sign(lon),
            "retrograde": speed < 0,
            "altitude": altitude,
            "azimuth": azimuth,
            "above_horizon": above_horizon,
            "elongation_from_sun": elongation,
            "visible": visible,
        }

        # Morning / evening star applies only to inner planets
        if name in INNER_PLANETS:
            entry["morning_star"] = not eastern   # west of Sun → rises before Sun
            entry["evening_star"] = eastern        # east of Sun → sets after Sun

        # Moon illuminated fraction via pheno_ut (flat 20-tuple, index 1)
        if name == "Moon":
            pheno = swe.pheno_ut(jd, planet_id, swe.FLG_SWIEPH)
            entry["illumination_pct"] = round(pheno[1] * 100, 1)

        planets.append(entry)

    # South Node — derived from North Node (always 180° opposite, same abs. lat)
    nnode = next((p for p in planets if p["name"] == "NNode"), None)
    if nnode:
        slon = (nnode["longitude"] + 180.0) % 360.0
        sxaz = swe.azalt(jd, swe.ECL2HOR, geopos, 1013.25, 15.0, [slon, 0.0, 1.0])
        salt = round(sxaz[1], 2)
        planets.append({
            "name": "SNode",
            "longitude": round(slon, 4),
            "latitude": 0.0,
            "distance_au": nnode["distance_au"],
            "speed_deg_per_day": nnode["speed_deg_per_day"],
            "zodiac_sign": _zodiac_sign(slon),
            "retrograde": nnode["retrograde"],
            "altitude": salt,
            "azimuth": round(sxaz[0], 2),
            "above_horizon": salt > 0,
            "elongation_from_sun": 0.0,
            "visible": salt > 0,
        })

    # Four main angles (Placidus) with sky positions
    try:
        _, ascmc = swe.houses(jd, observer_lat, observer_lon, b"P")
        asc = round(ascmc[0] % 360, 3)
        mc  = round(ascmc[1] % 360, 3)
    except Exception:
        asc, mc = 0.0, 0.0

    angles = {"asc": asc, "dsc": round((asc + 180) % 360, 3),
              "mc":  mc,  "ic":  round((mc  + 180) % 360, 3)}

    # Alt/az for each angle so the sky map can place them
    for key, lon in [("asc", asc), ("dsc", angles["dsc"]),
                     ("mc",  mc),  ("ic",  angles["ic"])]:
        try:
            xaz = swe.azalt(jd, swe.ECL2HOR, geopos, 1013.25, 15.0, [lon, 0.0, 1.0])
            angles[f"{key}_az"]  = round(xaz[0], 2)
            angles[f"{key}_alt"] = round(xaz[1], 2)
        except Exception:
            angles[f"{key}_az"]  = 0.0
            angles[f"{key}_alt"] = -90.0

    return {
        "timestamp_utc": dt.isoformat(),
        "julian_day": round(jd, 6),
        "observer": {"lat": observer_lat, "lon": observer_lon},
        "angles": angles,
        "planets": planets,
    }
