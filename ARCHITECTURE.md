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

## Current Development Priority

### NOW — RealSky Foundation

1. **Star projection** — stars rotate as sky dome (useStarFieldProjection)
2. **HYG star field** — real stars with magnitude, alt/az, visible flag
3. **Constellation lines** — IAU lines + labels + toggle
4. **Immersive Sky v1** — atmospheric gradient, horizon glow, bright star halo, depth

### NEXT — Cosmogram

5. Aspects (major + minor)
6. Houses (Placidus)
7. Chiron, Lilith, Nodes
8. Observer/Celestial mode (coordinate pipeline)

### LATER — Cultural layers

9. Parans, heliacal events
10. Egyptian, Maya, Jyotisha
11. Arabic cycles, decans

### The milestone that matters

Not "when houses are done."

When someone opens RealSky and thinks:
"This looks like the sky outside my window."

That is when Chronos becomes something different.

## Known issue — RealSky planets during Play

RealSky planet positions (alt/az) do not advance during Play.
Cause: server /sky fetch is frozen during playback (Play drives seekDt, not
selectedDt) to avoid the fetch-storm + animation-collision that made the
zodiac wheel jitter. Stars advance correctly because they are projected on the
frontend from masterTime via LST (useStarFieldProjection); planets still read
server-provided alt/az, which are not recomputed while fetch is frozen.

During manual scrub planets DO advance (server returns fresh frames per commit).

A frontend ecliptic->alt/az reprojection (usePlanetProjection) was attempted and
reverted: it produced an azimuth-reference mismatch (planets drifted sideways)
and fought lerpAngle on large steps. Do not reintroduce frontend planet
projection without first reconciling the azimuth convention against the server.

Next task — RealSky planets during Play:
  Implement a safe server throttle (fetch /sky every 1-2 s during Play) so planet
  alt/az come from Swiss Ephemeris, advancing in sync with the locally projected
  stars, without returning the wheel jitter.

## RESOLVED — RealSky planets during Play (playCheckpoint throttle)

The known issue above (planets static on RealSky during Play) is resolved.

Solution: a playCheckpoint state in App.jsx. While isPlaying, a 1500ms timer
copies the current seekDt into playCheckpoint; useSkyData is fed
(isPlaying ? playCheckpoint : deferredDt). Stars keep riding the fast masterTime
via local LST projection; planets receive accurate Swiss Ephemeris alt/az
checkpoints from the backend roughly every 1.5s. No frontend alt/az projection.

Backend GET /sky confirmed to fire ~once per 1.5s during Play (verified in
dev.sh logs), so this did not trade the freeze for a fetch-storm.

Planet motion on RealSky during Play is intentionally discrete (steps per
checkpoint, not interpolated). At 1.5s cadence this is imperceptible for planets
(Venus/Jupiter move negligibly per step) and is astronomically correct.

Minor known issue (low severity, deferred):
  The Moon glyph on the zodiac wheel may briefly wobble at the moment Play is
  stopped, due to lerpAngle choosing a shortest-path arc on the final frame
  transition. Cosmetic, sub-second, only on stop. Do NOT touch lerpAngle to fix
  this without a dedicated session — it has caused regressions before.

# RealSky Architecture Principles

## Source of Truth Separation

Chronos separates astronomical truth from perceptual rendering.

The backend, powered by Swiss Ephemeris, is the source of truth for:
- Sun
- Moon
- planets
- houses
- aspects
- parans
- heliacal events

The frontend is responsible for:
- star-field projection
- local sky rotation
- smooth motion
- atmosphere
- visual perception
- sky-state rendering

Planetary objects must not be re-computed on the frontend. Their astronomical
truth remains on the backend.

## RealSky Is Not a Stellarium Clone

RealSky is not designed as a complete astronomical coordinate renderer.
Its purpose is not only to answer:
  Where is the object?
Its purpose is to answer:
  How does this moment of sky look and feel to a human observer?

## Astronomical Realism and Perceptual Realism

Chronos uses two complementary layers of realism:

1. Astronomical Realism — coordinates, time, objects, and ephemeris data must
   remain accurate.
2. Perceptual Realism — atmosphere, twilight, horizon glow, sky brightness,
   object visibility, contrast, and human visual perception determine how the
   sky is rendered.

Perceptual layers must never fake astronomical geometry. They reveal it through
the conditions of human seeing.

## RealSky Principle

RealSky does not render everything astronomy knows.
RealSky renders what a human observer can plausibly see.

A star may exist mathematically but disappear visually because of:
- daylight
- twilight
- Moon brightness
- atmospheric brightness
- horizon haze
- low altitude
- perceptual contrast limits

Therefore, star density is not a manual decoration parameter. It is derived from:
  Sky Brightness -> Limiting Magnitude -> Star Visibility

## Constellation Lines and Visibility

Constellation lines must be visibility-aware.
A constellation segment should know the visibility state of both endpoint stars.
Atmosphere V1 must not create floating or disconnected constellation lines when
one or both endpoint stars are no longer visually visible.

