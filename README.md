# ResearchBook

A desktop PDF reader built for researchers, students, and knowledge workers who think spatially. ResearchBook combines high-performance PDF rendering with an infinite Excalidraw canvas, allowing you to read, annotate, draw, diagram, and connect ideas directly on top of your documents.

> **Read. Draw. Connect. Think.**

![ResearchBook Logo](./public/logo.svg)

---

## Why ResearchBook Exists

Most PDF readers force you into a linear, page-by-page consumption mode. But real research isn't linear — it's spatial. You draw connections between ideas on different pages, sketch diagrams in the margins, highlight with colors that mean something to *you*, and build mental maps that span hundreds of pages.

ResearchBook was built to solve a simple problem: **there was no PDF reader that treats annotation as a first-class spatial experience**. Existing tools either:
- Lock you into rigid text-only highlighting
- Force annotations into disconnected side panels
- Use proprietary formats that trap your notes
- Require cloud subscriptions and upload your documents to remote servers

ResearchBook is **local-first**, **open-source**, and **spatial**. Your PDFs never leave your machine. Your annotations are saved in an open SQLite database. And the infinite canvas (powered by Excalidraw) lets you think in two dimensions — the way human cognition actually works.

---

## Features

### Core Reading
- **Fast PDF rendering** via pdf.js with progressive WebP caching
- **Page-by-page navigation** with keyboard shortcuts (`←` `→`, `PageUp` `PageDown`)
- **Outline / table of contents** sidebar for jumping to chapters
- **Dark mode** support for late-night reading sessions
- **Toolbar hideout** — minimize the Excalidraw tool palette when you just want to read
- **Fit-to-screen** — press `Shift + 1` to instantly center the PDF and zoom to fit the viewport

### Spatial Annotation (powered by [Excalidraw](https://excalidraw.com))
- **Draw** freehand sketches, diagrams, and mind maps directly on the page
- **Write text** anywhere on the canvas
- **Add shapes** (rectangles, ellipses, arrows, lines)
- **Highlight** with the highlighter tool
- **Sticky notes** for quick thoughts
- **Lock the PDF image** so you annotate *around* it without accidentally moving it
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
- **`Shift + 1`** to instantly fit the PDF to your screen
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
│  │  Excalidraw 0.18 (infinite canvas)│  │
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
| Database | SQLite (via Rusqlite) |
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
npm run tauri dev
```

### Build for production
```bash
npm run tauri build
```

This will produce installable bundles in `src-tauri/target/release/bundle/`.

### Branching Strategy
- **`main`** — stable releases only
- **`dev`** — active development, testing, and feature integration

We follow a simple workflow: develop on `dev`, test thoroughly, then merge to `main` and tag a release.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Next page | `→` or `PageDown` |
| Previous page | `←` or `PageUp` |
| Fit PDF to screen | `Shift + 1` |
| Zoom in | `Ctrl` + `+` or `Ctrl` + scroll up |
| Zoom out | `Ctrl` + `-` or `Ctrl` + scroll down |
| Pan canvas | Two-finger drag / click & drag |
| Toggle editor tools | Click the panel icon in the top bar |
| Toggle dark mode | Click the sun/moon icon |

---

## Data Storage

All data is stored locally on your machine:
- **Library database**: `~/.local/share/com.researchbook.app/researchbook.db` (Linux)
- **Cached page images**: `~/.local/share/com.researchbook.app/books/` (Linux)
- **Imported PDFs**: referenced from their original paths (not duplicated)

No data ever leaves your device.

---

## License

MIT License — free to use, modify, and distribute.

---

## Acknowledgements

- [Excalidraw](https://excalidraw.com) for the incredible infinite canvas engine
- [pdf.js](https://github.com/mozilla/pdf.js) by Mozilla for PDF rendering
- [Tauri](https://tauri.app) for the lightweight desktop framework
- [Lucide](https://lucide.dev) for the beautiful icon set
