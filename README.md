# Banana Danger Index 🍌⚡

Upload a banana peel. We'll assess the gravity of the situation using cutting-edge yellowness analysis.

**Warning:** This tool does not account for cartoon physics, but it should.

## Features

- **Upload & Analyze** — Drop a banana peel photo, get a slip probability score based on yellowness analysis
- **Stick Figure Animation** — Watch a crude stick figure walk across the canvas, step on your peel, and eat it in spectacular fashion
- **Batman Fight Words** — Impact onomatopoeia (BAM!, POW!, KAPOW!) pulse over the fallen figure with neon comic-book styling
- **Crowd Reaction** — Six tiny rubberneckers slide in from the edges with speech bubbles and unique reaction poses
- **Screen Shake** — The canvas rattles on impact. Higher danger = harder tremor
- **Slow-Motion Replay** — After the crowd settles, a dramatic 0.15x slow-mo replay with golden sparkle trails and a spotlight vignette
- **Peel Fact Ticker** — Rotating absurd comparisons ("This peel is 67% more slippery than a buttered doorknob") from PEEL SCIENCE, PEEL LAW, PEEL HISTORY, and PEEL ALERT
- **Banana Confetti** — 30 🍌 pieces rain down when slip index exceeds 80%
- **Favicon** — Hand-drawn SVG banana peel (not an emoji)

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for builds
- **Tailwind CSS 3** for styling
- **Framer Motion** for animations and layout transitions
- **Canvas API** for the stick figure animation sequence

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build to dist/
npm run lint       # ESLint
npm run preview    # preview the production build
```

## Build

```bash
npm run build
```

Output goes to `dist/` — a static site ready to deploy anywhere (Vercel, Netlify, GitHub Pages, etc).

## Project Structure

```
src/
├── App.tsx                        # Main app, layout, state management
├── main.tsx                       # Entry point
├── index.css                      # Tailwind + CSS variables (banana theme)
├── lib/utils.ts                   # cn() utility
├── components/
│   ├── BananaCanvas.tsx            # Stick figure animation (~1100 lines of canvas)
│   ├── ConfettiPeel.tsx            # Banana rain overlay
│   ├── PeelFactTicker.tsx          # Rotating absurd statistics
│   ├── Header.tsx                  # Title + subtitle
│   ├── ProbabilityGauge.tsx        # Animated number display + progress bar
│   ├── UploadZone.tsx              # Drag-and-drop image upload
│   ├── WarningBanner.tsx           # Random hazard warning
│   └── ui/button.tsx               # shadcn-style button
└── data/
    ├── batmanWords.ts              # Fight onomatopoeia list
    ├── hazardWarnings.ts           # Warning message list
    └── peelFacts.ts                # Absurd comparison templates + interpolation
```

## License

MIT — SGM Studios
