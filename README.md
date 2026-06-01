# ResearchBook

A desktop PDF reader built for researchers, students, and knowledge workers who think spatially. ResearchBook combines high-performance PDF rendering with an infinite Excalidraw canvas, allowing you to read, annotate, draw, diagram, and connect ideas directly on top of your documents.

> **Read. Draw. Connect. Think.**

![ResearchBook Logo](./public/logo.svg)

---

## Features

### Core Reading
- **Fast PDF rendering** via pdf.js with progressive WebP caching
- **Page-by-page navigation** with keyboard shortcuts (`←` `→`, `PageUp` `PageDown`)
- **Outline / table of contents** sidebar for jumping to chapters
- **Dark mode** support for late-night reading sessions
- **Spread view toggle** to show or hide the annotation toolbar

### Spatial Annotation (powered by [Excalidraw](https://excalidraw.com))
- **Draw** freehand sketches, diagrams, and mind maps directly on the page
- **Write text** anywhere on the canvas
- **Add shapes** (rectangles, ellipses, arrows, lines)
- **Highlight** with the highlighter tool
- **Sticky notes** for quick thoughts
- **Lock the PDF image** so you annotate *around* it without moving it
- **Per-page canvas state** — every page has its own independent annotation layer saved to a local SQLite database

### Library Management
- **Import any PDF** from your filesystem
- **Library view** with search, sorting, and metadata (page count, import date)
- **Persistent storage** — all books, annotations, and reading progress are stored locally
- **Delete books** with confirmation (removes PDF + all associated notes)

### Navigation & Zoom
- **Pinch-to-zoom** on trackpads
- **Ctrl + scroll** to zoom in/out
- **Plus / minus keys** for precise zoom control
- **Zoom to fit** button in the navigation panel
- **Two-finger drag** to pan around the canvas

### Performance
- **Lazy page conversion** — converts PDF pages to WebP in the background for instant loading
- **Pre-caches** upcoming and previous pages so flipping feels instant
- **Range-based PDF streaming** — large PDFs don't need to load entirely into memory
- **SQLite backend** for fast, reliable local data storage

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Tauri v2 (Rust)            │
│  ┌─────────────┐    ┌───────────────┐  │
│  │  SQLite DB  │    │  File System  │  │
│  │  (pages,    │    │  (PDFs, WebP  │  │
│  │   canvas)   │    │   cache)      │  │
│  └──────┬──────┘    └───────┬───────┘  │
│         └───────────────────┘           │
│                    │                    │
│              Commands API               │
│                    │                    │
└────────────────────┼────────────────────┘
                     │
┌────────────────────┼────────────────────┐
│         React 18 + Vite Frontend        │
│  ┌───────────────────────────────────┐  │
│  │  tldraw v2.4  (infinite canvas)   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  PDF page as locked image   │  │  │
│  │  │  + user shapes & drawings   │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│  ┌─────────────┐    ┌───────────────┐  │
│  │  Zustand    │    │  pdf.js       │  │
│  │  (state)    │    │  (rendering)  │  │
│  └─────────────┘    └───────────────┘  │
└─────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Canvas Engine | Excalidraw 0.18 |
| PDF Rendering | pdf.js 4.6 |
| Desktop Shell | Tauri 2.0 (Rust) |
| Database | SQLite (via `tauri-plugin-sql` or raw Rusqlite) |
| State Management | Zustand |

---

## Installation

### Linux (.deb)
```bash
wget https://github.com/zumuuser/researchbook/releases/latest/download/ResearchBook_0.1.0_amd64.deb
sudo dpkg -i ResearchBook_0.1.0_amd64.deb
```

### Windows (.msi / .exe)
Download the latest `.msi` or `.exe` from the [Releases](https://github.com/zumuuser/researchbook/releases) page and run the installer.

### macOS (.dmg)
Download the latest `.dmg` from the [Releases](https://github.com/zumuuser/researchbook/releases) page, open it, and drag ResearchBook to your Applications folder.

---

## Development

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri CLI](https://tauri.app/v2/reference/cli/)

### Setup
```bash
git clone https://github.com/zumuuser/researchbook.git
cd researchbook
npm install
```

### Run in dev mode
```bash
npm run tauri:dev
```

### Build for production
```bash
npm run tauri:build
```

This will produce installable bundles in `src-tauri/target/release/bundle/`.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Next page | `→` or `PageDown` |
| Previous page | `←` or `PageUp` |
| Zoom in | `Ctrl` + `+` or `Ctrl` + scroll up |
| Zoom out | `Ctrl` + `-` or `Ctrl` + scroll down |
| Pan canvas | Two-finger drag / click & drag |
| Toggle editor tools | Click the layout icon in the top bar |
| Toggle dark mode | Click the sun/moon icon |

---

## Data Storage

All data is stored locally on your machine:
- **Library database**: `~/.local/share/com.researchbook.app/researchbook.db` (Linux)
- **Cached page images**: `~/.local/share/com.researchbook.app/pages/` (Linux)
- **Imported PDFs**: copied into the app data directory on import

No data ever leaves your device.

---

## License

MIT License — free to use, modify, and distribute.

---

## Acknowledgements

- [tldraw](https://tldraw.com) for the incredible infinite canvas engine
- [pdf.js](https://github.com/mozilla/pdf.js) by Mozilla for PDF rendering
- [Tauri](https://tauri.app) for the lightweight desktop framework
- [Lucide](https://lucide.dev) for the beautiful icon set
