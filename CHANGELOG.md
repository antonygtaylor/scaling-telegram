# Changelog

All notable changes to **The Rust & Iron Wars** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Initial Release

### Added
- Progressive Web App (PWA) setup with `manifest.json`, standalone landscape display lock, dark theme (`#121212`), and Service Worker (`sw.js`) for full offline playability.
- High-DPI canvas resolution scaling with touch-first UI controls (drag-to-aim trajectory handle, horizontal camera pan gesture, hold-to-charge FIRE power button).
- Seedable PRNG module (Mulberry32 algorithm) ensuring 100% deterministic level generation for all 100 campaign levels (`seed = Level_ID * 99991`).
- Multi-layer 60 FPS parallax scrolling background engine (sky, distant mountains, industrial silhouettes, midground, playfield, foreground fog).
- Dynamic procedural terrain engine powered by Perlin noise with real-time radial crater subtraction and vertical tank gravity falling.
- Tiered competitor AI system (Rookie, Veteran, Commander AI algorithms) capable of trajectory solver calculations and environmental kill tactics.
- Scoring & progression system with direct/splash hit bonuses, environmental elimination rewards, end-of-sector grading (S, A, B, C) based on accuracy percentage ($Accuracy = \frac{Hits}{Total Shots} \times 100\%$), and `localStorage` state persistence.
- Web Audio API procedural sound synthesizer for dynamic sound effects (cannon blasts, shell whistles, explosions, crumbling earth) with zero external asset dependencies.
- Detailed campaign narrative briefings across 5 theaters of war (*Ashen Dunes*, *Frostbite Pass*, *The Iron Metropolis*, *Obsidian Ravines*, *The Rust Citadel*).
