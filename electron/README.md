# MIA Admin — Windows Desktop App

## Quick Start (Windows)

### 1. Prerequisites
- Node.js 18+ installed
- npm 9+
- Windows 10/11 (for building the .exe)

### 2. Install Dependencies

```bash
# From the project root
npm install

# Install Electron dependencies
npm run electron:install
```

### 3. Build the Windows Installer

```bash
# From the project root — builds web app + packages Electron
npm run electron:dist:win
```

This generates two files in `electron-dist/`:
- **`MIA Admin Setup 1.0.0.exe`** — Standard installer (creates Start Menu + Desktop shortcut)
- **`MIA Admin Portable 1.0.0.exe`** — No installation needed, run directly

### 4. App Icon

Replace `electron/assets/icon.png` with the official MIA Admin logo PNG
(512×512 px recommended, transparent background).

electron-builder will automatically convert it to `.ico` for Windows.

---

## Development

To run the Electron app against the built web app:

```bash
npm run electron:dev
```

## Architecture

- **Electron main process**: `electron/main.js`
- **Preload script**: `electron/preload.js`  
- **Admin web app**: Built to `dist/admin/index.html` by Vite
- **Supabase auth**: Persisted in Electron's userData (localStorage)
- **Window state**: Saved between sessions via `electron-store`

## Security

- `contextIsolation: true` — Renderer cannot access Node.js APIs
- `nodeIntegration: false` — No Node.js in renderer
- External URLs open in system browser, not in the app
- Single-instance lock prevents multiple windows
