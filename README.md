# CS2

## FIELDOPS — Tactical Training

A browser-based first-person training game built with vanilla JavaScript and
Three.js. The project uses procedural map, weapon, bot, sound, and particle
assets; no build step or package installation is required.

## Run locally

Serve this folder over HTTP (ES modules do not run reliably from `file://`):

```powershell
py -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in a WebGL-capable desktop
browser. Three.js and the interface fonts are loaded from CDNs, so an internet
connection is required on first load.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D | Move |
| Mouse | Look |
| Space | Jump |
| Shift | Walk |
| Left mouse | Fire |
| Right mouse | Aim with the sniper rifle |
| R | Reload |
| 1–5 | Switch weapons |
| Tab | Show the scoreboard |
| Escape | Pause and release the mouse |

## Features

- Deathmatch, Team Deathmatch, and unlimited-ammo Practice modes.
- Five weapons, selectable loadouts, original finishes, and a rotating 3D preview.
- Enemy bots, health and armor, match statistics, and responsive HUD.
- Pause, restart, and main-menu flows; graphics, audio, sensitivity, fullscreen,
  and crosshair settings persist in local storage.
- Procedural Web Audio effects and bounded Three.js impact, smoke, ambient, and
  elimination effects.
