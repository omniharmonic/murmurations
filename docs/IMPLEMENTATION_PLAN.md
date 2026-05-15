# Flower of Life Visualizer — Implementation Plan

Time budget: aim to land MVP in roughly 4 well-scoped passes. After each pass we have something that works on screen.

---

## Pass 1: Static 2D flower renders (~45 min)

**Goal:** Open the browser, see a static flower-of-life pattern in white on dark.

- [ ] Add `src/flower/FlowerMath.js` with hex lattice generator (axial coords, ring filter)
- [ ] Add `src/shaders/fol-vertex.glsl` — fullscreen quad passthrough
- [ ] Add `src/shaders/fol-fragment.glsl` — minimal SDF circle pattern (white rings on black, no animation)
- [ ] Add `src/flower/FlowerOfLife.js`:
  - Constructs a fullscreen `PlaneGeometry` + `ShaderMaterial`
  - Owns the uniforms object
  - Exposes `update(dt, audio, lights, params)` for per-frame uniform updates
- [ ] Rewire `src/main.js`: instantiate `FlowerOfLife` instead of `Flock` / `FlockRenderer`
- [ ] Update `src/scene/SceneManager.js`: consider switching to orthographic camera for 2D mode (or keep perspective and place plane at z=0 sized to frustum at that depth)

**Checkpoint:** Static flower of life pattern renders. Ring count uniform changes the pattern.

---

## Pass 2: Ambient shimmer + GUI (~45 min)

**Goal:** Pattern shimmers gently on its own; GUI feels responsive.

- [ ] Extend `fol-fragment.glsl`:
  - HSL color with `hsl2rgb` (lift from existing boid shader)
  - Chromatic offset (sample brightness term 3× with hue offset, output as RGB)
  - Slow time-based hue drift
  - "Breathing" base lightness via slow sin pulse
- [ ] Extend `src/config/defaults.js` with FoL params:
  - `ringCount`, `circleRadius`, `ringThickness`
  - `baseHue`, `hueDrift`, `baseBrightness`
  - `audioSensitivity`, `decayRate` (placeholder until Pass 3)
  - `mode2D3D`
- [ ] Extend `src/controls/GUIControls.js` with a "Flower of Life" folder:
  - Sliders/toggles for all FoL params
  - Ring count changes a uniform only — no rebuild needed
- [ ] Hide / remove boid-related GUI controls

**Checkpoint:** Pattern shimmers gently without any input. Sliders feel responsive.

---

## Pass 3: Audio reactivity (~60 min)

**Goal:** Clap or speak; watch light ripple through.

- [ ] Implement `src/audio/AudioInput.js`:
  - `init()` → request mic via `getUserMedia({audio: true})`
  - Create `AudioContext` + `AnalyserNode` (fftSize: 1024)
  - Per-frame: compute RMS, bass / mid / treble bands
  - One-pole smoothing: fast attack (~0.3), slow release (~0.05) per band
  - Expose `.rms`, `.bass`, `.mid`, `.treble` (0..1)
- [ ] Implement `src/ui/PermissionsOverlay.js`:
  - Fullscreen-ish overlay with single CTA button
  - On click: trigger mic + camera init in parallel, fade overlay out on success
  - On deny: dismissible toast, fall back to ambient mode
- [ ] Wire `AudioInput` to FoL uniforms (`uAudioRMS`, `uAudioBass`, etc.)
- [ ] Add audio-driven terms in `fol-fragment.glsl`:
  - RMS → brightness pulse
  - Bass → hue shift
  - Treble → sparkle / ripple frequency
- [ ] Tune attack/release until "ringing room" feeling emerges

**Checkpoint:** Mic input produces visible, smooth, room-ringing response. Decay feels musical, not twitchy.

---

## Pass 4: Camera reactivity + 3D mode + presets (~60 min)

**Goal:** Ship it.

- [ ] Wire `HandFaceTracker.attractionPoints` → light uniforms array
  - Collapse 3D positions to 2D normalized screen coords
  - Smooth positions per-frame for stable lights
  - Compute per-frame motion energy → feed to ripple intensity
- [ ] Add 3D parallax mode:
  - Render 3–5 layered fullscreen quads at different Z depths
  - Each layer has a per-layer time / hue offset uniform
  - Very slow camera orbit (or face-tracked tilt)
  - Additive blending between layers
- [ ] Add `src/config/presets.js`:
  - **Altar:** centered, symmetric, 2-ring, warm gold base hue, low drift
  - **Portal:** deeper Z parallax, indigo/violet, 3-ring, axial light pull
  - **Grid:** full-screen tiling (5+ rings), cool cyan, faster drift
- [ ] Add preset selector to GUI
- [ ] Final tuning pass on default look

**Checkpoint:** All three input modes feel layered and intentional. Presets show meaningfully different moods. Ready for the venue.

---

## Order of Battle

Each pass ends with a working visible state, so we can stop early if time runs out and still have something to project. Minimum viable ship is end of Pass 2 (ambient-only). Pass 3 is the magic. Pass 4 is the polish.

## Definition of Done (for tonight)

- Builds cleanly with `npm run dev`
- Opens to ambient pattern within 2 seconds
- Auto-prompt overlay works; permissions grant transitions smoothly
- All GUI controls do something visible
- Holds 60fps on the laptop driving the display
- No console errors in steady state

## Stretch Items (if time)

- Beat detection (peaks in bass band trigger discrete pulses)
- Smoother face-tracked camera tilt in 3D mode
- "Idle mode" that auto-engages after 60s of no detected motion/audio (just slow drift)
- Color presets independent of layout presets
- URL hash state so GUI settings survive a refresh

## Open Items After Tonight

- True 3D HCP sphere rendering (raymarched)
- Beat-grid sync (would need tempo detection)
- Touch / pointer interaction on the screen itself
- Save / load named presets to localStorage
