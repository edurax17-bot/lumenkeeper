// Lumenkeeper entry point: canvas setup, the fixed-step loop, and wiring
// input, world, audio and rendering together. The canvas is always
// 1280x720 internally and scaled by CSS to fill the window.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import { render } from './render.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const audio = createAudio();
const input = createInput(canvas);
const world = createWorld(audio);
const state = world.state;

// Debug handle for play-testing: lets an automated browser read the live
// state (mode, wave, score) without changing how the game plays.
window.__lumenkeeper = state;

const params = new URLSearchParams(window.location.search);
const shotScene = params.get('shot');
let shotReady = false;

if (shotScene) {
  // A staged scene renders once, frozen, so a screenshot is stable.
  if (setupShot(state, shotScene)) {
    render(ctx, state);
    window.__shotReady = true;
    shotReady = true;
  }
}

function announce() {
  if (!status) return;
  const keeper = state.keeper;
  if (state.mode === 'title') status.textContent = 'Lumenkeeper. Press Enter to begin.';
  else if (state.mode === 'shop') status.textContent = `Wave ${state.wave} cleared. Choose an upgrade.`;
  else if (state.mode === 'victory') status.textContent = `Victory. Score ${state.score}. Press R to play again.`;
  else if (state.mode === 'gameover') status.textContent = `Game over. Score ${state.score}. Press R to play again.`;
  else if (keeper) status.textContent = `Wave ${state.wave}. Score ${state.score}. Lantern ${state.lantern}.`;
}

let last = performance.now();
let announcedMode = '';

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotReady) {
    world.update(input, dt);
    render(ctx, state);
    input.endFrame();
    if (state.mode !== announcedMode) {
      announcedMode = state.mode;
      announce();
    }
  }
  requestAnimationFrame(frame);
}

if (!shotReady) {
  requestAnimationFrame(frame);
}
