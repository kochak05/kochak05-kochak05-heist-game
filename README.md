# kochak05-kochak05-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/kochak05/kochak05-kochak05-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/kochak05/kochak05-kochak05-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Velvet Vault — a one-room top-down 2D heist game. Slip past three patrolling guards and two sweeping security cameras, grab the Gilded Star from the vault, and get out the green exit door before the alarm hits 100%. Vents and shadow patches offer quieter routes; an EMP freezes the cameras and a noisemaker lures a guard away — both cost limited charges.

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests: every file the game loads lives under `game/`.

## Play

- WASD / arrow keys — move (click to walk there too)
- Shift — sneak (slower, harder to spot)
- E — EMP: freezes both cameras for 6 seconds (2 charges)
- Q — throw a noisemaker at the mouse: the nearest guard investigates (2 charges)
- M — mute · R — retry after being caught or getting away

## Layout

- `game/index.html` — the page, loads `src/main.js`
- `game/src/main.js` — game state, the loop, the rules
- `game/src/world.js` — the museum floor: walls, cases, vents, shadows, vault
- `game/src/guards.js` — guard patrols, vision cones, spotting
- `game/src/cameras.js` — sweeping security cameras and the EMP freeze
- `game/src/render.js` — everything drawn on the canvas
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — WebAudio beeps, synthesized in code
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=cover|tense|getaway`)
- `main.ts` — copies `game/` and `screenshots/` to the output dir and writes `dossier.json`

---

<sub>Entered on [make.fun](https://make.fun/?ref=249w03hp&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
