from datetime import datetime, timezone
from typing import Optional

import os
import swisseph as swe

swe.set_ephe_path(os.getenv("EPHE_PATH", "/app/ephe"))
swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
AYANAMSHA_NAME = "fagan_bradley"
SIDEREAL_FLAG = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

PLANETS = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus":   swe.VENUS,
    "Mars":    swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn":  swe.SATURN,
    "Uranus":  swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto":   swe.PLUTO,
    "NNode":   swe.MEAN_NODE,
}

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

INNER_PLANETS = {"Mercury", "Venus"}

FIXED_STARS = [
    "Aldebaran",
    "Regulus",
    "Antares",
    "Fomalhaut",
    "Spica",
    "Alcyone",
    "Sirius",
    "Vega",
    "Arcturus",
    "Achernar",
    "Pollux",
    "Deneb",
]


def _zodiac_sign(longitude: float) -> str:
    return ZODIAC_SIGNS[int(longitude / 30) % 12]


def _angular_diff(a: float, b: float) -> float:
    diff = abs(a - b) % 360
    return diff if diff <= 180 else 360 - diff


def _is_applying(planet_speed: float, planet_lon: float, star_lon: float) -> bool:
    diff = (star_lon - planet_lon) % 360
    if planet_speed >= 0:
        return diff < 180
    return diff > 180


def _get_fixed_stars(jd: float, planet_data: list, orb: float = 2.0) -> dict:
    ayanamsha_value = round(swe.get_ayanamsa(jd), 6)
    stars = []
    conjunctions = []

    for name in FIXED_STARS:
        try:
            ret, xx, serr = swe.fixstar2(name, jd, SIDEREAL_FLAG)
            star_lon = xx[0]
            star_lat = xx[1]
            star_dist = xx[2]

            stars.append({
                "name":      name,
                "lon":       round(star_lon, 4),
                "lat":       round(star_lat, 4),
                "dist_pc":   round(star_dist, 4),
                "zodiac_sign": _zodiac_sign(star_lon),
            })

            for p in planet_data:
                p_lon   = p["longitude"]
                p_speed = p["speed_deg_per_day"]
                diff    = _angular_diff(p_lon, star_lon)
                if diff <= orb:
                    conjunctions.append({
                        "star":       name,
                        "planet":     p["name"],
                        "orb":        round(diff, 4),
                        "applying":   _is_applying(p_speed, p_lon, star_lon),
                        "star_lon":   round(star_lon, 4),
                        "planet_lon": round(p_lon, 4),
                    })
        except Exception as e:
            print("[fixed_stars] " + name + ": " + str(e))
            continue

    return {
        "meta": {
            "ayanamsha":       AYANAMSHA_NAME,
            "ayanamsha_value": ayanamsha_value,
            "zodiac":          "sidereal",
            "orb":             orb,
        },
        "stars":        stars,
        "conjunctions": sorted(conjunctions, key=lambda x: x["orb"]),
    }


def get_sky_snapshot(
    dt: Optional[datetime] = None,
    observer_lat: float = 54.35,
    observer_lon: float = 18.65,
) -> dict:
    if dt is None:
        dt = datetime.now(timezone.utc)

    jd = swe.julday(
        dt.year, dt.month, dt.day,
        dt.hour + dt.minute / 60.0 + dt.second / 3600.0,
    )

    geopos = [observer_lon, observer_lat, 0.0]

    sun_ecl = swe.calc_ut(jd, swe.SUN, SIDEREAL_FLAG)
    sun_lon = sun_ecl[0][0]

    planets = []
    for name, planet_id in PLANETS.items():
        ecl = swe.calc_ut(jd, planet_id, SIDEREAL_FLAG)
        lon   = ecl[0][0]
        lat   = ecl[0][1]
        dist  = ecl[0][2]
        speed = ecl[0][3]

        xaz = swe.azalt(jd, swe.ECL2HOR, geopos, 1013.25, 15.0, [lon, lat, dist])
        azimuth  = round(xaz[0], 2)
        altitude = round(xaz[1], 2)
        above_horizon = altitude > 0

        delta      = (lon - sun_lon + 360.0) % 360.0
        elongation = round(delta if delta <= 180.0 else 360.0 - delta, 2)
        eastern    = delta <= 180.0

        if name in ("Sun", "NNode"):
            visible = above_horizon
        else:
            visible = above_horizon and elongation > 10.0

        entry = {
            "name":                name,
            "longitude":           round(lon, 4),
            "latitude":            round(lat, 4),
            "distance_au":         round(dist, 6),
            "speed_deg_per_day":   round(speed, 6),
            "zodiac_sign":         _zodiac_sign(lon),
            "retrograde":          speed < 0,
            "altitude":            altitude,
            "azimuth":             azimuth,
            "above_horizon":       above_horizon,
            "elongation_from_sun": elongation,
            "visible":             visible,
        }

        if name in INNER_PLANETS:
            entry["morning_star"] = not eastern
            entry["evening_star"] = eastern

        if name == "Moon":
            pheno = swe.pheno_ut(jd, planet_id, swe.FLG_SWIEPH)
            entry["illumination_pct"] = round(pheno[1] * 100, 1)

        planets.append(entry)

    nnode = next((p for p in planets if p["name"] == "NNode"), None)
    if nnode:
        slon = (nnode["longitude"] + 180.0) % 360.0
        sxaz = swe.azalt(jd, swe.ECL2HOR, geopos, 1013.25, 15.0, [slon, 0.0, 1.0])
        salt = round(sxaz[1], 2)
        planets.append({
            "name":                "SNode",
            "longitude":           round(slon, 4),
            "latitude":            0.0,
            "distance_au":         nnode["distance_au"],
            "speed_deg_per_day":   nnode["speed_deg_per_day"],
            "zodiac_sign":         _zodiac_sign(slon),
            "retrograde":          nnode["retrograde"],
            "altitude":            salt,
            "azimuth":             round(sxaz[0], 2),
            "above_horizon":       salt > 0,
            "elongation_from_sun": 0.0,
            "visible":             salt > 0,
        })

    try:
        _, ascmc = swe.houses(jd, observer_lat, observer_lon, b"P")
        asc = round(ascmc[0] % 360, 3)
        mc  = round(ascmc[1] % 360, 3)
    except Exception:
        asc, mc = 0.0, 0.0

    angles = {"asc": asc, "dsc": round((asc + 180) % 360, 3),
              "mc":  mc,  "ic":  round((mc  + 180) % 360, 3)}

    for key, lon in [("asc", asc), ("dsc", angles["dsc"]),
                     ("mc",  mc),  ("ic",  angles["ic"])]:
        try:
            xaz = swe.azalt(jd, swe.ECL2HOR, geopos, 1013.25, 15.0, [lon, 0.0, 1.0])
            angles[key + "_az"]  = round(xaz[0], 2)
            angles[key + "_alt"] = round(xaz[1], 2)
        except Exception:
            angles[key + "_az"]  = 0.0
            angles[key + "_alt"] = -90.0

    stars_data = _get_fixed_stars(jd, planets)

    return {
        "timestamp_utc": dt.isoformat(),
        "julian_day":    round(jd, 6),
        "observer":      {"lat": observer_lat, "lon": observer_lon},
        "meta":          stars_data["meta"],
        "angles":        angles,
        "planets":       planets,
        "stars":         stars_data["stars"],
        "conjunctions":  stars_data["conjunctions"],
    }
