"""
Chronos Observatory — Astronomical Validation
Run: python3 validate_astronomy.py
Compare output with Stellarium / Astro-Seek / Swiss Ephemeris reference
"""
import swisseph as swe
import math
from datetime import datetime, timezone

swe.set_ephe_path('/usr/share/ephe')

AYANAMSHA = swe.SIDM_FAGAN_BRADLEY

TEST_CASES = [
    {
        "name": "Gdańsk NOW",
        "dt": datetime.now(timezone.utc),
        "lat": 54.35, "lon": 18.65,
    },
    {
        "name": "Greenwich 2000-01-01 12:00 UTC (J2000)",
        "dt": datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        "lat": 51.4769, "lon": 0.0,
    },
    {
        "name": "Equator 2024-03-20 03:06 UTC (equinox)",
        "dt": datetime(2024, 3, 20, 3, 6, 0, tzinfo=timezone.utc),
        "lat": 0.0, "lon": 0.0,
    },
    {
        "name": "High latitude — Reykjavik 2024-06-21",
        "dt": datetime(2024, 6, 21, 12, 0, 0, tzinfo=timezone.utc),
        "lat": 64.13, "lon": -21.82,
    },
]

PLANETS = [
    (swe.SUN,     "Sun"),
    (swe.MOON,    "Moon"),
    (swe.MERCURY, "Mercury"),
    (swe.VENUS,   "Venus"),
    (swe.MARS,    "Mars"),
    (swe.JUPITER, "Jupiter"),
    (swe.SATURN,  "Saturn"),
    (swe.URANUS,  "Uranus"),
    (swe.NEPTUNE, "Neptune"),
    (swe.PLUTO,   "Pluto"),
]

def jd(dt):
    return swe.julday(dt.year, dt.month, dt.day,
                      dt.hour + dt.minute/60 + dt.second/3600)

def run(tc):
    print(f"\n{'='*60}")
    print(f"  {tc['name']}")
    print(f"  UTC: {tc['dt'].strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Lat: {tc['lat']}  Lon: {tc['lon']}")
    print(f"{'='*60}")

    jd_ut = jd(tc['dt'])
    print(f"  Julian Day (UT): {jd_ut:.6f}")

    swe.set_sid_mode(AYANAMSHA)
    ayan = swe.get_ayanamsa_ut(jd_ut)
    print(f"  Ayanamsha (Fagan/Bradley): {ayan:.6f}°")

    # Houses (Placidus)
    cusps, ascmc = swe.houses(jd_ut, tc['lat'], tc['lon'], b'P')
    asc_trop = ascmc[0]
    mc_trop  = ascmc[1]
    asc_sid  = (asc_trop - ayan) % 360
    mc_sid   = (mc_trop  - ayan) % 360
    print(f"\n  ASC tropical: {asc_trop:.4f}°  sidereal: {asc_sid:.4f}°")
    print(f"  MC  tropical: {mc_trop:.4f}°   sidereal: {mc_sid:.4f}°")

    print(f"\n  {'Planet':<10} {'Trop.lon':>10} {'Sid.lon':>10} {'RA':>10} {'Dec':>8} {'Alt':>8} {'Az':>8} {'Speed':>8}")
    print(f"  {'-'*74}")

    for pid, pname in PLANETS:
        # Tropical
        res, _ = swe.calc_ut(jd_ut, pid, swe.FLG_SPEED)
        trop_lon = res[0]
        speed    = res[3]
        sid_lon  = (trop_lon - ayan) % 360

        # RA/Dec
        res_eq, _ = swe.calc_ut(jd_ut, pid, swe.FLG_EQUATORIAL)
        ra  = res_eq[0]
        dec = res_eq[1]

        # Alt/Az
        geopos = (tc['lon'], tc['lat'], 0)
        atm    = (1013.25, 15.0)
        res_topo = swe.azalt(jd_ut, swe.ECL2HOR, geopos, atm[0], atm[1], [trop_lon, res[1], res[2]])
        az  = res_topo[0]
        alt = res_topo[1]

        print(f"  {pname:<10} {trop_lon:>10.4f} {sid_lon:>10.4f} {ra:>10.4f} {dec:>8.4f} {alt:>8.2f} {az:>8.2f} {speed:>8.4f}")

    # Moon phase
    res_sun,  _ = swe.calc_ut(jd_ut, swe.SUN,  0)
    res_moon, _ = swe.calc_ut(jd_ut, swe.MOON, 0)
    phase_angle = (res_moon[0] - res_sun[0]) % 360
    illumination = (1 - math.cos(math.radians(phase_angle))) / 2 * 100
    print(f"\n  Moon phase angle: {phase_angle:.2f}°  Illumination: {illumination:.1f}%")

for tc in TEST_CASES:
    try:
        run(tc)
    except Exception as e:
        print(f"  ERROR: {e}")

print("\n\nDone. Compare with Stellarium / Astro-Seek for validation.")
