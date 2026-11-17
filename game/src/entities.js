// The things that live in the arena: the keeper, the shades that hunt the
// lantern, the keeper's bolts, the embers they drop, and the particles that
// make every hit feel like something happened. Each is a plain object;
// world.js owns how they move and collide.

import { ENEMIES, CENTER, VIEW } from './config.js';
import { range } from './random.js';

export function makeKeeper(stats) {
  return {
    x: CENTER.x,
    y: CENTER.y + 150,
    radius: 16,
    hearts: stats.hearts,
    speed: stats.speed,
    fireInterval: stats.fireInterval,
    boltCount: stats.boltCount,
    pierce: stats.pierce,
    pickupRadius: stats.pickupRadius,
    fireTimer: 0,
    invulnerable: 0,
    aimX: CENTER.x,
    aimY: CENTER.y - 100,
    walkPhase: 0,
    moving: false,
  };
}

export function makeEnemy(kind, rng) {
  const def = ENEMIES[kind];
  // Spawn just outside a random edge, so the player sees them arrive.
  const side = Math.floor(rng() * 4);
  let x;
  let y;
  if (side === 0) { x = range(rng, 0, VIEW.width); y = -30; }
  else if (side === 1) { x = VIEW.width + 30; y = range(rng, 0, VIEW.height); }
  else if (side === 2) { x = range(rng, 0, VIEW.width); y = VIEW.height + 30; }
  else { x = -30; y = range(rng, 0, VIEW.height); }
  return {
    kind,
    x,
    y,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed * range(rng, 0.9, 1.1),
    radius: def.radius,
    score: def.score,
    color: def.color,
    behavior: def.behavior,
    splitsInto: def.splitsInto ?? null,
    splitCount: def.splitCount ?? 0,
    wobble: rng() * Math.PI * 2,
    wobbleSpeed: range(rng, 2, 4),
    flash: 0,
    spawnTimer: 0,
  };
}

export function makeBoss(wave, rng) {
  const boss = makeEnemy('boss', rng);
  boss.hp = 34 + wave * 4;
  boss.maxHp = boss.hp;
  boss.score = 500;
  boss.x = VIEW.width / 2;
  boss.y = -60;
  return boss;
}

export function makeBolt(x, y, angle, stats) {
  return {
    x, y,
    vx: Math.cos(angle) * stats.boltSpeed,
    vy: Math.sin(angle) * stats.boltSpeed,
    damage: stats.boltDamage,
    radius: stats.boltRadius,
    pierce: stats.pierce,
    hitKinds: new Set(),
    life: 1.6,
  };
}

export function makeEmber(x, y, rng) {
  return {
    x, y,
    vx: range(rng, -40, 40),
    vy: range(rng, -40, 40),
    radius: 6,
    value: 5,
    life: 12,
    magnetized: false,
  };
}

export function makeParticle(x, y, color, count, rng, speed = 160, life = 0.6) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const power = range(rng, 0.3, 1) * speed;
    out.push({
      x, y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      radius: range(rng, 1.5, 4),
      color,
      life: range(rng, 0.3, life),
      maxLife: life,
    });
  }
  return out;
}

export function burst(particles, x, y, color, count, rng, speed, life) {
  particles.push(...makeParticle(x, y, color, count, rng, speed, life));
}

// A short-lived expanding ring, used for lantern hits and nova bursts.
export function makeRing(x, y, color, maxRadius = 90) {
  return { x, y, color, radius: 8, maxRadius, life: 0.45, maxLife: 0.45 };
}
