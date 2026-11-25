// The overlay: the night's tally, the streak, the hint line, service messages,
// the title card, the pause card and the end-of-night report.

import { VIEW, PALETTE, INGREDIENTS, RECIPES } from './config.js';
import { roundRect, label, drawDish, drawIngredient, drawPlate } from './art.js';

export function drawHud(ctx, game, time) {
  drawTally(ctx, game);
  drawCarry(ctx, game);
  drawCombo(ctx, game, time);
  drawMessages(ctx, game, time);
  drawHint(ctx, game);
}

function drawTally(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(16, 11, 8, 0.72)';
  roundRect(ctx, 44, 726, 300, 52, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 147, 47, 0.28)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 44, 726, 300, 52, 10);
  ctx.stroke();

  label(ctx, 'TAKE', 68, 742, { size: 8.5, color: 'rgba(240, 220, 180, 0.5)', weight: '700', align: 'left' });
  label(ctx, String(game.coins), 64, 760, {
    size: 21, weight: '800', color: '#f2c979', align: 'left',
    family: 'Georgia, "Times New Roman", serif',
  });
  ctx.strokeStyle = 'rgba(240, 220, 180, 0.16)';
  ctx.beginPath();
  ctx.moveTo(176, 736);
  ctx.lineTo(176, 768);
  ctx.stroke();
  label(ctx, 'SERVED', 194, 742, { size: 8.5, color: 'rgba(240, 220, 180, 0.5)', weight: '700', align: 'left' });
  label(ctx, String(game.served), 194, 760, { size: 18, weight: '700', color: '#f4e8d0', align: 'left' });
  label(ctx, 'LOST', 252, 742, { size: 8.5, color: 'rgba(240, 220, 180, 0.5)', weight: '700', align: 'left' });
  label(ctx, String(game.wasted), 252, 760, { size: 18, weight: '700', color: game.wasted ? '#e08a72' : '#f4e8d0', align: 'left' });
  ctx.restore();
}

