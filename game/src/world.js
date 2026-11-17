// The game itself: state, waves, movement, collisions, scoring and the
// combo chain. render.js draws whatever this module holds; main.js calls
// update() once a frame and reads state to decide which screen to show.

import {
  VIEW, CENTER, KEEPER, LIGHTHOUSE, COMBO, WAVES, SCORE, waveComposition,
} from './config.js';
import { makeRandom, pickWeighted, range } from './random.js';
import {
  makeKeeper, makeEnemy, makeBoss, makeBolt, makeEmber, burst, makeRing,
} from './entities.js';
import { rollShop, applyCard, cardRect } from './shop.js';

export function createWorld(audio) {
  const rng = makeRandom((Math.random() * 1e9) | 0);
  const state = {
    mode: 'title', // title | playing | shop | victory | gameover
    paused: false,
    time: 0,
    wave: 0,
    score: 0,
    embers: 0,
    kills: 0,
    best: Number(localStorage.getItem('lumenkeeper-best') ?? 0) || 0,
    lantern: LIGHTHOUSE.integrity,
    lanternMax: LIGHTHOUSE.maxIntegrity,
    nova: 0,
    owned: {},
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    shake: 0,
    beamAngle: 0,
    keeper: null,
    enemies: [],
    bolts: [],
    embersList: [],
    particles: [],
    rings: [],
    stars: [],
    fireflies: [],
    spawnQueue: [],
    spawnTimer: 0,
    waveBanner: 0,
    waveBannerText: '',
    shopCards: [],
    shopMessage: '',
    endStats: null,
    boss: null,
  };

  // A fixed starfield and drifting fireflies, seeded once per run.
  for (let i = 0; i < 130; i++) {
    state.stars.push({
      x: rng() * VIEW.width, y: rng() * VIEW.height * 0.62,
      r: range(rng, 0.6, 2), twinkle: rng() * Math.PI * 2,
    });
  }
  for (let i = 0; i < 22; i++) {
    state.fireflies.push({
      x: rng() * VIEW.width, y: range(rng, 380, 700),
      phase: rng() * Math.PI * 2, speed: range(rng, 0.3, 0.9),
    });
  }

  function resetRun() {
    state.mode = 'playing';
    state.paused = false;
    state.time = 0;
    state.wave = 0;
    state.score = 0;
    state.embers = 0;
    state.kills = 0;
    state.lantern = LIGHTHOUSE.integrity;
    state.nova = 0;
    state.owned = {};
    state.combo = 0;
    state.comboTimer = 0;
    state.multiplier = 1;
    state.enemies = [];
    state.bolts = [];
    state.embersList = [];
    state.particles = [];
    state.rings = [];
    state.spawnQueue = [];
    state.endStats = null;
    state.boss = null;
    state.keeper = makeKeeper({
      hearts: KEEPER.hearts,
      speed: KEEPER.speed,
      fireInterval: KEEPER.fireInterval,
      boltCount: 1,
      pierce: 0,
      pickupRadius: KEEPER.pickupRadius,
    });
    state.keeper.boltSpeed = KEEPER.boltSpeed;
    state.keeper.boltDamage = KEEPER.boltDamage;
    state.keeper.boltRadius = KEEPER.boltRadius;
    startWave(1);
  }

  function startWave(wave) {
    state.mode = 'playing';
    state.wave = wave;
    state.spawnQueue = [];
    const budget = WAVES.budgetFor(wave);
    const composition = waveComposition(wave);
    for (let i = 0; i < budget; i++) {
      state.spawnQueue.push(pickWeighted(rng, composition));
    }
    if (WAVES.bossWaves.includes(wave)) {
      state.spawnQueue.push('boss');
    }
    state.spawnTimer = 0.8;
    state.waveBanner = 2.4;
    state.waveBannerText = WAVES.bossWaves.includes(wave)
      ? `WAVE ${wave} — THE GLOOMWARDEN WAKES`
      : `WAVE ${wave}`;
    audio.waveHorn();
  }

  function openShop() {
    state.mode = 'shop';
    state.shopCards = rollShop(rng, state.owned);
    state.shopMessage = '';
    audio.shop();
  }

  function waveCleared() {
    const bonus = SCORE.waveClear(state.wave);
    state.score += bonus;
    if (state.wave >= WAVES.total) {
      endRun(true);
      return;
    }
    // A small mend between waves keeps a run alive without erasing mistakes.
    state.lantern = Math.min(state.lanternMax, state.lantern + 1);
    openShop();
  }

  function endRun(won) {
    state.mode = won ? 'victory' : 'gameover';
    state.endStats = {
      score: state.score,
      wave: state.wave,
      kills: state.kills,
      embers: state.embers,
      best: Math.max(state.best, state.score),
      newBest: state.score > state.best,
    };
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem('lumenkeeper-best', String(state.best));
    }
    if (won) audio.victory();
    else audio.defeat();
  }

  function addScore(base) {
    state.score += Math.round(base * state.multiplier);
  }

  function registerKill(enemy) {
    state.kills += 1;
    state.combo += 1;
    state.comboTimer = COMBO.windowSeconds;
    state.multiplier = Math.min(COMBO.maxMultiplier, 1 + (state.combo - 1) * COMBO.step);
    addScore(enemy.score);
    audio.kill(state.combo);
    burst(state.particles, enemy.x, enemy.y, enemy.color, 14, rng, 200, 0.7);
    if (state.nova > 0) {
      state.rings.push(makeRing(enemy.x, enemy.y, '#ffd76a', 70 + state.nova * 30));
      for (const other of state.enemies) {
        if (other === enemy) continue;
        const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
        if (d < 80 + state.nova * 30) damageEnemy(other, 1, true);
      }
    }
    // Splitters burst into motes where they died.
    if (enemy.splitsInto) {
      for (let i = 0; i < enemy.splitCount; i++) {
        const mote = makeEnemy(enemy.splitsInto, rng);
        mote.x = enemy.x + range(rng, -18, 18);
        mote.y = enemy.y + range(rng, -18, 18);
        state.enemies.push(mote);
      }
    }
    // Every kill drops one ember; brutes and bosses drop more.
    const drops = enemy.kind === 'boss' ? 8 : enemy.kind === 'brute' ? 3 : 1;
    for (let i = 0; i < drops; i++) {
      state.embersList.push(makeEmber(enemy.x + range(rng, -10, 10), enemy.y + range(rng, -10, 10), rng));
    }
  }

  function damageEnemy(enemy, amount, silent = false) {
    if (enemy.hp <= 0) return;
    enemy.hp -= amount;
    enemy.flash = 0.12;
    if (!silent) audio.hit();
    if (enemy.hp <= 0) {
      registerKill(enemy);
      state.enemies = state.enemies.filter((e) => e !== enemy);
      if (enemy.kind === 'boss') {
        state.boss = null;
        state.score += SCORE.bossBonus;
        state.shake = 14;
      }
    }
  }

  function hurtKeeper() {
    const keeper = state.keeper;
    if (keeper.invulnerable > 0) return;
    keeper.hearts -= 1;
    keeper.invulnerable = KEEPER.invulnerableSeconds;
    state.shake = 10;
    state.combo = 0;
    state.multiplier = 1;
    audio.hurt();
    burst(state.particles, keeper.x, keeper.y, '#7fe7d2', 18, rng, 220, 0.7);
    if (keeper.hearts <= 0) endRun(false);
  }

  function strikeLantern(enemy) {
    state.lantern -= 1;
    state.shake = 16;
    state.combo = 0;
    state.multiplier = 1;
    audio.lanternHit();
    state.rings.push(makeRing(CENTER.x, CENTER.y, '#ff9a3c', 130));
    burst(state.particles, enemy.x, enemy.y, '#ff9a3c', 20, rng, 240, 0.8);
    state.enemies = state.enemies.filter((e) => e !== enemy);
    if (state.lantern <= 0) endRun(false);
  }

  function fireBolts() {
    const keeper = state.keeper;
    const baseAngle = Math.atan2(keeper.aimY - keeper.y, keeper.aimX - keeper.x);
    const count = keeper.boltCount;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 0.14;
      state.bolts.push(makeBolt(
        keeper.x + Math.cos(baseAngle) * 22,
        keeper.y + Math.sin(baseAngle) * 22,
        baseAngle + offset,
        keeper,
      ));
    }
    burst(state.particles, keeper.x + Math.cos(baseAngle) * 26, keeper.y + Math.sin(baseAngle) * 26, '#ffe27a', 3, rng, 90, 0.25);
    audio.shoot();
  }

  function updatePlaying(dt, input) {
    const keeper = state.keeper;
    // Movement, kept inside the arena and out of the lighthouse.
    const move = input.moveVector();
    keeper.moving = move.x !== 0 || move.y !== 0;
    keeper.x = Math.min(VIEW.width - 20, Math.max(20, keeper.x + move.x * keeper.speed * dt));
    keeper.y = Math.min(VIEW.height - 20, Math.max(20, keeper.y + move.y * keeper.speed * dt));
    const toCenter = Math.hypot(keeper.x - CENTER.x, keeper.y - CENTER.y);
    const minDist = LIGHTHOUSE.radius + keeper.radius + 4;
    if (toCenter < minDist && toCenter > 0) {
      keeper.x = CENTER.x + ((keeper.x - CENTER.x) / toCenter) * minDist;
      keeper.y = CENTER.y + ((keeper.y - CENTER.y) / toCenter) * minDist;
    }
    if (keeper.moving) keeper.walkPhase += dt * 10;
    keeper.aimX = input.mouse.x;
    keeper.aimY = input.mouse.y;
    if (keeper.invulnerable > 0) keeper.invulnerable -= dt;

    // Firing.
    keeper.fireTimer -= dt;
    if (input.firing() && keeper.fireTimer <= 0) {
      fireBolts();
      keeper.fireTimer = keeper.fireInterval;
    }

    // Spawning.
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const kind = state.spawnQueue.shift();
        const enemy = kind === 'boss' ? makeBoss(state.wave, rng) : makeEnemy(kind, rng);
        if (kind === 'boss') state.boss = enemy;
        state.enemies.push(enemy);
        state.spawnTimer = WAVES.intervalFor(state.wave);
      }
    }

    // Bolts.
    for (const bolt of state.bolts) {
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;
      for (const enemy of [...state.enemies]) {
        if (bolt.hitKinds.has(enemy) || enemy.hp <= 0) continue;
        const d = Math.hypot(enemy.x - bolt.x, enemy.y - bolt.y);
        if (d < enemy.radius + bolt.radius) {
          bolt.hitKinds.add(enemy);
          damageEnemy(enemy, bolt.damage);
          burst(state.particles, bolt.x, bolt.y, '#ffe27a', 5, rng, 140, 0.35);
          if (bolt.pierce > 0) {
            bolt.pierce -= 1;
          } else {
            bolt.life = 0;
          }
          break;
        }
      }
    }
    state.bolts = state.bolts.filter((b) => b.life > 0 && b.x > -20 && b.x < VIEW.width + 20 && b.y > -20 && b.y < VIEW.height + 20);

    // Enemies hunt the lantern; wisps zigzag, the boss spawns motes.
    // The loop runs over a copy, so an enemy a bolt killed earlier this
    // frame is still in it — skip the dead, or one kill also strikes.
    for (const enemy of [...state.enemies]) {
      if (enemy.hp <= 0) continue;
      if (enemy.flash > 0) enemy.flash -= dt;
      const angle = Math.atan2(CENTER.y - enemy.y, CENTER.x - enemy.x);
      let vx = Math.cos(angle) * enemy.speed;
      let vy = Math.sin(angle) * enemy.speed;
      if (enemy.behavior === 'zigzag') {
        enemy.wobble += dt * enemy.wobbleSpeed;
        const perp = angle + Math.PI / 2;
        vx += Math.cos(perp) * Math.sin(enemy.wobble) * 90;
        vy += Math.sin(perp) * Math.sin(enemy.wobble) * 90;
      }
      enemy.x += vx * dt;
      enemy.y += vy * dt;
      if (enemy.behavior === 'boss') {
        enemy.spawnTimer -= dt;
        if (enemy.spawnTimer <= 0) {
          enemy.spawnTimer = 3.2;
          for (let i = 0; i < 2; i++) {
            const mote = makeEnemy('mote', rng);
            mote.x = enemy.x + range(rng, -40, 40);
            mote.y = enemy.y + range(rng, -40, 40);
            state.enemies.push(mote);
          }
        }
      }
      // Reached the lantern: it strikes, then dies.
      const dCenter = Math.hypot(enemy.x - CENTER.x, enemy.y - CENTER.y);
      if (dCenter < LIGHTHOUSE.radius + enemy.radius * 0.5) {
        strikeLantern(enemy);
        if (state.mode !== 'playing') return;
        continue;
      }
      // Touching the keeper hurts the keeper and kills the shade.
      const dKeeper = Math.hypot(enemy.x - keeper.x, enemy.y - keeper.y);
      if (dKeeper < enemy.radius + keeper.radius) {
        damageEnemy(enemy, 999, true);
        hurtKeeper();
        if (state.mode !== 'playing') return;
      }
    }

    // Embers drift, then fly to the keeper inside the pickup radius.
    for (const ember of state.embersList) {
      ember.life -= dt;
      const d = Math.hypot(keeper.x - ember.x, keeper.y - ember.y);
      if (d < keeper.pickupRadius || ember.magnetized) {
        ember.magnetized = true;
        const angle = Math.atan2(keeper.y - ember.y, keeper.x - ember.x);
        const pull = 520 * dt;
        ember.x += Math.cos(angle) * pull;
        ember.y += Math.sin(angle) * pull;
        if (d < keeper.radius + 10) {
          ember.life = 0;
          state.embers += 1;
          addScore(SCORE.ember);
          audio.ember(state.combo);
          burst(state.particles, ember.x, ember.y, '#ffcf5c', 4, rng, 110, 0.3);
        }
      } else {
        ember.x += ember.vx * dt;
        ember.y += ember.vy * dt;
        ember.vx *= 0.96;
        ember.vy *= 0.96;
        // Embers drift gently toward the keeper even at range, so a kill
        // anywhere on the field still pays if the player keeps fighting.
        const drift = Math.atan2(keeper.y - ember.y, keeper.x - ember.x);
        ember.x += Math.cos(drift) * 42 * dt;
        ember.y += Math.sin(drift) * 42 * dt;
      }
    }
    state.embersList = state.embersList.filter((e) => e.life > 0);

    // Combo decay.
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        state.multiplier = 1;
      }
    }

    // Wave cleared when the queue is empty and nothing remains.
    if (state.spawnQueue.length === 0 && state.enemies.length === 0 && state.mode === 'playing') {
      waveCleared();
    }
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const ring of state.rings) {
      ring.radius += (ring.maxRadius - ring.radius) * dt * 6;
      ring.life -= dt;
    }
    state.rings = state.rings.filter((r) => r.life > 0);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    if (state.waveBanner > 0) state.waveBanner -= dt;
    state.beamAngle += dt * 0.25;
  }

  function chooseShopCard(index) {
    const card = state.shopCards[index];
    if (!card) return;
    if (state.embers < card.cost) {
      state.shopMessage = 'Not enough embers — pick a cheaper card or continue.';
      return;
    }
    state.embers -= card.cost;
    applyCard(state, card);
    audio.buy();
    state.shopMessage = `${card.name} — the light answers.`;
    state.shopCards = rollShop(rng, state.owned);
  }

  function update(input, dt) {
    state.time += dt;
    updateParticles(dt);

    if (input.wasPressed('m')) {
      const muted = audio.toggleMute();
      state.shopMessage = muted ? 'Sound off (M to turn back on).' : '';
    }

    if (state.mode === 'title') {
      const click = input.consumeClick();
      if (input.wasPressed('enter') || input.wasPressed(' ') || click) {
        audio.unlock();
        resetRun();
      }
      return;
    }

    if (state.mode === 'victory' || state.mode === 'gameover') {
      const click = input.consumeClick();
      if (input.wasPressed('enter') || input.wasPressed('r') || click) {
        resetRun();
      }
      return;
    }

    if (state.mode === 'shop') {
      const click = input.consumeClick();
      if (click) {
        for (let i = 0; i < state.shopCards.length; i++) {
          const rect = cardRect(i);
          if (click.x >= rect.x && click.x <= rect.x + rect.w && click.y >= rect.y && click.y <= rect.y + rect.h) {
            chooseShopCard(i);
          }
        }
        // Continue button under the cards.
        if (click.x >= 540 && click.x <= 740 && click.y >= 512 && click.y <= 556) {
          startWave(state.wave + 1);
        }
      }
      if (input.wasPressed('1')) chooseShopCard(0);
      if (input.wasPressed('2')) chooseShopCard(1);
      if (input.wasPressed('3')) chooseShopCard(2);
      if (input.wasPressed('enter') || input.wasPressed(' ')) startWave(state.wave + 1);
      return;
    }

    // Playing.
    if (input.wasPressed('p') || input.wasPressed('escape')) {
      state.paused = !state.paused;
    }
    if (state.paused) return;
    updatePlaying(dt, input);
  }

  return { state, update, resetRun, startWave };
}
