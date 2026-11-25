// The scene: the tiled wall and its order rail, the long pass counter with every
// station, the floor, the chef and the pans. Draw-only; the state comes in from
// main.js and cooking.js.

import {
  VIEW, COUNTER, FLOOR, PALETTE, RECIPES, PAN, INGREDIENTS, BURNERS,
} from './config.js';
import {
  roundRect, label, drawIngredient, drawPan, drawPlate, drawDish,
  drawPartialPlate, drawChef, drawTicket, drawSteam, drawSpark,
} from './art.js';
import { panStage, panProgress } from './cooking.js';
import { stationInReach } from './kitchen.js';

const LANTERN = [
  { x: 210, y: 300 },
  { x: 640, y: 300 },
  { x: 1070, y: 300 },
];

export function drawScene(ctx, game, time) {
  ctx.save();
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawWall(ctx, game, time);
  drawFloor(ctx, time);
  drawFloorDressing(ctx, time);
  drawCounter(ctx, game, time);
  drawStations(ctx, game, time);
  drawOrderRail(ctx, game, time);
  drawFloorTools(ctx, game, time);
  drawChef(ctx, game.chef, time);
  drawPans(ctx, game, time);
  drawParticles(ctx, game);
  drawStationPrompt(ctx, game, time);
  drawSmoke(ctx, game, time);
  ctx.restore();
}

