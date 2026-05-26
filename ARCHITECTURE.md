# Chronos Observatory — Architecture & Roadmap

## Core Principle

Chronos is an observatory OS, a temporal perception interface, a cinematic sky instrument, a symbolic + astronomical sky engine.

## Current Priority

Stabilize before adding layers:
- coordinate pipeline
- display transform
- zodiac transform
- stable render architecture

## Critical Architecture Task

Build centralized display coordinate pipeline:
## Sky Frame Modes

Two modes — both architecturally correct:

**Observer Mode** — ASC fixed left, stable horizon, embodied orientation
**Celestial Mode** — rotating astronomical horizon, true celestial geometry

Implementation rule: centralized `getDisplayLon()` / `getDisplayPoint()` — NOT SVG group rotate, NOT mutating lonXY.

## Phase Roadmap

**Phase 1** — Core pipeline (coordinate + display + zodiac transforms)
**Phase 2** — Cosmogram (aspects, houses, Placidus, ASC/DSC/MC/IC polish, optional bodies)
**Phase 3** — Real sky expansion (constellation lines, ecliptic, meridian, parans)
**Phase 4** — Cultural layers (Egyptian, Maya, Jyotisha, etc) — only after stable engine

## Atmosphere States

Not "themes" — states of the atmosphere of time:
- **Day** — airy pale blue, cold light, white amber horizon
- **Dusk** — purple + rose + amber, cinematic haze
- **Night** — deep navy, near-space, transparent cosmogram

## UI Rules

- cosmogram center never black — glass-like hub
- wheel interior dissolves into background
- no upside-down labels
- no detached coordinates
- real sky panel is the primary atmosphere carrier

## Astronomical Engine Strategy

### Core: Swiss Ephemeris
Primary backend for all calculations:
- planets, Moon, Sun
- sidereal/tropical zodiac
- houses, ASC/MC
- aspects, parans

### Validation references
- Stellarium — golden test comparisons (longitude, RA/Dec, alt/az, Moon phase)
- NASA Horizons — high-precision cross-check
- Swiss Ephemeris CLI — direct ephemeris baseline

### Real Sky inspiration from Stellarium
- atmosphere, horizon, twilight logic
- constellation lines and star catalog (RA/Dec, proper motion, magnitude)
- refraction / extinction / visibility modeling
- rise/set/culmination

### Future: Premium Accuracy Mode
- optional JPL DE440/DE441 ephemerides
- atmospheric refraction corrections
- heliacal visibility with magnitude + twilight + Moon phase

### What Chronos is NOT
- Not a Stellarium clone
- Not copying Stellarium rendering
- Chronos is its own engine, validated against external references

## Accuracy Policy

### Confidence Zones

| Zone | Range | Backend | Notes |
|------|-------|---------|-------|
| Modern | 1550–2650 CE | Swiss Ephemeris / DE440 | Max confidence, cross-validate with Stellarium + NASA Horizons |
| Historical | −13200–+17191 | Swiss Ephemeris / DE431/DE441 | Reliable, but less cross-reference available |
| Deep Time | outside above | Swiss Ephemeris long-range | Model-based, show confidence indicator in UI |

### Core Principle
**Chronos should never silently degrade.**

If date range or calculation confidence changes, the UI must reflect it:
- Modern range → no indicator needed
- Historical range → subtle "Historical model" note
- Deep time → visible "Deep-time model" indicator

### NOT like Time Nomad
No artificial "1500 CE limit".
Chronos is a serious time instrument — full Swiss Ephemeris range available,
with honest confidence labeling per zone.

### Validation Pipeline
1. Primary: Swiss Ephemeris (always)
2. Cross-check: Stellarium golden tests
3. High-precision: NASA Horizons (spot checks)
4. Future: optional JPL DE440/DE441 for Modern zone
