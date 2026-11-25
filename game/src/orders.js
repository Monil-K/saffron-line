// The order rail: which tickets are up, how long each diner will wait, what a
// served dish pays and how the night's pressure ramps from a quiet opening to a
// full rush. Also the tally of coins, tips and the serve streak.

import { RECIPES, RECIPE_LIST, SERVICE, NIGHT_SECONDS } from './config.js';

let nextOrderNumber = 1;

export function resetOrders(game) {
  game.orders.length = 0;
  game.spawnTimer = SERVICE.firstOrderDelay;
  game.coins = 0;
  game.tips = 0;
  game.served = 0;
  game.wasted = 0;
  game.combo = 0;
  game.comboUntil = 0;
  game.bestCombo = 0;
  nextOrderNumber = 1;
}

export function createOrder(recipeId, nightProgress, patienceScale = 1) {
  const recipe = RECIPES[recipeId];
  const patience = (SERVICE.patienceFrom + (SERVICE.patienceTo - SERVICE.patienceFrom) * nightProgress) * patienceScale;
  return {
    id: nextOrderNumber,
    number: nextOrderNumber++,
    recipeId,
    patience,
    remaining: patience,
    value: recipe.value,
    createdAt: 0,
    seeded: true,
  };
}

// Orders arrive with a little randomness but lean on the clock: quieter and
// simpler at the top of the night, three-part dishes and shorter fuses later.
export function updateOrders(game, dt, time, audio) {
  const progress = Math.min(1, game.time / NIGHT_SECONDS);
  for (const order of game.orders) {
    if (order.createdAt === 0) order.createdAt = time;
    order.remaining -= dt;
  }
  const expired = game.orders.filter((order) => order.remaining <= 0);
  if (expired.length) {
    for (const order of expired) {
      const index = game.orders.indexOf(order);
      if (index >= 0) game.orders.splice(index, 1);
      game.wasted += 1;
      game.combo = 0;
      game.messages.push({
        text: `Ticket ${String(order.number).padStart(2, '0')} walked out — ${RECIPES[order.recipeId].name} lost.`,
        tone: 'bad',
        until: time + 3,
      });
      if (audio) audio.error();
    }
  }

  if (game.time <= 0) return;
  game.spawnTimer -= dt;
  if (game.spawnTimer > 0) return;
  if (game.orders.length >= SERVICE.maxTickets) {
    game.spawnTimer = 1.2;
    return;
  }
  const recipe = pickRecipe(progress, game.orders);
  const order = createOrder(recipe.id, progress, 0.94 + Math.random() * 0.14);
  game.orders.push(order);
  if (audio) audio.order();
  const gap = SERVICE.spawnFrom + (SERVICE.spawnTo - SERVICE.spawnFrom) * progress;
  game.spawnTimer = gap * (0.78 + Math.random() * 0.5);
  if (game.orders.length >= 4 && progress > 0.4) game.spawnTimer *= 0.82;
}

function pickRecipe(progress, activeOrders) {
  const active = new Set(activeOrders.map((order) => order.recipeId));
  const pool = progress < 0.25
    ? RECIPE_LIST.filter((recipe) => recipe.items.length === 2)
    : RECIPE_LIST;
  const fresh = pool.filter((recipe) => !active.has(recipe.id));
  const from = fresh.length ? fresh : pool;
  // Later in the night, three-part dishes show up more often.
  const weighted = [];
  for (const recipe of from) {
    const weight = recipe.items.length === 3 ? 1 + Math.round(progress * 3) : 3;
    for (let i = 0; i < weight; i += 1) weighted.push(recipe);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// Does a plated dish answer a live ticket? Exact ingredients, any order.
export function findTicketForDish(game, recipeId) {
  let best = null;
  for (const order of game.orders) {
    if (order.recipeId === recipeId && (!best || order.remaining < best.remaining)) best = order;
  }
  return best;
}

export function serveOrder(game, order, dish, time, audio) {
  const index = game.orders.indexOf(order);
  if (index >= 0) game.orders.splice(index, 1);
  const patienceLeft = Math.max(0, order.remaining) / order.patience;
  const speedTip = Math.round(order.value * 0.55 * patienceLeft);
  const comboBonus = game.combo > 0 ? Math.round(speedTip * 0.2 * Math.min(game.combo, SERVICE.comboMax)) : 0;
  const perfect = dish.quality === 'perfect';
  const qualityTip = perfect ? Math.round(order.value * 0.25) : 0;
  const earned = order.value + speedTip + comboBonus + qualityTip;

  game.coins += earned;
  game.tips += speedTip + qualityTip;
  game.served += 1;
  game.combo += 1;
  game.comboUntil = time + SERVICE.comboWindow;
  game.bestCombo = Math.max(game.bestCombo, game.combo);

  const judged = patienceLeft > 0.6 ? 'Plated quickly' : 'Just in time';
  const parts = [judged];
  if (perfect) parts.push('perfect cook');
  if (game.combo > 1) parts.push(`${game.combo}x streak`);
  game.messages.push({
    text: `${RECIPES[order.recipeId].name} served — +${earned}  (${parts.join(', ')})`,
    tone: 'good',
    until: time + 3,
  });
  if (audio) audio.serve();
  return earned;
}

export function breakCombo(game) {
  game.combo = 0;
}

export function updateCombo(game, time) {
  if (game.combo > 0 && time > game.comboUntil) game.combo = 0;
}

export function gradeNight(game) {
  const served = game.served;
  const lost = game.wasted;
  const coins = game.coins;
  let stars = 1;
  if (coins >= 110) stars = 2;
  if (coins >= 190) stars = 3;
  if (coins >= 280) stars = 4;
  if (coins >= 370) stars = 5;
  if (lost > served * 0.5) stars = Math.max(1, stars - 1);
  let rank = 'Line cook';
  if (stars >= 5) rank = 'Head chef of the night';
  else if (stars === 4) rank = 'Sous chef';
  else if (stars === 3) rank = 'Station cook';
  else if (stars === 2) rank = 'Prep hand';
  return { stars, rank, served, lost, coins, bestCombo: game.bestCombo };
}
