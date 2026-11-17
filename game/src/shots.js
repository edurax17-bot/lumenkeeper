// Deterministic staged scenes for screenshots. Each scene builds a fixed
// game state with a seeded generator and a fixed simulated clock, then the
// page renders exactly one frame. The picture is still the game's own
// rendering code drawing the game's own state in a real browser — nothing
// is drawn, cropped or composited outside the game.

import { VIEW, CENTER, KEEPER, LIGHTHOUSE } from './config.js';
import { makeRandom, range } from './random.js';
import { makeKeeper, makeEnemy, makeBoss, makeBolt, makeEmber, makeParticle } from './entities.js';

function seedWorld(state, seed, wave, score, embers, lantern, hearts) {
  const rng = makeRandom(seed);
  state.time = 12.5;
  state.wave = wave;
  state.score = score;
  state.embers = embers;
  state.kills = 34 + wave * 6;
  state.lantern = lantern;
  state.lanternMax = LIGHTHOUSE.maxIntegrity;
  state.keeper = makeKeeper({
    hearts,
    speed: KEEPER.speed,
    fireInterval: KEEPER.fireInterval,
    boltCount: 2,
    pierce: 1,
    pickupRadius: KEEPER.pickupRadius,
  });
  state.keeper.boltSpeed = KEEPER.boltSpeed;
  state.keeper.boltDamage = KEEPER.boltDamage;
  state.keeper.boltRadius = KEEPER.boltRadius;
  state.keeper.x = CENTER.x + 180;
  state.keeper.y = CENTER.y + 170;
  state.keeper.aimX = CENTER.x - 120;
  state.keeper.aimY = CENTER.y - 140;
  state.enemies = [];
  state.bolts = [];
  state.embersList = [];
  state.particles = [];
  state.rings = [];
  state.spawnQueue = [];
  state.boss = null;
  return rng;
}

function scatterEnemies(state, rng, kinds) {
  for (const kind of kinds) {
    const enemy = kind === 'boss' ? makeBoss(state.wave, rng) : makeEnemy(kind, rng);
    // Place them inside the arena, approaching from all sides.
    const angle = rng() * Math.PI * 2;
    const dist = range(rng, 130, 330);
    enemy.x = CENTER.x + Math.cos(angle) * dist;
    enemy.y = CENTER.y + Math.sin(angle) * dist * 0.75;
    enemy.x = Math.min(VIEW.width - 30, Math.max(30, enemy.x));
    enemy.y = Math.min(VIEW.height - 30, Math.max(30, enemy.y));
    if (kind === 'boss') state.boss = enemy;
    state.enemies.push(enemy);
  }
}

function scatterEmbers(state, rng, count) {
  for (let i = 0; i < count; i++) {
    const ember = makeEmber(
      CENTER.x + range(rng, -260, 260),
      CENTER.y + range(rng, -180, 220),
      rng,
    );
    state.embersList.push(ember);
  }
}

function scatterBolts(state) {
  const keeper = state.keeper;
  for (let i = 0; i < 4; i++) {
    const angle = Math.atan2(keeper.aimY - keeper.y, keeper.aimX - keeper.x) + (i - 1.5) * 0.12;
    const bolt = makeBolt(keeper.x, keeper.y, angle, keeper);
    bolt.x = keeper.x + Math.cos(angle) * (60 + i * 55);
    bolt.y = keeper.y + Math.sin(angle) * (60 + i * 55);
    state.bolts.push(bolt);
  }
}

function scatterSparks(state, rng) {
  state.particles.push(...makeParticle(CENTER.x - 160, CENTER.y - 120, '#ffe27a', 14, rng, 200, 0.7));
  state.particles.push(...makeParticle(CENTER.x + 200, CENTER.y + 60, '#8b7fd4', 12, rng, 180, 0.7));
}

export function setupShot(state, scene) {
  if (scene === 'start') {
    const rng = seedWorld(state, 11, 0, 0, 0, LIGHTHOUSE.integrity, KEEPER.hearts);
    state.mode = 'title';
    state.best = 1840;
    scatterEnemies(state, rng, ['shade', 'mote', 'mote', 'wisp']);
    return true;
  }
  if (scene === 'play') {
    const rng = seedWorld(state, 23, 3, 1240, 18, 5, 3);
    state.mode = 'playing';
    state.best = 1240;
    state.combo = 6;
    state.comboTimer = 2.6;
    state.multiplier = 2.25;
    state.waveBanner = 0;
    scatterEnemies(state, rng, ['shade', 'shade', 'mote', 'mote', 'wisp', 'splitter']);
    scatterEmbers(state, rng, 7);
    scatterBolts(state);
    scatterSparks(state, rng);
    return true;
  }
  if (scene === 'late') {
    const rng = seedWorld(state, 47, 8, 7420, 64, 3, 2);
    state.mode = 'playing';
    state.best = 7420;
    state.combo = 11;
    state.comboTimer = 3.1;
    state.multiplier = 3.5;
    state.waveBanner = 0;
    state.keeper.boltCount = 3;
    scatterEnemies(state, rng, ['shade', 'shade', 'mote', 'mote', 'mote', 'wisp', 'wisp', 'splitter', 'splitter', 'brute', 'brute']);
    scatterEmbers(state, rng, 12);
    scatterBolts(state);
    scatterSparks(state, rng);
    return true;
  }
  if (scene === 'end') {
    const rng = seedWorld(state, 71, 6, 4860, 41, 0, 2);
    state.mode = 'gameover';
    state.endStats = { score: 4860, wave: 6, kills: 87, embers: 41, best: 4860, newBest: true };
    scatterEnemies(state, rng, ['shade', 'mote', 'brute']);
    scatterSparks(state, rng);
    return true;
  }
  return false;
}
