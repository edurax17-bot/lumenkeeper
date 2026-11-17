// Everything the player sees, drawn on one canvas at 1280x720. The night
// palette is fixed: deep indigo sky, warm amber lantern light, teal keeper.
// Every screen — title, shop, victory, game over — is drawn here from the
// same world state, so a screenshot always shows the real game.

import { VIEW, CENTER, PALETTE, LIGHTHOUSE, WAVES } from './config.js';
import { cardRect } from './shop.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, state) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Stars, twinkling slowly.
  for (const star of state.stars) {
    const alpha = 0.35 + 0.35 * Math.sin(state.time * 1.5 + star.twinkle);
    ctx.globalAlpha = Math.max(0.05, alpha);
    ctx.fillStyle = '#dfe8ff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Distant hills.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.quadraticCurveTo(220, 440, 480, 505);
  ctx.quadraticCurveTo(760, 560, 1020, 480);
  ctx.quadraticCurveTo(1180, 440, 1280, 490);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.quadraticCurveTo(320, 540, 640, 590);
  ctx.quadraticCurveTo(960, 630, 1280, 570);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();

  // Ground glow around the lantern.
  const glow = ctx.createRadialGradient(CENTER.x, CENTER.y, 10, CENTER.x, CENTER.y, 340);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.28)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Fireflies drifting low over the ground.
  for (const fly of state.fireflies) {
    const fx = fly.x + Math.sin(state.time * fly.speed + fly.phase) * 24;
    const fy = fly.y + Math.cos(state.time * fly.speed * 0.7 + fly.phase) * 10;
    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(state.time * 2 + fly.phase);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLighthouse(ctx, state) {
  const flicker = 0.9 + 0.1 * Math.sin(state.time * 6.3);
  const lanternHealth = state.lantern / state.lanternMax;

  // Rotating light beam sweeping the night.
  ctx.save();
  ctx.translate(CENTER.x, CENTER.y);
  ctx.rotate(state.beamAngle);
  const beam = ctx.createLinearGradient(0, 0, 520, 0);
  beam.addColorStop(0, `rgba(255, 233, 168, ${0.22 * flicker})`);
  beam.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(520, -64);
  ctx.lineTo(520, 64);
  ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(Math.PI);
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(520, -64);
  ctx.lineTo(520, 64);
  ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Tower: stone base, warm lamp room, cracked when hurt.
  ctx.fillStyle = '#3a4157';
  ctx.beginPath();
  ctx.moveTo(CENTER.x - 34, CENTER.y + 52);
  ctx.lineTo(CENTER.x - 22, CENTER.y - 30);
  ctx.lineTo(CENTER.x + 22, CENTER.y - 30);
  ctx.lineTo(CENTER.x + 34, CENTER.y + 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c3348';
  ctx.fillRect(CENTER.x - 34, CENTER.y + 44, 68, 8);
  ctx.fillStyle = `rgba(255, 179, 71, ${0.55 + 0.45 * lanternHealth})`;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y - 40, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y - 40, 11 * flicker, 0, Math.PI * 2);
  ctx.fill();
  // Cracks show how much integrity is left.
  if (lanternHealth < 0.66) {
    ctx.strokeStyle = '#0b1026';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CENTER.x - 18, CENTER.y + 10);
    ctx.lineTo(CENTER.x - 6, CENTER.y + 26);
    ctx.lineTo(CENTER.x - 14, CENTER.y + 44);
    ctx.stroke();
  }
  if (lanternHealth < 0.34) {
    ctx.beginPath();
    ctx.moveTo(CENTER.x + 20, CENTER.y + 6);
    ctx.lineTo(CENTER.x + 10, CENTER.y + 30);
    ctx.lineTo(CENTER.x + 18, CENTER.y + 48);
    ctx.stroke();
  }
}