function drawCarry(ctx, game) {
  const chef = game.chef;
  const x = 380;
  const y = 726;
  const w = 250;
  const h = 52;
  ctx.save();
  ctx.fillStyle = 'rgba(16, 11, 8, 0.6)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  label(ctx, 'TRAY', x + 14, y + 13, { size: 8.5, color: 'rgba(240, 220, 180, 0.5)', weight: '700', align: 'left' });
  if (!chef.carry.length) {
    label(ctx, 'empty', x + w / 2, y + 32, { size: 12, color: 'rgba(240, 220, 180, 0.35)' });
  }
  chef.carry.forEach((item, index) => {
    const cx = x + 34 + index * 46;
    const cy = y + 33;
    if (item.kind === 'dish') {
      drawPlate(ctx, cx, cy, 17);
      drawDish(ctx, item.recipeId, cx, cy - 2, 16, 0, {});
    } else {
      drawIngredient(ctx, item.id, cx, cy, 15, {
        chopped: item.kind === 'chopped' || item.kind === 'cooked',
        cooked: item.kind === 'cooked',
        burnt: item.kind === 'burnt',
      });
      if (item.quality === 'perfect') {
        ctx.fillStyle = '#8fd468';
        ctx.beginPath();
        ctx.arc(cx + 13, cy - 12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  for (let i = chef.carry.length; i < 4; i += 1) {
    const cx = x + 34 + i * 46;
    ctx.strokeStyle = 'rgba(240, 220, 180, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, y + 33, 13, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCombo(ctx, game, time) {
  if (game.combo < 2) return;
  const left = Math.max(0, game.comboUntil - time);
  ctx.save();
  ctx.globalAlpha = 0.55 + Math.min(1, left / 2) * 0.45;
  ctx.fillStyle = 'rgba(201, 147, 47, 0.16)';
  roundRect(ctx, 1006, 726, 232, 52, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242, 201, 121, 0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 1006, 726, 232, 52, 10);
  ctx.stroke();
  label(ctx, `${game.combo}x STREAK`, 1122, 742, { size: 12, weight: '800', color: '#f2c979' });
  ctx.fillStyle = 'rgba(242, 201, 121, 0.2)';
  roundRect(ctx, 1020, 756, 204, 7, 4);
  ctx.fill();
  ctx.fillStyle = '#f2c979';
  roundRect(ctx, 1020, 756, Math.max(3, 204 * Math.min(1, left / 9)), 7, 4);
  ctx.fill();
  ctx.restore();
}

function drawMessages(ctx, game, time) {
  const shown = game.messages.filter((message) => message.until > time).slice(-3);
  shown.forEach((message, index) => {
    const age = Math.max(0, message.until - time);
    const alpha = Math.min(1, age / 0.5);
    const y = 676 - (shown.length - 1 - index) * 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 14px "Trebuchet MS", "Gill Sans", sans-serif';
    const width = Math.min(760, ctx.measureText(message.text).width + 40);
    const x = VIEW.width / 2 - width / 2;
    ctx.fillStyle = message.tone === 'bad' ? 'rgba(74, 24, 16, 0.9)' : message.tone === 'good' ? 'rgba(30, 48, 22, 0.9)' : 'rgba(24, 18, 14, 0.9)';
    roundRect(ctx, x, y - 15, width, 30, 15);
    ctx.fill();
    ctx.strokeStyle = message.tone === 'bad' ? 'rgba(224, 120, 90, 0.6)' : message.tone === 'good' ? 'rgba(143, 212, 104, 0.5)' : 'rgba(240, 220, 180, 0.22)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, x, y - 15, width, 30, 15);
    ctx.stroke();
    label(ctx, message.text, VIEW.width / 2, y, {
      size: 13.5, weight: '600',
      color: message.tone === 'bad' ? '#ffd5c6' : message.tone === 'good' ? '#e6f6d4' : '#f4e8d0',
    });
    ctx.restore();
  });
}

function drawHint(ctx, game) {
  const hint = currentHint(game);
  if (!hint) return;
  ctx.save();
  ctx.globalAlpha = 0.85;
  label(ctx, hint, VIEW.width / 2, 712, {
    size: 11.5, weight: '600', color: 'rgba(240, 220, 180, 0.62)',
  });
  ctx.restore();
}

export function currentHint(game) {
  const chef = game.chef;
  const carry = chef.carry;
  if (game.time < 7) return 'Gather from the bins, chop at the board, sear at the stove, plate, then serve at the pass.';
  if (!carry.length) return 'Bins sit left, the pass at the far right. Pick the nearest raw ingredient.';
  if (carry.some((item) => item.kind === 'dish')) return 'A finished plate! Carry it to the pass and serve the ticket it answers.';
  if (carry.some((item) => item.kind === 'cooked')) return 'Cooked parts go on the plating plate: press E there until the dish assembles.';
  if (carry.some((item) => item.kind === 'chopped')) return 'Chopped and ready: put it in a pan on the stove and watch the ring turn gold.';
  if (carry.some((item) => item.kind === 'raw')) return 'Take it to the cutting board and press E to chop.';
  return '';
}

export function drawTitle(ctx, game, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 7, 5, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // A plate under a warm light, the game's emblem.
  const glow = ctx.createRadialGradient(VIEW.width / 2, 330, 20, VIEW.width / 2, 330, 330);
  glow.addColorStop(0, 'rgba(255, 200, 120, 0.22)');
  glow.addColorStop(1, 'rgba(255, 200, 120, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(VIEW.width / 2, 330, 330, 0, Math.PI * 2);
  ctx.fill();

  drawPlate(ctx, VIEW.width / 2, 352, 96);
  drawDish(ctx, 'sun_broth', VIEW.width / 2, 340, 88, time, { steam: true });

  label(ctx, 'SAFFRON LINE', VIEW.width / 2, 176, {
    size: 62, weight: '800', color: '#f6d79a',
    family: 'Georgia, "Times New Roman", serif',
  });
  label(ctx, 'a night kitchen in one shift', VIEW.width / 2, 224, {
    size: 17, weight: '500', color: 'rgba(246, 224, 186, 0.6)',
  });
  label(ctx, 'Tickets are piling up on the rail. Gather, chop, sear, plate, serve —', VIEW.width / 2, 468, {
    size: 14, color: 'rgba(246, 224, 186, 0.55)',
  });
  label(ctx, 'and keep the streak alive until the last order of the night.', VIEW.width / 2, 490, {
    size: 14, color: 'rgba(246, 224, 186, 0.55)',
  });

  const pulse = 0.6 + Math.sin(time * 3) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(201, 147, 47, 0.9)';
  roundRect(ctx, VIEW.width / 2 - 116, 528, 232, 44, 22);
  ctx.fill();
  ctx.globalAlpha = 1;
  label(ctx, 'CLICK OR PRESS SPACE', VIEW.width / 2, 550, {
    size: 13, weight: '800', color: '#241a10',
  });

  // Controls, quietly below.
  const controls = [
    'WASD / arrows — move',
    'E / space — use station',
    'click — walk & use',
    'M — mute  ·  P — pause',
  ];
  controls.forEach((line, index) => {
    label(ctx, line, VIEW.width / 2, 606 + index * 20, {
      size: 11.5, color: 'rgba(246, 224, 186, 0.45)',
    });
  });
  void game;
}

export function drawPause(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 7, 5, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  label(ctx, 'PAUSED', VIEW.width / 2, VIEW.height / 2 - 20, {
    size: 40, weight: '800', color: '#f6d79a', family: 'Georgia, "Times New Roman", serif',
  });
  label(ctx, 'the line waits for you', VIEW.width / 2, VIEW.height / 2 + 24, {
    size: 14, color: 'rgba(246, 224, 186, 0.55)',
  });
  label(ctx, 'P to resume', VIEW.width / 2, VIEW.height / 2 + 56, {
    size: 12, color: 'rgba(246, 224, 186, 0.4)',
  });
  ctx.restore();
}

export function drawResults(ctx, game, grade, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 4, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  const cardW = 620;
  const cardH = 500;
  const x = VIEW.width / 2 - cardW / 2;
  const y = VIEW.height / 2 - cardH / 2;
  ctx.fillStyle = 'rgba(28, 20, 15, 0.96)';
  roundRect(ctx, x, y, cardW, cardH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 147, 47, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, cardW, cardH, 16);
  ctx.stroke();

  label(ctx, 'THE LAST ORDER', VIEW.width / 2, y + 46, {
    size: 12, weight: '700', color: 'rgba(240, 220, 180, 0.5)',
  });
  label(ctx, grade.rank, VIEW.width / 2, y + 84, {
    size: 34, weight: '800', color: '#f6d79a', family: 'Georgia, "Times New Roman", serif',
  });

  // Stars.
  for (let i = 0; i < 5; i += 1) {
    const cx = VIEW.width / 2 - 96 + i * 48;
    const cy = y + 138;
    star(ctx, cx, cy, 17, i < grade.stars ? '#f2c979' : 'rgba(240, 220, 180, 0.14)');
  }

  const rows = [
    ['Plates served', String(grade.served)],
    ['Tickets lost', String(grade.lost)],
    ['Coins taken', String(grade.coins)],
    ['Best streak', `${grade.bestCombo}x`],
  ];
  rows.forEach((row, index) => {
    const rowY = y + 202 + index * 36;
    label(ctx, row[0], x + 96, rowY, {
      size: 14, color: 'rgba(240, 220, 180, 0.6)', align: 'left',
    });
    label(ctx, row[1], x + cardW - 96, rowY, {
      size: 17, weight: '700', color: '#f4e8d0', align: 'right',
    });
    ctx.strokeStyle = 'rgba(240, 220, 180, 0.1)';
    ctx.beginPath();
    ctx.moveTo(x + 96, rowY + 17);
    ctx.lineTo(x + cardW - 96, rowY + 17);
    ctx.stroke();
  });

  // A little line of what the kitchen thought of it.
  const verdict = grade.stars >= 4
    ? 'The dining room is still talking about that broth.'
    : grade.stars === 3
      ? 'A solid shift — a few tickets slipped, but the plates landed.'
      : 'The rail won tonight. Tomorrow, chop before you wander.';
  label(ctx, verdict, VIEW.width / 2, y + 372, {
    size: 13, color: 'rgba(240, 220, 180, 0.6)',
  });

  const pulse = 0.6 + Math.sin(time * 3) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(201, 147, 47, 0.9)';
  roundRect(ctx, VIEW.width / 2 - 120, y + cardH - 66, 240, 42, 21);
  ctx.fill();
  ctx.globalAlpha = 1;
  label(ctx, 'OPEN AGAIN', VIEW.width / 2, y + cardH - 44, {
    size: 13, weight: '800', color: '#241a10',
  });
  ctx.restore();
}

function star(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Kept for the menu board and the title, so the pantry reads as ingredients.
export function ingredientLegend(ctx, x, y) {
  Object.entries(INGREDIENTS).forEach(([id, ingredient], index) => {
    drawIngredient(ctx, id, x + index * 150, y, 16);
    label(ctx, ingredient.name, x + 22 + index * 150, y, {
      size: 12, color: PALETTE.paper, align: 'left',
    });
  });
  void RECIPES;
}
