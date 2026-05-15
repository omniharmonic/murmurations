# Flower of Life Visualizer — PRD

## Vision

An ambient, generative art piece for the t-lounge wall. Default state: a barely-visible flower-of-life pattern that breathes with a slow prismatic shimmer — "liquid light through a stained-glass lattice." When people move or make sound in the room, light flows through the geometry like ripples through a still pool. Subtle enough that newcomers don't notice it at first, then they realize: *it's responding to me.*

The piece can read as **altar**, **portal**, or **grid** depending on framing.

## Audience & Context

- Single large display in a t-lounge, viewed from a few feet away
- Webcam + room mic capture multiple people simultaneously
- Runs hours unattended; must not get visually loud or annoying over time
- Performance target: 60fps on a modern laptop GPU

## Core Experience Principles

1. **Subtle by default.** Baseline brightness is low enough that the pattern barely registers. Light *emerges* from movement and sound, never blasts.
2. **Slow temporal envelope.** No twitchy reactions — energy enters quickly, decays slowly (1–3 seconds). The room "rings like a bell."
3. **Prismatic, not saturated.** Etheric/iridescent palette via chromatic offset, never neon. Think aurora, not LED.
4. **Geometry is the anchor.** The flower of life pattern should always be discernible (even when faint). Light dances on it, never replaces it.

## Features

### Must-have (tonight)

- 2D Flower of Life rendering with configurable ring count (1=seed, 2=classic flower, 3+=expanded)
- Slow ambient shimmer baseline (no input required)
- Audio input → pulse / brightness / ripple modulation
- Smooth temporal decay so reactions feel like ringing, not flickering
- GUI: ring count, 2D/3D toggle, audio sensitivity, base hue/palette, brightness floor, decay rate
- Fullscreen mode (already exists, reuse)
- Auto-prompt overlay on first load asking permission to enable mic & camera

### Should-have

- 3D mode: layered/parallax flower of life giving spatial depth
- Camera motion → secondary modulation (light follows hands across the pattern)
- 3 presets: **Altar** (centered, symmetric, golden), **Portal** (deep, indigo/violet, axial pull), **Grid** (full-screen tiling, cool/cyan)

### Won't-have (this iteration)

- Fluid dynamics
- True 3D hexagonal close-packed sphere geometry (parallax fakes it well enough)
- Recording / export
- Multi-display sync

## Decisions

| Question | Decision |
|----------|----------|
| First-run UX | Auto-prompt overlay: "tap to enable mic & camera". Ambient-only until they tap. |
| 3D approach | Layered parallax — 3–5 stacked planes with slow camera orbit. |
| Default brightness | Reasonable defaults; tune live with GUI at the venue. |

## Success Criteria

- Pattern is recognizable as a flower of life at any ring count
- Within 30 seconds of someone entering the room and speaking, they can sense the room is responding (without being told)
- Visually engaging for at least 15 minutes of continuous viewing without becoming tiring
- Zero crashes / no need for restart during a party
