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