function drawKeeper(ctx, state) {
  const keeper = state.keeper;
  if (!keeper) return;
  // Blink while invulnerable after a hit.
  if (keeper.invulnerable > 0 && Math.floor(state.time * 12) % 2 === 0) return;
  const bob = keeper.moving ? Math.sin(keeper.walkPhase) * 2 : Math.sin(state.time * 2) * 1.5;
  // Aim line, faint, so the player always knows where the next bolt goes.
  const aimAngle = Math.atan2(keeper.aimY - keeper.y, keeper.aimX - keeper.x);
  ctx.strokeStyle = 'rgba(255, 226, 122, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(keeper.x, keeper.y);
  ctx.lineTo(keeper.x + Math.cos(aimAngle) * 52, keeper.y + Math.sin(aimAngle) * 52);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cloaked keeper: teal robe, amber lantern in hand.
  ctx.fillStyle = PALETTE.keeperDark;
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y + bob, keeper.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.keeper;
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y + bob, keeper.radius - 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b1026';
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y + bob - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lanternGlow;
  ctx.beginPath();
  ctx.arc(keeper.x + Math.cos(aimAngle) * 18, keeper.y + bob + Math.sin(aimAngle) * 18, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies(ctx, state) {
  for (const enemy of state.enemies) {
    const flash = enemy.flash > 0;
    ctx.fillStyle = flash ? '#ffffff' : enemy.color;
    if (enemy.kind === 'brute' || enemy.kind === 'boss') {
      // Horned, heavy silhouettes for the tough kinds.
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#0b1026';
      ctx.beginPath();
      ctx.moveTo(enemy.x - enemy.radius * 0.7, enemy.y - enemy.radius * 0.55);
      ctx.lineTo(enemy.x - enemy.radius * 0.3, enemy.y - enemy.radius * 1.15);
      ctx.lineTo(enemy.x - enemy.radius * 0.05, enemy.y - enemy.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.radius * 0.7, enemy.y - enemy.radius * 0.55);
      ctx.lineTo(enemy.x + enemy.radius * 0.3, enemy.y - enemy.radius * 1.15);
      ctx.lineTo(enemy.x + enemy.radius * 0.05, enemy.y - enemy.radius * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (enemy.kind === 'wisp') {
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - enemy.radius);
      ctx.quadraticCurveTo(enemy.x + enemy.radius, enemy.y, enemy.x, enemy.y + enemy.radius);
      ctx.quadraticCurveTo(enemy.x - enemy.radius, enemy.y, enemy.x, enemy.y - enemy.radius);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Eyes, always watching the lantern.
    ctx.fillStyle = '#0b1026';
    const eyeAngle = Math.atan2(CENTER.y - enemy.y, CENTER.x - enemy.x);
    const ex = Math.cos(eyeAngle) * enemy.radius * 0.35;
    const ey = Math.sin(eyeAngle) * enemy.radius * 0.35;
    ctx.beginPath();
    ctx.arc(enemy.x + ex - 4, enemy.y + ey - 3, 2.2, 0, Math.PI * 2);
    ctx.arc(enemy.x + ex + 4, enemy.y + ey - 3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Health bar for anything tougher than one hit.
    if (enemy.maxHp > 1) {
      const w = enemy.radius * 2;
      ctx.fillStyle = 'rgba(8, 12, 26, 0.8)';
      ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.radius - 12, w, 5);
      ctx.fillStyle = '#ff5d73';
      ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.radius - 12, w * (enemy.hp / enemy.maxHp), 5);
    }
  }
}

function drawBoltsEmbersParticles(ctx, state) {
  for (const ember of state.embersList) {
    const pulse = 0.75 + 0.25 * Math.sin(state.time * 5 + ember.x);
    ctx.globalAlpha = Math.max(0.3, pulse);
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.emberHot;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, ember.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const bolt of state.bolts) {
    ctx.strokeStyle = PALETTE.bolt;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bolt.x - bolt.vx * 0.02, bolt.y - bolt.vy * 0.02);
    ctx.lineTo(bolt.x, bolt.y);
    ctx.stroke();
  }
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const ring of state.rings) {
    ctx.globalAlpha = Math.max(0, ring.life / ring.maxLife) * 0.8;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  const keeper = state.keeper;
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 16, 14, 330, 96, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`SCORE ${state.score}`, 32, 46);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`WAVE ${state.wave} / ${WAVES.total}    EMBERS ${state.embers}    BEST ${state.best}`, 32, 72);
  // Lantern integrity hearts.
  for (let i = 0; i < state.lanternMax; i++) {
    ctx.fillStyle = i < state.lantern ? PALETTE.lanternGlow : 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(32 + i * 22, 94, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('LANTERN', 32 + state.lanternMax * 22 + 8, 99);

  // Keeper hearts, top right.
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, VIEW.width - 216, 14, 200, 46, 12);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = keeper && i < keeper.hearts ? '#ff5d73' : 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(VIEW.width - 188 + i * 26, 37, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('KEEPER', VIEW.width - 66, 42);

  // Combo meter, under the score panel.
  if (state.combo >= 2) {
    const frac = state.comboTimer / 3.5;
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 16, 118, 220, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`COMBO x${state.multiplier.toFixed(2)}  (${state.combo})`, 28, 144);
    ctx.fillStyle = 'rgba(255, 215, 106, 0.5)';
    ctx.fillRect(28, 148, 196 * frac, 4);
  }

  // Boss health bar, centred at the top.
  if (state.boss) {
    const boss = state.boss;
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, VIEW.width / 2 - 220, 14, 440, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#ff5d73';
    ctx.fillRect(VIEW.width / 2 - 208, 26, 416 * Math.max(0, boss.hp / boss.maxHp), 10);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE GLOOMWARDEN', VIEW.width / 2, 48);
    ctx.textAlign = 'left';
  }

  // Wave banner.
  if (state.waveBanner > 0) {
    ctx.globalAlpha = Math.min(1, state.waveBanner);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.waveBannerText, VIEW.width / 2, 190);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // Controls hint, bottom left.
  ctx.fillStyle = 'rgba(244, 234, 210, 0.55)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('WASD move · Mouse aim · Hold click / Space to fire · P pause · M mute', 16, VIEW.height - 14);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8, 12, 26, 0.82)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(8, 12, 26, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 290, 120, 700, 480);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lanternGlow;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('LUMENKEEPER', VIEW.width / 2, 215);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Light the last lantern. Hold the night.', VIEW.width / 2, 255);
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  const lines = [
    'Shades crawl from the dark to snuff the lantern.',
    'Move with WASD or arrows. Aim with the mouse.',
    'Hold click or Space to fire bolts of light.',
    'Chain kills into combos. Gather embers. Spend them',
    'on upgrades between waves. Survive all 10 waves —',
    'and face the Gloomwarden on waves 5 and 10.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 300 + i * 26));
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('▶  CLICK OR PRESS ENTER TO BEGIN', VIEW.width / 2, 500);
  if (state.best > 0) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Best score: ${state.best}`, VIEW.width / 2, 540);
  }
  ctx.textAlign = 'left';
}

function drawShop(ctx, state) {
  ctx.fillStyle = 'rgba(8, 12, 26, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(`WAVE ${state.wave} CLEARED`, VIEW.width / 2, 120);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`Score ${state.score}  ·  Embers ${state.embers}  ·  The lantern mends +1`, VIEW.width / 2, 158);
  ctx.fillStyle = PALETTE.lanternGlow;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('CHOOSE ONE UPGRADE — CLICK A CARD OR PRESS 1, 2, 3', VIEW.width / 2, 220);
  state.shopCards.forEach((card, i) => {
    const rect = cardRect(i);
    const affordable = state.embers >= card.cost;
    panel(ctx, rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = affordable ? PALETTE.text : PALETTE.textDim;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(card.name, rect.x + rect.w / 2, rect.y + 52);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(card.desc, rect.x + rect.w / 2, rect.y + 92);
    ctx.fillStyle = affordable ? PALETTE.ember : '#ff7a6b';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`◆ ${card.cost} embers`, rect.x + rect.w / 2, rect.y + 140);
    if (!affordable) {
      ctx.fillStyle = '#ff7a6b';
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText('not enough embers', rect.x + rect.w / 2, rect.y + 172);
    }
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`[${i + 1}]`, rect.x + rect.w / 2, rect.y + 196);
  });
  if (state.shopMessage) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(state.shopMessage, VIEW.width / 2, 500);
  }
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('▶  CONTINUE TO THE NEXT WAVE  (ENTER)', VIEW.width / 2, 536);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, state, won) {
  const stats = state.endStats ?? { score: state.score, wave: state.wave, kills: state.kills, embers: state.embers, newBest: false };
  ctx.fillStyle = won ? 'rgba(20, 40, 20, 0.55)' : 'rgba(20, 8, 16, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 340, 130, 600, 440);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.lanternGlow : '#ff5d73';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(won ? 'DAWN BREAKS' : 'THE LIGHT DIES', VIEW.width / 2, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText(
    won ? 'Ten waves held. The lantern burns on — the night retreats.' : 'The shades take the lantern. But a keeper always relights it.',
    VIEW.width / 2, 262,
  );
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.fillText(`SCORE  ${stats.score}`, VIEW.width / 2, 330);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`Wave reached: ${stats.wave}   ·   Shades banished: ${stats.kills}   ·   Embers gathered: ${stats.embers}`, VIEW.width / 2, 372);
  if (stats.newBest) {
    ctx.fillStyle = PALETTE.ember;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', VIEW.width / 2, 412);
  }
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('▶  PLAY AGAIN — CLICK OR PRESS R', VIEW.width / 2, 500);
  ctx.textAlign = 'left';
}

export function render(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawBackground(ctx, state);
  drawLighthouse(ctx, state);
  drawEnemies(ctx, state);
  drawKeeper(ctx, state);
  drawBoltsEmbersParticles(ctx, state);
  ctx.restore();

  if (state.mode === 'playing' || state.paused) drawHud(ctx, state);
  if (state.mode === 'shop') {
    drawHud(ctx, state);
    drawShop(ctx, state);
  }
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'victory') drawEnd(ctx, state, true);
  if (state.mode === 'gameover') drawEnd(ctx, state, false);
  if (state.paused && state.mode === 'playing') {
    ctx.fillStyle = 'rgba(8, 12, 26, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('Press P to carry on', VIEW.width / 2, VIEW.height / 2 + 40);
    ctx.textAlign = 'left';
  }
}