function drawWall(ctx, game, time) {
  const wall = ctx.createLinearGradient(0, 0, 0, COUNTER.y);
  wall.addColorStop(0, '#241a16');
  wall.addColorStop(0.55, '#2c211b');
  wall.addColorStop(1, '#3a2a21');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW.width, COUNTER.y);

  // Tiles behind the counter, glazed and slightly uneven.
  const tileTop = 214;
  const tileH = 26;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 48; col += 1) {
      const x = col * 27 - (row % 2) * 13;
      const y = tileTop + row * tileH;
      const tint = 0.5 + ((col * 7 + row * 3) % 5) * 0.04;
      ctx.fillStyle = `rgba(${Math.round(58 * tint + 22)}, ${Math.round(76 * tint + 22)}, ${Math.round(72 * tint + 20)}, 1)`;
      ctx.fillRect(x + 1, y + 1, 25, tileH - 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.fillRect(x + 2, y + 2, 23, 4);
    }
  }
  ctx.fillStyle = 'rgba(10, 6, 4, 0.35)';
  ctx.fillRect(0, tileTop - 3, VIEW.width, 5);

  // Pantry shelf with jars and hanging copper.
  ctx.fillStyle = '#4a3222';
  roundRect(ctx, 34, 70, 234, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#5d3f2a';
  roundRect(ctx, 34, 160, 234, 10, 4);
  ctx.fill();
  const jars = [
    { x: 58, h: 34, color: '#d9a34a' },
    { x: 100, h: 44, color: '#b8a06a' },
    { x: 142, h: 30, color: '#7fae5c' },
    { x: 184, h: 40, color: '#c4703a' },
    { x: 226, h: 36, color: '#cbb69f' },
  ];
  jars.forEach((jar, index) => {
    ctx.fillStyle = 'rgba(240, 226, 200, 0.24)';
    roundRect(ctx, jar.x, 70 - jar.h, 28, jar.h, 5);
    ctx.fill();
    ctx.fillStyle = jar.color;
    roundRect(ctx, jar.x + 3, 70 - jar.h * 0.62, 22, jar.h * 0.6, 4);
    ctx.fill();
    ctx.fillStyle = '#2f2522';
    roundRect(ctx, jar.x + 1, 70 - jar.h - 6, 26, 7, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(jar.x + 5, 70 - jar.h + 6);
    ctx.lineTo(jar.x + 5, 64);
    ctx.stroke();
    void index;
  });

  // Copper pans hanging on the right of the shelf.
  for (let i = 0; i < 3; i += 1) {
    const x = 288 - i * 0;
    void x;
  }
  for (let i = 0; i < 2; i += 1) {
    const cx = 300 - i * 0;
    void cx;
  }

  // Hanging lamps that pool warm light on the counter.
  for (const lantern of LANTERN) {
    ctx.strokeStyle = '#191210';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lantern.x, 0);
    ctx.lineTo(lantern.x, lantern.y - 44);
    ctx.stroke();
    const shade = ctx.createLinearGradient(lantern.x - 26, 0, lantern.x + 26, 0);
    shade.addColorStop(0, '#3a2a20');
    shade.addColorStop(0.5, '#6b4a2f');
    shade.addColorStop(1, '#33241b');
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(lantern.x - 30, lantern.y - 26);
    ctx.quadraticCurveTo(lantern.x, lantern.y - 58, lantern.x + 30, lantern.y - 26);
    ctx.lineTo(lantern.x + 14, lantern.y - 18);
    ctx.lineTo(lantern.x - 14, lantern.y - 18);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(lantern.x, lantern.y - 16, 2, lantern.x, lantern.y - 16, 60);
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.85)');
    glow.addColorStop(0.35, 'rgba(255, 176, 90, 0.28)');
    glow.addColorStop(1, 'rgba(255, 160, 80, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lantern.x, lantern.y - 16, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe6b0';
    ctx.beginPath();
    ctx.ellipse(lantern.x, lantern.y - 14, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    const pool = ctx.createRadialGradient(lantern.x, COUNTER.y - 10, 10, lantern.x, COUNTER.y - 10, 150);
    pool.addColorStop(0, 'rgba(255, 190, 110, 0.12)');
    pool.addColorStop(1, 'rgba(255, 190, 110, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(lantern.x - 150, 150, 300, 180);
    void time;
  }

  // The house sign, hand-painted.
  ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
  roundRect(ctx, 40, 92, 222, 96, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 147, 47, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 47, 99, 208, 82, 6);
  ctx.stroke();
  label(ctx, 'SAFFRON LINE', 151, 122, {
    size: 25, weight: '800', color: '#f2c979', family: 'Georgia, "Times New Roman", serif',
  });
  label(ctx, 'night kitchen  ·  est. by the dock', 151, 146, {
    size: 10.5, color: 'rgba(240, 220, 180, 0.66)', weight: '500',
  });
  label(ctx, 'gather · chop · cook · plate · serve', 151, 166, {
    size: 9.5, color: 'rgba(240, 220, 180, 0.44)', weight: '500',
  });
}

function drawOrderRail(ctx, game, time) {
  // The brass rail the tickets hang from.
  const railY = 44;
  const grad = ctx.createLinearGradient(0, railY, 0, railY + 7);
  grad.addColorStop(0, '#e0b667');
  grad.addColorStop(0.5, '#a97c2c');
  grad.addColorStop(1, '#6f4d18');
  ctx.fillStyle = grad;
  roundRect(ctx, 300, railY, 940, 7, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(300, railY + 8, 940, 3);
  for (let x = 330; x < 1240; x += 120) {
    ctx.fillStyle = 'rgba(40, 28, 18, 0.8)';
    roundRect(ctx, x, railY - 6, 10, 10, 2);
    ctx.fill();
  }

  // Service clock, big and legible: the whole night at a glance.
  const seconds = Math.max(0, Math.ceil(game.timeLeft));
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  const warning = seconds <= 30;
  ctx.fillStyle = 'rgba(18, 12, 9, 0.72)';
  roundRect(ctx, 302, 60, 120, 38, 6);
  ctx.fill();
  ctx.strokeStyle = warning ? 'rgba(224, 80, 58, 0.8)' : 'rgba(201, 147, 47, 0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 302, 60, 120, 38, 6);
  ctx.stroke();
  label(ctx, 'SERVICE', 362, 72, { size: 9, color: 'rgba(240, 220, 180, 0.55)', weight: '700' });
  label(ctx, `${mm}:${ss}`, 362, 87, {
    size: 19, color: warning ? '#ff9b7a' : '#f6dfae', weight: '700',
    family: 'Georgia, "Times New Roman", serif',
  });

  const tickets = game.orders.slice(0, 5);
  const count = tickets.length;
  const railStart = 440;
  const railWidth = 796;
  const gap = count >= 5 ? 10 : 16;
  const ticketW = Math.min(176, (railWidth - (count - 1) * gap) / Math.max(1, count));
  const ticketH = 148;
  const totalW = count * ticketW + Math.max(0, count - 1) * gap;
  const startX = railStart + (railWidth - totalW) / 2;
  const y = 58;
  tickets.forEach((order, index) => {
    drawTicket(ctx, order, startX + index * (ticketW + gap), y, ticketW, ticketH, order.remaining, time);
  });

  if (count === 0) {
    label(ctx, 'No tickets up — breathe while you can.', 900, 118, {
      size: 15, color: 'rgba(240, 220, 180, 0.4)',
    });
  }
}

function drawFloor(ctx, time) {
  const floor = ctx.createLinearGradient(0, FLOOR.y, 0, VIEW.height);
  floor.addColorStop(0, '#2a201b');
  floor.addColorStop(1, '#150f0d');
  ctx.fillStyle = floor;
  ctx.fillRect(0, COUNTER.y + COUNTER.h - 6, VIEW.width, VIEW.height - COUNTER.y - COUNTER.h + 6);

  // Wide dark boards with pale seams.
  for (let y = COUNTER.y + COUNTER.h; y < VIEW.height; y += 46) {
    ctx.fillStyle = 'rgba(255, 240, 210, 0.03)';
    ctx.fillRect(0, y, VIEW.width, 2);
  }
  for (let x = -100; x < VIEW.width + 100; x += 176) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.fillRect(x, COUNTER.y + COUNTER.h, 3, VIEW.height);
  }
  // Light pools under the lamps and a cool shadow at the edges.
  for (const lantern of LANTERN) {
    const pool = ctx.createRadialGradient(lantern.x, 620, 20, lantern.x, 620, 260);
    pool.addColorStop(0, 'rgba(255, 200, 130, 0.10)');
    pool.addColorStop(1, 'rgba(255, 200, 130, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(lantern.x - 260, 430, 520, 370);
  }
  const vignette = ctx.createRadialGradient(VIEW.width / 2, 520, 300, VIEW.width / 2, 520, 820);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, COUNTER.y, VIEW.width, VIEW.height - COUNTER.y);
  void time;
}

function drawCounter(ctx, game, time) {
  // Wooden top with a bevel and a tile front.
  const top = ctx.createLinearGradient(0, COUNTER.y, 0, COUNTER.y + 42);
  top.addColorStop(0, '#8a5b39');
  top.addColorStop(0.5, '#6d4629');
  top.addColorStop(1, '#523320');
  ctx.fillStyle = top;
  ctx.fillRect(COUNTER.x, COUNTER.y, COUNTER.w, 44);

  ctx.strokeStyle = 'rgba(40, 24, 14, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i += 1) {
    const y = COUNTER.y + 4 + i * 3;
    ctx.beginPath();
    ctx.moveTo(COUNTER.x, y);
    for (let x = COUNTER.x; x < COUNTER.x + COUNTER.w; x += 40) {
      ctx.lineTo(x + 20, y + Math.sin((x + i * 30) * 0.02) * 1.4);
    }
    ctx.stroke();
  }

  ctx.fillStyle = '#3a2517';
  ctx.fillRect(COUNTER.x, COUNTER.y + 44, COUNTER.w, COUNTER.h - 44);

  const front = ctx.createLinearGradient(0, COUNTER.y + 44, 0, COUNTER.y + COUNTER.h);
  front.addColorStop(0, '#42362f');
  front.addColorStop(1, '#241c18');
  ctx.fillStyle = front;
  ctx.fillRect(COUNTER.x + 6, COUNTER.y + 44, COUNTER.w - 12, COUNTER.h - 52);

  for (let x = COUNTER.x + 6; x < COUNTER.x + COUNTER.w - 12; x += 40) {
    ctx.fillStyle = 'rgba(255, 250, 235, 0.05)';
    ctx.fillRect(x + 1, COUNTER.y + 52, 36, 62);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x + 37, COUNTER.y + 52, 3, 62);
  }
  ctx.fillStyle = 'rgba(201, 147, 47, 0.35)';
  ctx.fillRect(COUNTER.x, COUNTER.y + 44, COUNTER.w, 3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(COUNTER.x, COUNTER.y + COUNTER.h - 6, COUNTER.w, 8);
  void game;
  void time;
}

function drawStations(ctx, game, time) {
  const chest = game.kitchen;

  for (const station of chest.bins) {
    drawBin(ctx, station, time);
  }
  drawBoard(ctx, chest.board, game, time);
  drawStove(ctx, chest.stove, game, time);
  drawPlating(ctx, chest.plating, game, time);
  drawPass(ctx, chest.pass, game, time);
}

function drawBin(ctx, station, time) {
  const ingredient = INGREDIENTS[station.ingredient];
  ctx.save();
  // Crate.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  roundRect(ctx, station.x + 3, station.y + 12, station.w, station.h - 8, 6);
  ctx.fill();
  ctx.fillStyle = '#4f3623';
  roundRect(ctx, station.x, station.y + 8, station.w, station.h - 10, 6);
  ctx.fill();
  ctx.fillStyle = '#3a2617';
  roundRect(ctx, station.x + 5, station.y + 13, station.w - 10, station.h - 28, 4);
  ctx.fill();
  // Straps.
  ctx.fillStyle = '#8a6a44';
  ctx.fillRect(station.x + 8, station.y + 14, 6, station.h - 28);
  ctx.fillRect(station.x + station.w - 14, station.y + 14, 6, station.h - 28);
  // Ingredient heap.
  for (let i = 0; i < 3; i += 1) {
    drawIngredient(ctx, station.ingredient, station.x + 24 + i * 17, station.y + 34 + (i % 2) * 10, 22, {
      angle: -0.4 + i * 0.35,
    });
  }
  for (let i = 0; i < 2; i += 1) {
    drawIngredient(ctx, station.ingredient, station.x + 33 + i * 18, station.y + 54, 20, {
      angle: 0.7 - i * 0.5,
    });
  }
  // Label plate.
  ctx.fillStyle = '#eadfc6';
  roundRect(ctx, station.x + 8, station.y + station.h - 24, station.w - 16, 18, 3);
  ctx.fill();
  label(ctx, ingredient.bin, station.x + station.w / 2, station.y + station.h - 15, {
    size: 10, weight: '700', color: '#4a3320',
  });
  // A little glint from the lamps.
  ctx.fillStyle = 'rgba(255, 230, 180, 0.08)';
  roundRect(ctx, station.x + 4, station.y + 10, station.w - 8, 8, 3);
  ctx.fill();
  void time;
}

function drawBoard(ctx, station, game, time) {
  // Wooden cutting board with a knife and a few scraps.
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  roundRect(ctx, station.x + 2, station.y + 10, station.w, station.h, 8);
  ctx.fill();
  const board = ctx.createLinearGradient(station.x, station.y, station.x, station.y + station.h);
  board.addColorStop(0, '#b4844f');
  board.addColorStop(0.6, '#94683a');
  board.addColorStop(1, '#75502c');
  ctx.fillStyle = board;
  roundRect(ctx, station.x, station.y + 6, station.w, station.h - 2, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60, 36, 18, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(station.x + 8, station.y + 22 + i * 14);
    ctx.lineTo(station.x + station.w - 8, station.y + 20 + i * 14);
    ctx.stroke();
  }

  // Scraps on the board: the last thing chopped.
  if (game.lastChopped) {
    drawIngredient(ctx, game.lastChopped, station.x + 52, station.y + 44, 16, { chopped: true });
    drawIngredient(ctx, game.lastChopped, station.x + 72, station.y + 52, 14, { chopped: true });
  }
  drawIngredient(ctx, 'emberroot', station.x + 24, station.y + 46, 13, { chopped: true });
  drawIngredient(ctx, 'glasspea', station.x + 34, station.y + 58, 10, { chopped: true });

  // Knife resting across the board.
  ctx.save();
  ctx.translate(station.x + station.w - 42, station.y + 40);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#2b2622';
  roundRect(ctx, -6, 0, 12, 34, 3);
  ctx.fill();
  ctx.fillStyle = '#d9dee2';
  ctx.beginPath();
  ctx.moveTo(6, 2);
  ctx.quadraticCurveTo(30, 10, 34, 30);
  ctx.lineTo(6, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.quadraticCurveTo(26, 12, 29, 26);
  ctx.lineTo(24, 26);
  ctx.quadraticCurveTo(20, 14, 8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  label(ctx, 'CUTTING BOARD', station.x + station.w / 2, station.y + station.h + 14, {
    size: 9, color: 'rgba(240, 220, 180, 0.45)', weight: '700',
  });
  void time;
}

function drawStove(ctx, station, game, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  roundRect(ctx, station.x + 2, station.y + 10, station.w, station.h, 8);
  ctx.fill();
  const steel = ctx.createLinearGradient(0, station.y, 0, station.y + station.h);
  steel.addColorStop(0, '#5c6167');
  steel.addColorStop(0.45, '#3b4045');
  steel.addColorStop(1, '#24282b');
  ctx.fillStyle = steel;
  roundRect(ctx, station.x, station.y + 6, station.w, station.h - 2, 8);
  ctx.fill();

  for (const burner of BURNERS) {
    const pan = game.pans.find((candidate) => candidate.id === burner.id);
    // Burner ring and flame.
    ctx.fillStyle = '#1c1a19';
    ctx.beginPath();
    ctx.ellipse(burner.x, burner.y + 12, 52, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    const lit = pan && pan.item;
    if (lit) {
      const flicker = 0.75 + Math.sin(time * 16 + burner.x) * 0.25;
      const flame = ctx.createRadialGradient(burner.x, burner.y + 14, 4, burner.x, burner.y + 14, 54);
      flame.addColorStop(0, `rgba(255, 220, 150, ${0.75 * flicker})`);
      flame.addColorStop(0.4, `rgba(255, 140, 60, ${0.5 * flicker})`);
      flame.addColorStop(1, 'rgba(255, 90, 30, 0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(burner.x, burner.y + 14, 60, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Grates.
    ctx.strokeStyle = '#141312';
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(burner.x + i * 26, burner.y - 12);
      ctx.lineTo(burner.x + i * 26, burner.y + 34);
      ctx.stroke();
    }
  }

  // Knobs along the front of the stove.
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = '#1a1c1e';
    ctx.beginPath();
    ctx.arc(station.x + 40 + i * 24, station.y + station.h - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9932f';
    ctx.fillRect(station.x + 38 + i * 24, station.y + station.h - 12, 4, 5);
  }

  label(ctx, 'STOVE  ·  two burners', station.x + station.w / 2, station.y + station.h + 14, {
    size: 9, color: 'rgba(240, 220, 180, 0.45)', weight: '700',
  });
  void station;
}

function drawPlating(ctx, station, game, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  roundRect(ctx, station.x + 2, station.y + 10, station.w, station.h, 8);
  ctx.fill();
  const marble = ctx.createLinearGradient(station.x, station.y, station.x + station.w, station.y + station.h);
  marble.addColorStop(0, '#e6ddca');
  marble.addColorStop(0.5, '#cfc3ac');
  marble.addColorStop(1, '#ab9d86');
  ctx.fillStyle = marble;
  roundRect(ctx, station.x, station.y + 6, station.w, station.h - 2, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 105, 85, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(station.x + 12, station.y + 34);
  ctx.quadraticCurveTo(station.x + 60, station.y + 24, station.x + station.w - 12, station.y + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(station.x + 20, station.y + 76);
  ctx.quadraticCurveTo(station.x + 90, station.y + 62, station.x + station.w - 16, station.y + 78);
  ctx.stroke();

  // Stack of clean plates at the left.
  for (let i = 0; i < 4; i += 1) {
    drawPlate(ctx, station.x + 34, station.y + 58 - i * 3, 24, { shadow: i === 0 });
  }

  // Assembly plate, where cooked parts wait for the rest of their dish.
  const ax = station.x + station.w / 2 + 24;
  const ay = station.y + 60;
  drawPlate(ctx, ax, ay, 48);
  if (game.plating.items.length) {
    drawPartialPlate(ctx, game.plating.items.map((item) => item.id), ax, ay - 6, 54, time);
  } else if (game.plating.dish) {
    drawDish(ctx, game.plating.dish.recipeId, ax, ay - 6, 50, time, { steam: true });
  }

  label(ctx, 'PLATING', station.x + station.w / 2, station.y + station.h + 14, {
    size: 9, color: 'rgba(240, 220, 180, 0.45)', weight: '700',
  });
}

function drawPass(ctx, station, game, time) {
  const cx = station.x + station.w / 2;
  ctx.save();
  // The serving hatch, cut into the tiled wall: warm light, a lamp, plates
  // stacked ready and the night's finished dishes under the heat.
  const glow = ctx.createRadialGradient(cx, station.y - 70, 8, cx, station.y - 70, 190);
  glow.addColorStop(0, 'rgba(255, 198, 120, 0.34)');
  glow.addColorStop(1, 'rgba(255, 198, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(station.x - 130, station.y - 230, station.w + 260, 280);

  ctx.fillStyle = '#5b3b22';
  roundRect(ctx, station.x - 14, station.y - 150, station.w + 28, 158, 8);
  ctx.fill();
  ctx.fillStyle = '#33251a';
  roundRect(ctx, station.x - 2, station.y - 140, station.w + 4, 138, 5);
  ctx.fill();
  const warm = ctx.createLinearGradient(0, station.y - 140, 0, station.y - 8);
  warm.addColorStop(0, 'rgba(255, 196, 118, 0.5)');
  warm.addColorStop(1, 'rgba(255, 160, 80, 0.12)');
  ctx.fillStyle = warm;
  roundRect(ctx, station.x + 6, station.y - 134, station.w - 12, 126, 4);
  ctx.fill();

  // A heat lamp hanging over the hatch.
  ctx.strokeStyle = '#231a14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, station.y - 216);
  ctx.lineTo(cx, station.y - 184);
  ctx.stroke();
  ctx.fillStyle = '#4a3527';
  ctx.beginPath();
  ctx.moveTo(cx - 26, station.y - 182);
  ctx.quadraticCurveTo(cx, station.y - 196, cx + 26, station.y - 182);
  ctx.lineTo(cx + 12, station.y - 172);
  ctx.lineTo(cx - 12, station.y - 172);
  ctx.closePath();
  ctx.fill();
  const lamp = ctx.createRadialGradient(cx, station.y - 172, 2, cx, station.y - 172, 54);
  lamp.addColorStop(0, 'rgba(255, 226, 170, 0.9)');
  lamp.addColorStop(0.4, 'rgba(255, 180, 90, 0.3)');
  lamp.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath();
  ctx.arc(cx, station.y - 172, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9bb';
  ctx.beginPath();
  ctx.ellipse(cx, station.y - 172, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chalk lettering on the hatch frame.
  label(ctx, 'ORDER UP', cx, station.y - 126, {
    size: 10, weight: '800', color: 'rgba(255, 226, 178, 0.55)',
  });
  ctx.strokeStyle = 'rgba(201, 147, 47, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(station.x + 12, station.y - 108);
  ctx.lineTo(station.x + station.w - 12, station.y - 108);
  ctx.stroke();

  // Plates waiting under the heat lamp, one carrying a finished dish.
  drawPlate(ctx, station.x + 32, station.y + 40, 33);
  drawPlate(ctx, station.x + 84, station.y + 40, 33);
  const ready = game.readyPlates ?? [];
  ready.forEach((recipeId, index) => {
    if (index === 0) drawDish(ctx, recipeId, station.x + 84, station.y + 35, 37, time, { steam: true });
    if (index === 1) drawDish(ctx, recipeId, station.x + 32, station.y + 35, 37, time, {});
  });

  ctx.fillStyle = '#1d1512';
  roundRect(ctx, station.x + 18, station.y + 66, station.w - 36, 16, 3);
  ctx.fill();
  label(ctx, 'THE PASS', station.x + station.w / 2, station.y + 74, {
    size: 9.5, weight: '800', color: '#f0d09a',
  });
  ctx.restore();
}

// Rugs, crates and sacks: the floor of a working kitchen, there to be walked
// around rather than on. Nothing here blocks the chef.
function drawFloorDressing(ctx, time) {
  const mats = [
    { x: 452, y: 470, w: 180, h: 96 },
    { x: 640, y: 470, w: 250, h: 96 },
    { x: 900, y: 470, w: 184, h: 96 },
    { x: 1096, y: 462, w: 150, h: 104 },
  ];
  for (const mat of mats) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 15, 12, 0.55)';
    roundRect(ctx, mat.x, mat.y, mat.w, mat.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 150, 90, 0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, mat.x + 5, mat.y + 5, mat.w - 10, mat.h - 10, 8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190, 150, 90, 0.07)';
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(mat.x + 12, mat.y + (mat.h / 4) * i);
      ctx.lineTo(mat.x + mat.w - 12, mat.y + (mat.h / 4) * i);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Crate stack bottom right, with sacks leaning on it.
  ctx.save();
  ctx.translate(880, 676);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(6, 60, 86, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 2; i += 1) {
    const boxY = 20 - i * 34;
    ctx.fillStyle = i === 0 ? '#4a3221' : '#573c27';
    roundRect(ctx, -72 + i * 8, boxY, 148, 34, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(-72 + i * 8, boxY + 12, 148, 4);
    ctx.fillStyle = 'rgba(232, 206, 164, 0.18)';
    ctx.fillRect(-66 + i * 8, boxY + 4, 42, 3);
  }
  // A sack of roots.
  ctx.fillStyle = '#a3906f';
  ctx.beginPath();
  ctx.moveTo(76, 56);
  ctx.quadraticCurveTo(66, 18, 88, 12);
  ctx.quadraticCurveTo(112, 16, 116, 56);
  ctx.quadraticCurveTo(96, 66, 76, 56);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60, 46, 32, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 20);
  ctx.lineTo(110, 24);
  ctx.stroke();
  drawIngredient(ctx, 'emberroot', 96, 10, 13, { angle: 0.5 });
  drawIngredient(ctx, 'emberroot', 84, 12, 11, { angle: -0.4 });
  ctx.restore();
  void time;
}

function drawFloorTools(ctx, game, time) {
  // A chalkboard with tonight's menu, leaning on the left wall.
  ctx.save();
  ctx.translate(52, 470);
  ctx.rotate(-0.03);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  roundRect(ctx, 4, 6, 160, 210, 6);
  ctx.fill();
  ctx.fillStyle = '#5b3b22';
  roundRect(ctx, 0, 0, 160, 210, 6);
  ctx.fill();
  ctx.fillStyle = '#20282a';
  roundRect(ctx, 8, 8, 144, 194, 3);
  ctx.fill();
  label(ctx, "TONIGHT'S MENU", 80, 26, { size: 9, color: '#d9c89f', weight: '700' });
  ctx.strokeStyle = 'rgba(217, 200, 159, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, 36);
  ctx.lineTo(142, 36);
  ctx.stroke();
  const menu = Object.values(RECIPES);
  menu.forEach((recipe, index) => {
    label(ctx, recipe.name, 80, 52 + index * 26, {
      size: 10.5, color: '#e8dcbb', weight: '600',
    });
    label(ctx, recipe.items.map((id) => INGREDIENTS[id].name).join(' · '), 80, 64 + index * 26, {
      size: 7.5, color: 'rgba(232, 220, 187, 0.5)',
    });
  });
  label(ctx, 'all plates  ·  wine  ·  late', 80, 188, {
    size: 7.5, color: 'rgba(232, 220, 187, 0.4)',
  });
  ctx.restore();

  // A bin for scraps and a box of oil by the counter.
  ctx.save();
  ctx.translate(1010, 606);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 44, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b2c22';
  roundRect(ctx, -30, -20, 60, 62, 8);
  ctx.fill();
  ctx.fillStyle = '#5a4632';
  roundRect(ctx, -34, -28, 68, 16, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-22 + i * 22, -12);
    ctx.lineTo(-22 + i * 22, 40);
    ctx.stroke();
  }
  label(ctx, 'SCRAPS', 0, 14, { size: 8, color: 'rgba(235, 220, 190, 0.45)', weight: '700' });
  ctx.restore();
  void game;
  void time;
}

function drawPans(ctx, game, time) {
  for (const pan of game.pans) {
    drawPan(ctx, {
      item: pan.item,
      progress: panProgress(pan, game.time),
      burnt: pan.burnt,
    }, pan.x, pan.y - 4, time, { radius: 46 });

    if (pan.item) {
      const stage = panStage(pan, game.time);
      // A small ring that fills while the food cooks, then reads gold or red.
      const frac = Math.min(1, panProgress(pan, game.time) / PAN.burntAt);
      const color = stage === 'ready' ? '#8fd468' : stage === 'burnt' ? '#e0503a' : stage === 'over' ? '#e8a03a' : '#d8c79f';
      ctx.beginPath();
      ctx.arc(pan.x, pan.y - 4, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  void BURNERS;
}

function drawParticles(ctx, game) {
  for (const particle of game.particles) {
    const alpha = Math.max(0, particle.life / particle.max);
    if (particle.spark) {
      drawSpark(ctx, particle.x, particle.y, particle.size * (1 + alpha), particle.color, alpha);
    } else {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawSmoke(ctx, game, time) {
  if (!game.smokeUntil || game.smokeUntil < time) return;
  const alpha = Math.min(1, (game.smokeUntil - time) / 1.2);
  ctx.fillStyle = `rgba(28, 22, 20, ${0.35 * alpha})`;
  ctx.fillRect(0, 0, VIEW.width, COUNTER.y);
}

function drawStationPrompt(ctx, game, time) {
  if (game.scene !== 'playing') return;
  const station = stationInReach(game.kitchen, game.chef.x, game.chef.y);
  if (!station) return;
  const text = promptFor(game, station);
  if (!text) return;
  const x = station.x + station.w / 2;
  const y = station.y - 24;
  ctx.save();
  ctx.font = '700 12px "Trebuchet MS", "Gill Sans", sans-serif';
  const width = ctx.measureText(text).width + 40;
  ctx.globalAlpha = 0.92 + Math.sin(time * 4) * 0.06;
  ctx.fillStyle = 'rgba(20, 14, 10, 0.88)';
  roundRect(ctx, x - width / 2, y - 15, width, 28, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 147, 47, 0.6)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - width / 2, y - 15, width, 28, 14);
  ctx.stroke();
  label(ctx, 'E', x - width / 2 + 17, y, { size: 12, weight: '800', color: '#f2c979' });
  label(ctx, text, x + 9, y, { size: 12, weight: '600', color: '#f4e8d0' });
  ctx.restore();
}

function promptFor(game, station) {
  const chef = game.chef;
  if (station.type === 'bin') return `Take ${INGREDIENTS[station.ingredient].name}`;
  if (station.type === 'board') {
    if (chef.carry.some((item) => item.kind === 'raw')) return 'Chop';
    return 'Cutting board';
  }
  if (station.type === 'stove') {
    const burner = BURNERS.reduce((best, candidate) =>
      Math.abs(candidate.x - chef.x) < Math.abs(best.x - chef.x) ? candidate : best);
    const pan = game.pans.find((candidate) => candidate.id === burner.id);
    if (pan && pan.item) return panStage(pan, game.time) === 'ready' ? 'Take the golden batch' : 'Check the pan';
    return chef.carry.some((item) => item.kind === 'chopped') ? 'Sear it' : 'Stove';
  }
  if (station.type === 'plating') {
    if (game.plating.dish) return 'Pick up the plate';
    if (chef.carry.some((item) => item.kind === 'cooked')) return 'Add to the plate';
    if (game.plating.items.length) return 'Clear scraps';
    return 'Plating counter';
  }
  if (station.type === 'pass') {
    const dish = chef.carry.find((item) => item.kind === 'dish');
    if (dish) return `Serve ${RECIPES[dish.recipeId].name}`;
    return 'The pass';
  }
  return '';
}
