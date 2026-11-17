// Lumenkeeper tuning: every number the game balances on lives here, so a
// change to difficulty or feel is one edit, not a hunt through the code.

export const VIEW = { width: 1280, height: 720 };
export const CENTER = { x: VIEW.width / 2, y: VIEW.height / 2 };

export const PALETTE = {
  skyTop: '#0b1026',
  skyBottom: '#1b2a4a',
  hillFar: '#141c33',
  hillNear: '#0e1526',
  ground: '#101827',
  lanternGlow: '#ffb347',
  lanternCore: '#ffe9a8',
  ember: '#ffcf5c',
  emberHot: '#ff9a3c',
  bolt: '#ffe27a',
  keeper: '#7fe7d2',
  keeperDark: '#2f8f7d',
  shade: '#8b7fd4',
  mote: '#c9b8ff',
  wisp: '#7dd7ff',
  splitter: '#e58cff',
  brute: '#ff7a6b',
  boss: '#ff4d6d',
  hudPanel: 'rgba(8, 12, 26, 0.72)',
  text: '#f4ead2',
  textDim: '#a9b4d0',
};

export const KEEPER = {
  radius: 16,
  speed: 265,
  hearts: 3,
  maxHearts: 5,
  fireInterval: 0.22,
  boltSpeed: 640,
  boltDamage: 1,
  boltRadius: 5,
  pickupRadius: 110,
  invulnerableSeconds: 1.2,
};

export const LIGHTHOUSE = {
  radius: 52,
  integrity: 7,
  maxIntegrity: 8,
};

export const COMBO = { windowSeconds: 3.5, step: 0.25, maxMultiplier: 4 };

export const WAVES = {
  total: 10,
  bossWaves: [5, 10],
  // Spawn budget grows with the wave; composition unlocks as waves rise.
  budgetFor: (wave) => 4 + wave * 3,
  intervalFor: (wave) => Math.max(0.55, 1.45 - wave * 0.08),
};

export const SCORE = {
  killBase: 10,
  ember: 5,
  waveClear: (wave) => 100 * wave,
  bossBonus: 500,
};

// Enemy kinds: hp, speed, radius, score, colour, behaviour tag.
export const ENEMIES = {
  mote:     { hp: 1, speed: 135, radius: 11, score: 10, color: PALETTE.mote,     behavior: 'chase' },
  shade:    { hp: 1, speed: 85,  radius: 15, score: 10, color: PALETTE.shade,    behavior: 'chase' },
  wisp:     { hp: 1, speed: 175, radius: 12, score: 15, color: PALETTE.wisp,     behavior: 'zigzag' },
  splitter: { hp: 2, speed: 80,  radius: 19, score: 20, color: PALETTE.splitter, behavior: 'chase', splitsInto: 'mote', splitCount: 2 },
  brute:    { hp: 4, speed: 52,  radius: 26, score: 30, color: PALETTE.brute,    behavior: 'chase' },
  boss:     { hp: 46, speed: 38, radius: 44, score: 500, color: PALETTE.boss,    behavior: 'boss' },
};

// Which kinds may appear in a wave (weights), unlocked as waves rise.
export function waveComposition(wave) {
  const table = [['shade', 10], ['mote', 6]];
  if (wave >= 2) table.push(['wisp', 4]);
  if (wave >= 3) table.push(['splitter', 4]);
  if (wave >= 4) table.push(['brute', 3]);
  if (wave >= 6) table.push(['mote', 5], ['wisp', 3]);
  return table;
}

export const UPGRADES = [
  { id: 'rapid',   name: 'Rapid Light',   desc: '+25% fire rate',            cost: 25, apply: (s) => { s.fireInterval *= 0.8; } },
  { id: 'twin',    name: 'Twin Beam',     desc: '+1 bolt per shot',          cost: 40, apply: (s) => { s.boltCount += 1; } },
  { id: 'pierce',  name: 'Piercing Light',desc: 'Bolts pierce +1 enemy',     cost: 35, apply: (s) => { s.pierce += 1; } },
  { id: 'magnet',  name: 'Ember Magnet',  desc: '+70% ember pickup radius', cost: 20, apply: (s) => { s.pickupRadius *= 1.7; } },
  { id: 'boots',   name: 'Swift Boots',   desc: '+15% move speed',           cost: 20, apply: (s) => { s.speed *= 1.15; } },
  // Mend, Heart and Nova touch world state, not keeper stats: their healing
  // and counters are applied by shop.js from the card id, so these are no-ops.
  { id: 'mend',    name: 'Mend Lantern',  desc: 'Restore 2 lantern integrity', cost: 30, apply: () => {} },
  { id: 'heart',   name: "Keeper's Heart",desc: '+1 keeper heart (max 5)',   cost: 45, apply: () => {} },
  { id: 'nova',    name: 'Nova Burst',    desc: 'Kills explode, hurting nearby foes', cost: 50, apply: () => {} },
];
