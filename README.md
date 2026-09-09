# 🟩 TERMINAL RUNNER (Web Edition)

> **A retro-cyberpunk 2D endless runner arcade game built with HTML5 Canvas, TypeScript, and Vite. Designed for native zero-dependency web execution and Vercel deployment.**

---

## 🕹️ Game Overview

**TERMINAL RUNNER** is a fast-paced arcade runner inspired by classic endless runner mechanics, elevated with a distinctive retro-cyberpunk terminal visual identity, original procedural pixel art, dynamic physics, procedural 8-bit chiptune audio synthesis (Web Audio API), power-up systems, and adaptive difficulty.

Navigate through an ever-accelerating cyber mainframe, leap over high-voltage firewall spikes and data pylons, slide under airborne surveillance drones and laser beams, capture high-value data packets, and activate power-up subroutines to establish new high scores!

---

## 🎮 Controls

| Action | Primary Key | Secondary Key | Mobile / Touch | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Jump** | `SPACE` | `UP ARROW` / `W` | `▲ JUMP` Button | Variable jump height; tap for short hop, hold for full jump |
| **Duck / Slide** | `DOWN ARROW` | `S` | `▼ SLIDE` Button | Slide low along the ground; fast-fall if pressed in mid-air |
| **Pause / Resume** | `P` | `ESC` | `⏸️ PAUSE` Button | Pause game execution or resume active session |
| **Restart** | `R` | — | `🔄 RESTART` Button | Reboot system and start a fresh game run |
| **Sound / Mute** | `M` | — | `🔊 SOUND` Button | Toggle Web Audio procedural sound synthesis |
| **Start Game** | `SPACE` | `UP ARROW` / `W` | Screen Tap | Initiate run from title or game-over screens |

---

## ⚡ Key Features

- **Responsive Physics & Dynamic Hitboxes**:
  - Variable-height jumps with jump buffering (0.12s) and coyote time (0.09s).
  - Mid-air fast-fall dive drops and low-profile ground slides.
  - Dynamically shrinking collision boundaries when ducking.
- **5 Unique Cyber Obstacles**:
  - **Firewall Spikes**: Single, double, and triple neon laser ground clusters.
  - **Security Drones**: Hovering surveillance drones with active red scanner cones.
  - **Data Pylons**: High-voltage server racks requiring full-height leaps.
  - **Laser Barriers**: Overhead electrified beams forcing ducking slides.
  - **Glitch Nodes**: Unstable shifting digital hazard matrices.
- **Data Packet Collectibles**:
  - **Data Bits (Bronze)**: +50 pts.
  - **Data Bytes (Silver)**: +100 pts.
  - **Crypto Blocks (Quantum Gold)**: +250 pts.
  - Formations: Running lines, high lines, jump arcs, and slide tunnels.
- **Power-Up Subroutines**:
  - 🛡️ **Shield Matrix**: Absorbs 1 fatal collision with visual energy shield and shatter FX.
  - ⚡ **2X Overclock Multiplier**: Doubles all survival and packet points for 10 seconds.
  - ⏱️ **Chrono Slow-Motion**: Slows world and hazard speed by ~48% for 8 seconds.
- **Procedural 8-Bit Chiptune Audio (Web Audio API)**:
  - Real-time mathematical sound synthesis for jump sweeps, slide whooshes, harmonic chimes, fanfares, shield shatters, and bitcrushed explosions.
  - 100% self-contained with zero external audio assets required.
- **Retro Cyberpunk Visuals & Parallax Environment**:
  - Multi-layer parallax scrolling: Starfield, server skylines, live terminal data streams (`0101`, `sudo sysctl`, `0xDEADBEEF`), perspective grid horizon.
  - Dynamic palette progression (Phosphor Matrix Green ➔ Synthwave Cyan ➔ Solar Amber ➔ Crimson Alert Red).
  - CRT scanlines and screen shake juice.
- **Persistent High Scores**: Automatically records your best run to `localStorage`.

---

## 📁 Project Structure

```
terminal-runner-vercel/
├── index.html               # Main HTML container & arcade UI
├── package.json             # Build scripts & TypeScript dependencies
├── tsconfig.json            # Strict TypeScript configuration
├── vite.config.ts           # Vite bundler configuration
├── vercel.json              # Vercel deployment configuration
├── styles/
│   └── style.css            # Dark theme, neon glows, CRT scanlines, mobile buttons
├── src/
│   ├── config.ts            # Screen settings, physics constants, color palette
│   ├── types.ts             # TypeScript interfaces and enum definitions
│   ├── storage.ts           # LocalStorage high-score manager
│   ├── audio.ts             # Web Audio API 8-bit procedural sound synthesizer
│   ├── particle.ts          # Particle effects engine & floating text popups
│   ├── player.ts            # Player sprite, state machine, and physics controller
│   ├── obstacle.ts          # Obstacle classes (Spikes, Drones, Pylons, Lasers) & spawner
│   ├── collectible.ts       # Data packets & formation spawner
│   ├── powerup.ts           # Shield, 2X Multiplier, Slow-Mo items & manager
│   ├── background.ts        # Multi-layer parallax cyber environment
│   ├── ui.ts                # HUD, scanline overlay, start/pause/game-over screens
│   ├── game.ts              # Main game coordinator, state loop, and screen shake
│   └── main.ts              # Entry point initializing game and event listeners
└── public/
    └── favicon.svg          # Cyber terminal icon
```

---

## 🚀 Local Setup & Running

### Requirements
- Node.js 18+ (Node.js 20, 22, 24 supported)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized static bundle in `dist/`.

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## ☁️ Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: Git Integration (GitHub / GitLab / Bitbucket)
1. Push this repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Vite** (auto-detected).
4. Root Directory: `./`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy**.

---

## 📜 License
MIT License. Built for retro gaming enthusiasts!
