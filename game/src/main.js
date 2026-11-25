// Saffron Line: a night kitchen in one shift. This file owns the clock, the
// scenes (title, service, pause, the last order), the input wiring and the four
// screenshot states. The rules live in cooking.js, the tickets in orders.js.

import { VIEW, NIGHT_SECONDS, BURNERS } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createKitchen, stationInReach, stationAt } from './kitchen.js';
import { createChef, resetChef, updateChef, beginAction } from './chef.js';
import { createPans, updatePans, useStation } from './cooking.js';
import { resetOrders, createOrder, updateOrders, updateCombo, gradeNight } from './orders.js';
import { drawScene } from './render.js';
import { drawHud, drawTitle, drawPause, drawResults } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const kitchen = createKitchen();

function createGame() {
  const game = {
    scene: 'title',
    paused: false,
    time: 0,
    timeLeft: NIGHT_SECONDS,
    clock: 0,
    orders: [],
    spawnTimer: 0,
    coins: 0,
    tips: 0,
    served: 0,
    wasted: 0,
    combo: 0,
    comboUntil: 0,
    bestCombo: 0,
    messages: [],
    particles: [],
    pans: createPans(BURNERS),
    plating: { items: [], dish: null },
    readyPlates: [],
    lastChopped: null,
    smokeUntil: 0,
    hold: false,
    walkTarget: null,
    cheat: null,
    kitchen,
    chef: createChef(),
    camera: { zoom: 1, x: VIEW.width / 2, y: VIEW.height / 2 },
    grade: null,
    shot: null,
  };
  return game;
}

const game = createGame();

function startService() {
  game.scene = 'playing';
  game.paused = false;
  game.time = 0;
  game.timeLeft = NIGHT_SECONDS;
  game.messages.length = 0;
  game.particles.length = 0;
  game.plating = { items: [], dish: null };
  game.readyPlates = [];
  game.lastChopped = null;
  game.smokeUntil = 0;
  game.grade = null;
  game.walkTarget = null;
  game.hold = false;
  game.pans = createPans(BURNERS);
  resetOrders(game);
  resetChef(game.chef);
  audio.unlock();
  for (let i = 0; i < 3; i += 1) {
    const order = createOrder(i === 2 ? 'sun_broth' : i === 1 ? 'glass_dumplings' : 'ember_noodles', 0);
    order.remaining = order.patience;
    game.orders.push(order);
  }
  game.messages.push({
    text: 'Service is open. Three tickets on the rail.',
    tone: 'info',
    until: 3.5,
  });
}

function interactWith(station) {
  const now = game.time;
  useStation(game, station, now, audio);
  if (station.type === 'board' && game.chef.carry.some((item) => item.kind === 'chopped')) {
    const chopped = game.chef.carry.find((item) => item.kind === 'chopped');
    game.lastChopped = chopped.id;
  }
}

function handlePress(code) {
  if (code === 'KeyM') {
    audio.setMuted(!audio.isMuted());
    return;
  }
  if (game.scene === 'title') {
    startService();
    return;
  }
  if (game.scene === 'results') {
    startService();
    return;
  }
  if (code === 'KeyP' || code === 'Escape') {
    game.paused = !game.paused;
    return;
  }
  if (game.paused) return;
  if (game.scene !== 'playing') return;
  if (code === 'Space' || code === 'Enter' || code === 'KeyE') {
    const station = stationInReach(kitchen, game.chef.x, game.chef.y);
    if (station) interactWith(station);
  }
}

function handleClick(point) {
  if (game.scene === 'title' || game.scene === 'results') {
    startService();
    return;
  }
  if (game.paused) {
    game.paused = false;
    return;
  }
  const station = stationAt(kitchen, point.x, point.y, 16) ??
    (point.y < kitchen.counter.y + kitchen.counter.h + 60 ? nearestStationByX(point.x) : null);
  if (station) {
    const target = { x: station.usePoint.x, y: station.usePoint.y };
    game.walkTarget = {
      ...target,
      onArrive: () => {
        interactWith(station);
        game.walkTarget = null;
      },
    };
    return;
  }
  game.walkTarget = { x: point.x, y: Math.max(kitchen.floor.y + 30, point.y), onArrive: null };
}

