[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/edurax17-bot/lumenkeeper/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/edurax17-bot/lumenkeeper/reward.svg)](https://make.fun/bounty/best-game-01)

# Lumenkeeper — Light the Last Lantern

A complete, original browser game for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). Built with [make.fun](https://make.fun/r/1c6jcmp6).

You are the keeper of the last lantern. Shades crawl out of the dark to snuff
its light. Move with **WASD** or arrow keys, aim with the **mouse**, and hold
**click** or **Space** to fire bolts of light. Chain kills into combos, gather
the embers the fallen drop, and spend them on one of three upgrades between
waves. Survive all **10 waves** — and face the Gloomwarden on waves 5 and 10 —
to see the dawn break.

## How it plays

- **Goal:** keep the lantern lit through wave 10. Lose when the lantern's
  integrity or the keeper's hearts reach zero.
- **Enemies:** motes (fast), shades, wisps (zigzag), splitters (burst into
  motes), brutes (tough), and the Gloomwarden boss, who spawns motes.
- **Combos:** kills within a few seconds chain together, up to a x4 score
  multiplier. Getting hit or letting a shade reach the lantern breaks it.
- **Upgrades:** between waves, pick one of three cards — Rapid Light, Twin
  Beam, Piercing Light, Ember Magnet, Swift Boots, Mend Lantern, Keeper's
  Heart, or Nova Burst — paid for in embers.
- **Feel:** synthesized WebAudio sound (no audio files), particles on every
  hit, screen shake when the lantern is struck, a rotating light beam, and a
  best score kept in `localStorage`.
- **Controls:** WASD/arrows move · mouse aims · click/Space fires · P pauses ·
  M mutes · R restarts after the end · 1/2/3 pick shop cards.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network
requests. `main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output directory and writes `dossier.json`.

## Layout

- `game/index.html` — page and canvas
- `game/src/config.js` — tuning, palette, enemies, upgrades
- `game/src/random.js` — seeded random generator
- `game/src/audio.js` — synthesized WebAudio effects
- `game/src/input.js` — keyboard and mouse state
- `game/src/entities.js` — keeper, enemies, bolts, embers, particles
- `game/src/shop.js` — between-wave upgrade cards
- `game/src/world.js` — state, waves, collisions, scoring, combos
- `game/src/render.js` — all canvas drawing, HUD and screens
- `game/src/shots.js` — deterministic staged scenes for screenshots
- `game/src/main.js` — fixed-step loop and wiring
- `main.ts` — the entrypoint that hands the game in
- `screenshots/` — real renders of the game's own code in a browser

## License

MIT — see [LICENSE](LICENSE).
