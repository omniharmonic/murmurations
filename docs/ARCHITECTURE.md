# Flower of Life Visualizer — Technical Architecture

## Stack

Reuse what's already in the repo:

- **Three.js + Vite + `vite-plugin-glsl`** — already configured
- **MediaPipe Tasks Vision** for hand/face tracking — `src/tracking/HandFaceTracker.js`
- **lil-gui** for controls
- **Web Audio API** (new) — `getUserMedia({audio: true})` + `AnalyserNode` for FFT bands

## Rendering Approach: Fullscreen SDF Shader

Render a **single fullscreen quad** whose fragment shader computes a signed distance field (SDF) to the flower-of-life pattern.

Why:

- Resolution-independent crisp circles
- Trivial 60fps even at 4K
- Full artistic control over light (glow, chromatic offset, ripples) per-pixel
- Easy to animate the field itself (warping, rippling)

## The Math

### 2D Flower of Life

Hexagonal lattice with spacing `r` (circle radius). Each circle center at:

```
center(i,j) = (i·r + (j%2)·r/2,  j·r·√3/2)
```

For ring-limited rendering, accept only centers within axial-hex distance `≤ N` from origin (where N = ring count).

Total circle count: `1 + 3N(N+1)`
- N=1 → 7 ("Seed of Life")
- N=2 → 19 (classic "Flower of Life")
- N=3 → 37
- N=4 → 61
- N=5 → 91

In the fragment shader, for each pixel `p`:

1. Find the nearest few hex lattice centers (snap to hex grid using cube/axial coordinates)
2. For each, compute `d = |length(p - center) - r|` (distance to that circle's ring)
3. Take the min across neighbors → that's the pixel's "distance to nearest ring"
4. Color/brightness is a function of that distance plus animated light terms

### Etheric Lighting Model

Per pixel, pseudo-code:

```
ringMask    = smoothstep(thickness, 0, sdfDistance)        // how much pixel is "on" a ring
ambientGlow = exp(-sdfDistance * k)                        // wider falloff for halo
baseLevel   = mix(0.02, 0.10, slowSinPulse)                // breathing floor
audioGain   = audioRMS * sensitivity                       // momentary energy
ripple      = sin(distFromCenter · freq - time · speed) · audioGain
brightness  = baseLevel + ringMask · (1.0 + ripple + audioGain)
hue         = baseHue + time·driftSpeed + bassBand·hueShift + radialPosition
color       = hsl2rgb(hue, sat, lightness)
// Chromatic offset for prism look — sample lighting 3x with tiny hue shift, output as RGB
finalColor  = vec3(sampleAt(hue), sampleAt(hue+8°), sampleAt(hue-8°))
```

The chromatic offset is what gives the "light through a prism" look without going neon.

### 3D Mode (Parallax Fake)

Render the same SDF in 3–5 stacked layers at different Z depths with additive blending. Camera does a very slow orbit (or follows face position from MediaPipe) so the layers parallax visibly. Each layer gets its own time-offset and hue offset → light appears to swirl through depth.

A "true" 3D extension exists (raymarched HCP spheres) but it's overkill for tonight; parallax stacking is 95% of the visual at 5% of the cost. Swap in true 3D later if we want.

## Input Pipeline

### Audio (new module: `src/audio/AudioInput.js`)

```
mic → AudioContext → AnalyserNode (fftSize: 1024)
  → getByteFrequencyData() each frame
  → compute: rms, bass (0–250Hz), mid (250–2kHz), treble (2k–8kHz)
  → smooth each with one-pole filter (attack 0.3, release 0.05 → fast rise, slow fall)
  → expose .rms .bass .mid .treble (all 0..1)
```

Decay envelope is the critical UX detail — fast attack, slow release is what makes it feel like the room "rings."

### Camera (reuse `HandFaceTracker`)

Already produces `attractionPoints` with `{type, position}`. We don't need 3D positions for the visualizer; we collapse to 2D screen coords and use them as **light source positions** in the shader. Up to 5 lights (2 hands + face + 2 fingertips). Each light adds a soft Gaussian bump to brightness near its position.

We can also derive **motion energy**: difference between this frame's hand positions and last → drives ripple intensity even when no audio.

## Uniforms Passed to Shader (Every Frame)

| Uniform | Type | Notes |
|---------|------|-------|
| `uTime` | float | seconds since start |
| `uResolution` | vec2 | viewport size |
| `uRingCount` | int | 1..6 |
| `uCircleRadius` | float | in normalized units |
| `uRingThickness` | float | how thick the circle outlines are |
| `uBaseHue` | float | 0..360 |
| `uHueDrift` | float | degrees/sec |
| `uBaseBrightness` | float | the "floor" — how visible the pattern is at rest |
| `uAudioRMS` | float | 0..1 |
| `uAudioBass` | float | 0..1 |
| `uAudioMid` | float | 0..1 |
| `uAudioTreble` | float | 0..1 |
| `uLights[5]` | vec3 | xy=pos in normalized coords, z=intensity (0 = off) |
| `uLightCount` | int | 0..5 |
| `uMode2D3D` | int | 0=2D, 1=3D parallax |
| `uLayerDepth` | float | parallax separation in 3D mode |

## Module Layout

Additive — leave boids code in place, just don't mount it from `main.js`. Easier to roll back if we ever want.

```
src/
  main.js                     ← swap from Flock to FlowerOfLife
  config/
    defaults.js               ← extend with FoL params
    presets.js                ← new: altar / portal / grid
  scene/
    SceneManager.js           ← reuse as-is (maybe ortho camera in 2D mode)
  flower/                     ← NEW
    FlowerOfLife.js           ← mesh + uniforms + per-frame update
    FlowerMath.js             ← hex lattice helpers, ring counts
  audio/                      ← NEW
    AudioInput.js             ← mic + analyser + smoothed bands
  ui/                         ← NEW
    PermissionsOverlay.js     ← first-run "tap to enable" UX
  tracking/
    HandFaceTracker.js        ← reuse as-is
  controls/
    GUIControls.js            ← extend with FoL panel
  shaders/                    ← NEW shader files (plus existing boid ones)
    fol-vertex.glsl           ← fullscreen quad passthrough
    fol-fragment.glsl         ← the meat
```

## First-Run Flow

1. Page loads. Dark canvas, faint pattern starts breathing immediately (no permissions needed).
2. Overlay appears: "Tap to enable mic & camera for reactivity."
3. One tap → request both permissions via `getUserMedia`.
4. On grant → fade overlay out, start `HandFaceTracker` and `AudioInput`. Pattern starts responding.
5. On deny → show small dismissible toast "Running in ambient mode. Click ⚙ to retry." Pattern still looks great, just non-reactive.

## Performance Notes

- Single fullscreen quad with a fragment shader — GPU-bound, very fast
- MediaPipe is already throttled to 15fps (`HandFaceTracker.js:40`)
- AnalyserNode is cheap (a few hundred FFT bins per frame)
- Three stacked layers in 3D mode = 3 fullscreen quad passes; still well under 1ms on integrated graphics
- The expensive part of the shader is the hex-snap + neighbor search; bound to ~7 neighbors per pixel (current + 6 surrounding hex cells), so O(1) per pixel

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| MediaPipe + Web Audio together spike CPU | HandFaceTracker already throttles to 15fps; analyser is cheap |
| Safari `getUserMedia` audio quirks | Feature-detect, gracefully degrade to ambient-only |
| Over-reactive feel | Aggressive smoothing on envelope, low gain ceilings, GUI sliders for live tuning |
| Looking too "VJ-loud" | Start with low floor (0.03) and low gain (0.15); easier to crank up live than dial back |