Recommended rule:
- both endpoint stars visible -> full line
- one endpoint visible -> faded or partial line
- both endpoint stars hidden -> line hidden

This keeps constellation rendering consistent with perceptual sky realism.

## Current Task Order

1. Constellation Lines
2. RealSky Atmosphere V1
3. Houses
4. Aspects

## Deferred / Do Not Touch Now

The following areas are intentionally deferred until the RealSky foundation is
stronger:
- Observer Mode
- Moon wobble on STOP
- lerpAngle cleanup
- coordinate pipeline refactor

The current RealSky foundation after commit 2ace059 is stable and should not be
destabilized by low-priority architectural work.

## Constellation Lines V1 — DONE

Source: Stellarium western sky culture constellationship.fab (pinned commit
3c8d3c4), GPLv2+ data, credit Stellarium. Converted to
frontend/src/data/constellations_v1.json: {"Con": [[hipA,hipB],...]} — 88
constellations, 674/676 segments covered by stars_v1.json (99.7%; 2 dropped in
CMa, endpoint stars fainter than mag 6.5).

Rendering: pure visual layer in VisibleSkyMap beneath the star field. Reuses
already-projected starField (hip -> x/y); no new astronomy on the frontend.
Style: strokeWidth 0.5, rgba(150,170,200), opacity 0.28 full / 0.13 dimmed
(one endpoint below horizon), pointer-events none, no labels.
Visibility rule: both endpoints above horizon -> full line; one -> dimmed;
none -> hidden. Seam-wrapping segments (|x1-x2| > VW/2) are skipped in V1.
When Atmosphere V1 lands, visibility should switch from alt>0 to the
limiting-magnitude pipeline — geometry stays unchanged.

Star name labels on RealSky were removed (perceptual realism: an observer sees
figures, not text). Future "Star Labels" becomes its own independent layer.

## Known issue — SystemsDropdown toggles inert (pre-existing)

Clicking Planets/Stars/Constellations rows in SystemsDropdown closes the panel
without toggling anything (predates Constellation Lines work). Likely the
outside-click-close handler swallows the row click before onToggle fires.
showConstellations is correctly wired in App (VisibleSkyMap gets
showConstellations ? lines : {}), so the toggle will work as soon as the panel
is fixed. LayerPanel.jsx is a dead decorative component (no onClick, not
rendered from App) — candidate for removal or unification with SystemsDropdown.
Fix in a dedicated session; do not mix with feature work.

## Git Workflow

Current workflow: work directly in main for small and medium verified changes.
Use feature branches only for risky multi-session refactors, coordinate pipeline
changes, deployment-sensitive experiments, or when additional collaborators join
the project. Never commit broken states to main.

Examples requiring a feature branch:
- coordinate pipeline refactor
- Observer Mode
- houses in RealSky
- parans engine
- new projection engine

Examples that go directly to main (verified before commit):
- visual tweaks (opacity, stroke, sizing)
- new data layers (star labels, constellation names)
- adding UI toggles
- documentation updates

Note: the wheel wobble on release applies to BOTH Play stop and slider mouseup
(same lerpAngle final-frame mechanism). Pre-existing, low severity, deferred.

## Planned task — Planet smoothing on RealSky (designed, not started)

Problem:
  RealSky planet positions update via discrete backend checkpoints (~1.5s
  during Play and drag) and look stepped, while the star field glides at
  ~30fps. Raising star projection rate did not change perceived smoothness —
  the bottleneck is planet stepping, not star rate.

Goal:
  Interpolate planet alt/az on the frontend BETWEEN two consecutive backend
  checkpoints, so planets visually glide. Endpoints of every interpolation
  segment are authoritative Swiss Ephemeris values — the frontend never
  invents positions, it only blends between two server truths.

Source of truth:
  Backend checkpoints remain authoritative. This is NOT frontend ephemeris
  (cf. the reverted usePlanetProjection) — no ecliptic->alt/az math on the
  frontend, only linear blending between served alt/az pairs.

Do not touch:
  - backend
  - coordinate pipeline
  - Observer Mode
  - frontend ephemeris of any kind

Caution zone:
  Implementation lives next to useInterpolatedSky / lerpAngle. Azimuth blending
  must handle the 0/360 wrap WITHOUT reusing lerpAngle blindly (its
  shortest-path choice caused the Moon wobble). Consider a dedicated
  short-arc blend for alt/az with a max-delta guard: if the checkpoint gap
  exceeds a threshold (fast scrub), snap instead of glide.

Acceptance:
  - planets visually glide between checkpoints during Play and drag
  - final positions exactly match backend on stop/release (no drift)
  - no new jump or wobble on stop/release
  - zodiac wheel behavior unchanged
  - GET /sky cadence unchanged (~1.5s)

Dedicated session. Likely main (small/medium) unless it grows — then branch.