function nearestStationByX(x) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of kitchen.stations) {
    const d = Math.abs(station.x + station.w / 2 - x);
    if (d < bestDistance) {
      best = station;
      bestDistance = d;
    }
  }
  return bestDistance < 160 ? best : null;
}

function update(dt) {
  game.clock += dt;
  if (game.scene === 'playing' && !game.paused && !game.hold) {
    game.time += dt;
    game.timeLeft = Math.max(0, NIGHT_SECONDS - game.time);
    updateOrders(game, dt, game.time, audio);
    updatePans(game, dt, game.time, audio);
    updateCombo(game, game.time);
    updateChef(game.chef, dt, game.time, input, game.walkTarget);
    if (game.walkTarget && game.walkTarget.onArrive === null) {
      const dx = game.walkTarget.x - game.chef.x;
      const dy = game.walkTarget.y - game.chef.y;
      if (Math.hypot(dx, dy) < 8) game.walkTarget = null;
    }
    if (game.timeLeft <= 0) {
      game.scene = 'results';
      game.grade = gradeNight(game);
      game.chef.action = null;
    }
  }

  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
  game.messages = game.messages.filter((message) => message.until > game.time);
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  const { zoom, x, y } = game.camera;
  if (zoom !== 1) {
    ctx.translate(VIEW.width / 2, VIEW.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-x, -y);
  }
  drawScene(ctx, game, game.clock);
  ctx.restore();

  if (game.scene === 'playing' || game.scene === 'results') {
    drawHud(ctx, game, game.clock);
  }
  if (game.scene === 'title') drawTitle(ctx, game, game.clock);
  if (game.paused) drawPause(ctx);
  if (game.scene === 'results') drawResults(ctx, game, game.grade, game.clock);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const presses = input.takePresses();
  const click = input.takeClick();
  if (presses.length) audio.unlock();
  if (input.moveAxis().x !== 0 || input.moveAxis().y !== 0) game.walkTarget = null;
  if (input.pointer.holding && game.scene === 'playing' && !game.paused) {
    // Dragging steers the chef like a held mouse does in the dining room.
  }
  if (click) handleClick(click);
  for (const code of presses) handlePress(code);

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Screenshot states: seeded from real game state, drawn by the game itself.
// ?shot=1..4 is how the maker took the entry's four screenshots.

const shotParam = new URLSearchParams(window.location.search).get('shot');
if (shotParam) seedShot(Number(shotParam));

function seedShot(index) {
  startService();
  game.hold = true;
  game.shot = index;
  game.time = 96;
  game.timeLeft = NIGHT_SECONDS - game.time;
  game.orders.length = 0;
  const order = (recipeId, remaining, patience = 52) => {
    const created = createOrder(recipeId, 0.5);
    created.seeded = true;
    created.patience = patience;
    created.remaining = remaining;
    game.orders.push(created);
  };
  const chef = game.chef;

  if (index === 1) {
    order('glass_dumplings', 31, 52);
    order('sun_broth', 26, 50);
    order('ember_noodles', 44, 54);
    order('cloud_skewers', 18, 47);
    game.pans[0].item = true;
    game.pans[0].itemId = 'glasspea';
    game.pans[0].since = game.time - 3.2;
    game.pans[1].item = true;
    game.pans[1].itemId = 'cloudcap';
    game.pans[1].since = game.time - 1.4;
    game.plating.items = [{ id: 'glasspea', quality: 'perfect' }];
    game.plating.dish = null;
    game.readyPlates = ['ember_noodles', 'cloud_skewers'];
    chef.x = 946;
    chef.y = 522;
    chef.facing = 'left';
    chef.carry = [
      { kind: 'cooked', id: 'cloudcap', quality: 'perfect' },
      { kind: 'chopped', id: 'sunpetal' },
    ];
    chef.action = { kind: 'plate', until: game.time + 30, station: 'plating' };
    game.coins = 132;
    game.served = 9;
    game.wasted = 2;
    game.combo = 2;
    game.comboUntil = game.time + 7;
    game.messages.push({ text: 'Part plated — bring the rest of the components.', tone: 'info', until: game.time + 30 });
  } else if (index === 2) {
    order('glass_dumplings', 31, 52);
    order('sun_broth', 26, 50);
    order('ember_noodles', 44, 54);
    order('cloud_skewers', 18, 47);
    game.pans[0].item = true;
    game.pans[0].itemId = 'emberroot';
    game.pans[0].since = game.time - 3.6;
    game.pans[1].item = true;
    game.pans[1].itemId = 'sunpetal';
    game.pans[1].since = game.time - 1.1;
    game.plating.items = [
      { id: 'emberroot', quality: 'perfect' },
      { id: 'glasspea', quality: 'ok' },
    ];
    game.readyPlates = ['cloud_skewers', 'sun_broth'];
    chef.x = 520;
    chef.y = 512;
    chef.facing = 'right';
    chef.carry = [
      { kind: 'chopped', id: 'glasspea' },
      { kind: 'raw', id: 'cloudcap' },
      { kind: 'chopped', id: 'emberroot' },
    ];
    chef.action = { kind: 'chop', until: game.time + 30, station: 'board' };
    game.lastChopped = 'glasspea';
    game.coins = 84;
    game.served = 6;
    game.wasted = 1;
    game.combo = 3;
    game.comboUntil = game.time + 6;
    game.time = 118;
    game.timeLeft = NIGHT_SECONDS - game.time;
    game.messages.push({ text: 'Glasspea Dumplings served — +23  (plated quickly, 3x streak)', tone: 'good', until: game.time + 30 });
  } else if (index === 3) {
    order('cloud_skewers', 21, 50);
    order('ember_noodles', 27, 52);
    order('sun_broth', 15, 46);
    order('glass_dumplings', 34, 54);
    game.readyPlates = ['ember_noodles', 'sun_broth'];
    game.pans[0].item = true;
    game.pans[0].itemId = 'sunpetal';
    game.pans[0].since = game.time - 3.9;
    game.pans[1].item = true;
    game.pans[1].itemId = 'cloudcap';
    game.pans[1].since = game.time - 5.6;
    chef.x = 1124;
    chef.y = 500;
    chef.facing = 'left';
    chef.carry = [{ kind: 'dish', recipeId: 'cloud_skewers', quality: 'perfect' }];
    chef.action = { kind: 'serve', until: game.time + 30, station: 'pass' };
    game.coins = 196;
    game.served = 14;
    game.wasted = 2;
    game.combo = 4;
    game.comboUntil = game.time + 7;
    game.time = 146;
    game.timeLeft = NIGHT_SECONDS - game.time;
    game.messages.push({ text: 'Cloudcap Skewers served — +31  (plated quickly, perfect cook, 4x streak)', tone: 'good', until: game.time + 30 });
  } else {
    order('sun_broth', 9, 46);
    order('ember_noodles', 16, 52);
    order('glass_dumplings', 6, 44);
    order('cloud_skewers', 23, 50);
    order('sun_broth', 19, 48);
    game.pans[0].item = true;
    game.pans[0].itemId = 'emberroot';
    game.pans[0].since = game.time - 6.9;
    game.pans[0].burnt = true;
    game.pans[0].cleanUntil = game.time + 20;
    game.pans[1].item = true;
    game.pans[1].itemId = 'glasspea';
    game.pans[1].since = game.time - 3.1;
    game.plating.items = [{ id: 'cloudcap', quality: 'ok' }];
    chef.x = 760;
    chef.y = 576;
    chef.facing = 'right';
    chef.carry = [
      { kind: 'cooked', id: 'glasspea', quality: 'perfect' },
      { kind: 'chopped', id: 'sunpetal' },
    ];
    game.smokeUntil = game.time + 20;
    game.coins = 214;
    game.served = 16;
    game.wasted = 4;
    game.bestCombo = 5;
    game.readyPlates = ['ember_noodles'];
    game.time = 158;
    game.timeLeft = NIGHT_SECONDS - game.time;
    game.messages.push({ text: 'A pan is scorching — scrape it out before it smokes the kitchen.', tone: 'bad', until: game.time + 30 });
    game.messages.push({ text: 'Ticket 07 walked out — Sunpetal Broth lost.', tone: 'bad', until: game.time + 30 });
  }
  void beginAction;
}

requestAnimationFrame(frame);
