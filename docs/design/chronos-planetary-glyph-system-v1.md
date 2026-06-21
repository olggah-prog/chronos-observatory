# Chronos Planetary Glyph System v1

Status: design laboratory / draft  
Scope: planetary glyphs for the Chronos cosmogram  
Do not treat this as final UI styling yet.

## Purpose

Create a proprietary planetary glyph family for Chronos Observatory.

The goal is not to invent completely new symbols and not to reuse default Unicode astrology glyphs. The goal is to reinterpret the traditional planetary symbols as a coherent Chronos type system: recognizable, compact, monumental, and readable inside the cosmogram.

## Core principle

Form first. Color, glow, metallic rendering, material, and animation are secondary layers and should not drive the glyph design.

The glyph must work as a pure monochrome silhouette before any visual effects are added.

## Visual direction

Chronos planetary glyphs should feel like engraved astronomical artifacts, not decorative icons.

Target qualities:

1. Strong silhouette.
2. Large dominant circles.
3. Compact secondary elements.
4. Dense, confident stroke.
5. Monumental but not heavy.
6. Instrument-like, not magical.
7. Readable at 16–24 px.
8. Custom enough to feel like Chronos, familiar enough to be recognized instantly.

Avoid:

1. Thin Unicode-like symbols.
2. Loose calligraphy.
3. Fantasy ornament.
4. Cyberpunk neon as a primary style.
5. Over-detailed bevels that disappear at small sizes.
6. Rebuilding the whole symbol language into something unrecognizable.

## Normalization

Use an em-box of 1000 units.

Suggested starting metrics:

| Metric | Starting value | Note |
|---|---:|---|
| em box | 1000 | all glyphs fit inside this visual box |
| dominant circle diameter | 620 | large circle is the main visual anchor |
| stroke width | 86 | about 14% of circle diameter |
| crossbar length | 300 | compact, not long Unicode-style cross |
| lower stem length | 260 | short and visually attached to circle |
| Mercury horn width | 430 | compact, close to circle |
| Mercury horn height | 190 | horns should sit tight, not float |
| minimum inner gap | 80 | avoid small details closing at 16 px |
| optical overshoot | 20–30 | round forms may exceed strict box slightly |

These numbers are a first design hypothesis based on the reference direction: large circles, compact crosses, compact horns, dense stroke.

## Primitive system

Glyphs should be built from a small shared set of primitives:

1. Circle.
2. Arc.
3. Vertical stem.
4. Horizontal crossbar.
5. Diagonal stem.
6. Arrowhead.
7. Fork / trident form.

Every glyph should reuse these primitives as much as possible.

## First test glyphs

Do not start with all planets.

Start with:

1. Venus — tests circle + stem + crossbar.
2. Mercury — tests circle + stem + crossbar + horns.
3. Saturn — tests vertical structure + crossbar + arc/serp form.

If these three belong to one family at 16, 20, 24, and 32 px, the system is probably viable.

## Evaluation checklist

A glyph passes only if:

1. It is recognizable immediately.
2. It still reads at 16 px.
3. It does not look like a standard font glyph.
4. It feels like part of Chronos.
5. Its secondary elements do not overpower the primary circle.
6. It works in monochrome.
7. It can accept color/material later without depending on them.

## Implementation direction

Keep the implementation layered:

1. Pure SVG geometry.
2. Theme color.
3. Optional material/glow layer.
4. Optional animation layer.

Do not bake color, glow, or metal into the base glyph geometry.

## Next step

Build a small isolated glyph lab with Venus, Mercury, and Saturn only. Render each at 16, 20, 24, and 32 px on a dark Chronos background. Do not integrate into the production cosmogram until the glyphs pass the readability test.
