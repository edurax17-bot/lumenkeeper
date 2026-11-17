// The between-wave shop: three upgrade cards, one choice, paid in embers.
// The choice is the run's strategy — fire faster, hit harder, or mend the
// lantern — and a card you cannot afford is a choice you have already made.

import { UPGRADES } from './config.js';

export function rollShop(rng, ownedCounts) {
  // Three different cards; a card already owned twice is less likely to
  // reappear, so the shop keeps offering something new.
  const pool = UPGRADES.filter((card) => (ownedCounts[card.id] ?? 0) < 3);
  const source = pool.length >= 3 ? pool : UPGRADES;
  const picked = [];
  const bag = [...source];
  while (picked.length < 3 && bag.length > 0) {
    const index = Math.floor(rng() * bag.length);
    picked.push(bag.splice(index, 1)[0]);
  }
  return picked;
}

export function cardRect(index) {
  // Cards are laid out in a row; render.js draws them from these rects and
  // the click handling in world.js tests the same rects.
  const width = 300;
  const height = 210;
  const gap = 28;
  const total = width * 3 + gap * 2;
  const x0 = (1280 - total) / 2;
  return { x: x0 + index * (width + gap), y: 268, w: width, h: height };
}

export function applyCard(state, card) {
  // The card edits the keeper's live stats in place; Mend, Heart and Nova
  // touch world state instead, so they are applied here by card id.
  const stats = state.keeper;
  card.apply(stats);
  if (card.id === 'mend') {
    state.lantern = Math.min(state.lanternMax, state.lantern + 2);
  }
  if (card.id === 'heart') {
    stats.hearts = Math.min(5, stats.hearts + 1);
  }
  if (card.id === 'nova') {
    state.nova += 1;
  }
  state.owned[card.id] = (state.owned[card.id] ?? 0) + 1;
}
