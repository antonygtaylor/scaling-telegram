# The Rust & Iron Wars

A production-ready, highly polished, mobile-first Progressive Web App (PWA) turn-based artillery campaign game set in a dieselpunk alternate history ("The Rust & Iron Wars").

Inspired by classic tactical games like *Scorched Earth* and *Pocket Tanks*, optimized for touch devices and desktop browsers alike.

## Features

- **100-Level Deterministic Campaign:** 100 fixed campaign levels across 5 unique theaters of war. Level generation (terrain, background, spawn locations) is locked to deterministic Mulberry32 PRNG seeds (`seed = Level_ID * 99991`).
- **Multi-Layer Parallax Backgrounds:** 60 FPS multi-layered depth scrolling (Sky, Far Mountains, Industrial Ruins, Midground, Playfield Terrain, Foreground Fog).
- **Destructive Terrain Engine:** Real-time radial crater subtraction on heightmap terrain canvas buffers with vertical gravity falling logic for tanks and lethal abyssal boundaries.
- **Tiered Tactical AI:**
  - *Rookie AI (Levels 1–30):* High shot variance, random targeting.
  - *Veteran AI (Levels 31–70):* Precise targeting of low-health enemies, factors in hill obstacles.
  - *Commander AI (Levels 71–100):* Pinpoint ballistic calculations, deliberately targets terrain under opponents near chasms to force lethal off-screen falls.
- **Scoring & Performance Metrics:** Direct hit, splash damage, environmental elimination bonuses, shot efficiency, and $Accuracy = \frac{Hits}{Total Shots} \times 100\%$ grading (S, A, B, C). Local progress persistence via `localStorage`.
- **Mobile-First Touch & Audio Polish:** Drag-to-aim trajectory, horizontal pan camera gestures, hold-to-charge FIRE meter, Web Audio API procedural synthesizer (explosions, cannon fire, crumbling earth), dynamic camera shell tracking, and screen shake with haptic feedback (`navigator.vibrate`).
- **Full PWA Capability:** Service Worker caching, installable `manifest.json`, standalone landscape mode, 100% offline functionality.

## PRNG Seed Generation Math

Every level ID ($1 \le L \le 100$) deterministically derives its seed via:
$$\text{Seed}(L) = L \times 99991$$
This seed initializes the **Mulberry32** PRNG instance, which produces all subsequent pseudo-random numbers for:
1. Perlin noise terrain heightmap frequency and octave offsets.
2. Parallax background color gradients and mountain silhouette contours.
3. Player and AI tank spawn positions (guaranteeing minimum separation distance).
4. Wind speed and direction variance per turn.
5. AI accuracy variations and target selection.

## Scoring System Mechanics

- **Direct Hit:** +500 PTS + Bonus proportional to damage dealt.
- **Splash Hit:** +100 to +300 PTS proportional to proximity.
- **Environmental Fall Elimination:** +1,000 PTS bonus when an enemy tank falls off the bottom screen due to cratering under its base.
- **End-Level Grade:**
  - **S Grade:** Accuracy $\ge 85\%$
  - **A Grade:** $70\% \le \text{Accuracy} < 85\%$
  - **B Grade:** $50\% \le \text{Accuracy} < 70\%$
  - **C Grade:** $\text{Accuracy} < 50\%$

## Local Development Setup

No complex build pipeline required—built with modern ES Modules and native Browser APIs.

1. Clone or download the repository.
2. Serve the directory using any static web server (e.g., Python's HTTP server or Node `http-server`):
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your web browser.

## Tech Stack Architecture

- **Rendering:** HTML5 Canvas API with high-DPI resolution auto-scaling (`window.devicePixelRatio`).
- **PRNG & Terrain:** Mulberry32 PRNG + 1D/2D Perlin Noise Generator.
- **Audio:** Web Audio API (procedural audio synth, zero external sound asset dependencies).
- **PWA:** Service Worker (`sw.js`) + Web App Manifest (`manifest.json`).

## Controls

- **Pan Map:** Drag horizontally on empty battlefield areas.
- **Aim Angle:** Drag the trajectory handle around your tank or use the `◀` / `▶` ANGLE HUD buttons.
- **Fire Cannon:** Press & hold the **HOLD TO FIRE** button to charge power, then release to shoot.

## License

MIT License.
