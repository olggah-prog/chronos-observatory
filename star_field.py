import json, swisseph as swe
from pathlib import Path

_STARS = None

def _load_stars():
    global _STARS
    if _STARS is None:
        p = Path(__file__).parent / "data" / "stars_v1.json"
        _STARS = json.loads(p.read_text())
    return _STARS

def get_star_field(jd_ut, lat, lon, mag_limit=5.5):
    stars = _load_stars()
    result = []
    geopos = (lon, lat, 0)
    atm = (1013.25, 15.0)
    for s in stars:
        if s["mag"] > mag_limit: continue
        if s["name"] == "Sol": continue
        ra_deg = s["ra"] * 15.0
        dec_deg = s["dec"]
        try:
            res = swe.azalt(jd_ut, swe.EQU2HOR, geopos, atm[0], atm[1],
                            [ra_deg, dec_deg, 1.0])
            alt = round(res[1], 2)
            az  = round(res[0], 2)
            result.append({
                "hip":  s["hip"],
                "name": s["name"],
                "ra":   s["ra"],
                "dec":  s["dec"],
                "mag":  s["mag"],
                "con":  s["con"],
                "alt":  alt,
                "az":   az,
            })
        except:
            continue
    return result
