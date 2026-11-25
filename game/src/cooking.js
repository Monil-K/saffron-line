// Cooking rules: what each station does with what the chef carries, how a pan
// moves from raw to golden to scorched, and how cooked parts become a plate.

import { PAN, RECIPES, RECIPE_LIST, CARRY_LIMIT } from './config.js';
import {
  carryHasRoom, countCarried, giveChef, takeFromChef, beginAction,
  actionBusy, carryCount,
} from './chef.js';
import { nearestBurner } from './kitchen.js';
import { findTicketForDish, serveOrder, breakCombo } from './orders.js';

export function createPans(burners) {
  return burners.map((burner) => ({
    id: burner.id,
    x: burner.x,
    y: burner.y,
    item: null,
    since: 0,
    burnt: false,
    cleanUntil: 0,
    quality: null,
  }));
}

export function panProgress(pan, time) {
  if (!pan.item) return 0;
  return Math.max(0, time - pan.since);
}

export function panStage(pan, time) {
  if (!pan.item) return 'empty';
  if (pan.burnt) return 'burnt';
  const progress = panProgress(pan, time);
  if (progress < PAN.underdone) return 'raw';
  if (progress < PAN.readyFrom) return 'nearly';
  if (progress <= PAN.readyTo) return 'ready';
  return 'over';
}

export function updatePans(game, dt, time, audio) {
  let sizzle = 0;
  for (const pan of game.pans) {
    if (!pan.item) continue;
    const progress = panProgress(pan, time);
    sizzle += 0.5;
    if (!pan.burnt && progress > PAN.burntAt) {
      pan.burnt = true;
      pan.cleanUntil = time + PAN.clean;
      game.messages.push({
        text: 'A pan is scorching — scrape it out before it smokes the kitchen.',
        tone: 'bad',
        until: time + 3,
      });
      if (audio) audio.burn();
      game.smokeUntil = time + 3.4;
    }
    if (pan.burnt && time > pan.cleanUntil && pan.item) {
      pan.item = null;
      pan.burnt = false;
    }
  }
  if (audio) audio.setSizzle(sizzle);
}

export function useStation(game, station, time, audio) {
  if (!station) return;
  if (actionBusy(game.chef)) return;
  if (game.chef.x === undefined) return;

  if (station.type === 'bin') return takeFromBin(game, station, time, audio);
  if (station.type === 'board') return chopAtBoard(game, station, time, audio);
  if (station.type === 'stove') return useStove(game, station, time, audio);
  if (station.type === 'plating') return usePlating(game, station, time, audio);
  if (station.type === 'pass') return usePass(game, station, time, audio);
}

function takeFromBin(game, station, time, audio) {
  const chef = game.chef;
  if (!carryHasRoom(chef)) {
    say(game, 'Your tray is full — plate or cook what you are holding.', 'info', time);
    if (audio) audio.error();
    return;
  }
  giveChef(chef, { kind: 'raw', id: station.ingredient });
  chef.action = { kind: 'pick', until: time + 0.18, station: station.id };
  if (audio) audio.pick();
}

function chopAtBoard(game, station, time, audio) {
  const chef = game.chef;
  const raw = chef.carry.find((item) => item.kind === 'raw');
  if (!raw) {
    if (countCarried(chef, (item) => item.kind === 'chopped') > 0) {
      say(game, 'Those are already cut. Head for the stove.', 'info', time);
    } else {
      say(game, 'Nothing raw to chop — grab something from the bins.', 'info', time);
    }
    if (audio) audio.error();
    return;
  }
  raw.kind = 'chopped';
  beginAction(chef, 'chop', time + 0.4, station);
  if (audio) audio.chop();
  const p = station;
  for (let i = 0; i < 6; i += 1) {
    game.particles.push({
      x: p.x + p.w / 2 + (Math.random() - 0.5) * 40,
      y: p.y + 30 + (Math.random() - 0.5) * 18,
      vx: (Math.random() - 0.5) * 90,
      vy: -40 - Math.random() * 70,
      life: 0.5 + Math.random() * 0.4,
      max: 0.9,
      color: '#f0c98a',
      size: 2 + Math.random() * 2,
    });
  }
}

function useStove(game, station, time, audio) {
  const chef = game.chef;
  const burner = nearestBurner(game.kitchen, chef.x);
  const pan = game.pans.find((candidate) => candidate.id === burner.id);

  if (pan.item) {
    const stage = panStage(pan, time);
    if (stage === 'raw') {
      // Still raw: tip it back onto the tray, no harm done.
      pan.item = null;
      pan.burnt = false;
      giveChef(chef, { kind: 'chopped', id: pan.itemId, quality: 'raw' });
      beginAction(chef, 'cook', time + 0.25, station);
      say(game, 'Off the heat too soon — it is still raw. Back to the board.', 'bad', time);
      if (audio) audio.error();
      return;
    }
    if (stage === 'burnt') {
      pan.item = null;
      pan.burnt = false;
      beginAction(chef, 'cook', time + 0.3, station);
      game.wasted += 1;
      breakCombo(game);
      say(game, 'Scorched. That one goes in the bin.', 'bad', time);
      if (audio) audio.error();
      return;
    }
    const perfect = stage === 'ready';
    pan.item = null;
    pan.burnt = false;
    giveChef(chef, { kind: 'cooked', id: pan.itemId, quality: perfect ? 'perfect' : 'ok' });
    beginAction(chef, 'cook', time + 0.25, station);
    if (perfect) {
      say(game, 'Golden. Straight to the plating counter.', 'good', time);
      for (let i = 0; i < 8; i += 1) {
        game.particles.push({
          x: pan.x + (Math.random() - 0.5) * 30,
          y: pan.y - 6,
          vx: (Math.random() - 0.5) * 70,
          vy: -60 - Math.random() * 60,
          life: 0.5,
          max: 0.7,
          color: '#ffd27a',
          size: 2,
          spark: true,
        });
      }
    }
    if (audio) audio.plate();
    return;
  }

  if (!pan.item && game.time > 0) {
    const chopped = chef.carry.find((item) => item.kind === 'chopped');
    if (!chopped) {
      say(game, 'Only chopped ingredients go in the pan. The board is your friend.', 'info', time);
      if (audio) audio.error();
      return;
    }
    chef.carry.splice(chef.carry.indexOf(chopped), 1);
    pan.item = true;
    pan.itemId = chopped.id;
    pan.since = time;
    pan.burnt = false;
    beginAction(chef, 'cook', time + 0.3, station);
    if (audio) audio.pick();
  }
}

function usePlating(game, station, time, audio) {
  const chef = game.chef;
  const plating = game.plating;

  if (plating.dish) {
    if (!carryHasRoom(chef)) {
      say(game, 'Hands full — serve the plate you are carrying first.', 'info', time);
      if (audio) audio.error();
      return;
    }
    giveChef(chef, plating.dish);
    plating.dish = null;
    beginAction(chef, 'plate', time + 0.2, station);
    if (audio) audio.plate();
    say(game, `${RECIPES[chef.carry[chef.carry.length - 1].recipeId].name} plated. Take it to the pass.`, 'good', time);
    return;
  }

  const cooked = chef.carry.find((item) => item.kind === 'cooked');
  if (cooked) {
    chef.carry.splice(chef.carry.indexOf(cooked), 1);
    plating.items.push({ id: cooked.id, quality: cooked.quality });
    const match = matchRecipe(plating.items);
    if (match) {
      const allPerfect = plating.items.every((item) => item.quality === 'perfect');
      plating.dish = {
        kind: 'dish',
        recipeId: match.id,
        quality: allPerfect ? 'perfect' : 'ok',
      };
      plating.items = [];
      if (audio) audio.plate();
      say(game, `${match.name} assembled. One more press picks up the plate.`, 'good', time);
    } else {
      if (audio) audio.pick();
      const stillPossible = plating.items.length < 3 && RECIPE_LIST.some((recipe) =>
        plating.items.every((held) => recipe.items.includes(held.id)));
      if (!stillPossible) {
        plating.items = [];
        game.wasted += 1;
        say(game, 'Those parts make no dish on the menu. Scrapped.', 'bad', time);
        if (audio) audio.error();
      } else {
        say(game, 'Part plated — bring the rest of the components.', 'info', time);
      }
    }
    beginAction(chef, 'plate', time + 0.3, station);
    return;
  }

  if (plating.items.length) {
    plating.items = [];
    say(game, 'Scraps cleared off the plate.', 'info', time);
    if (audio) audio.pick();
    return;
  }

  say(game, 'Cook something first — the plating counter takes cooked components.', 'info', time);
  if (audio) audio.error();
}

function matchRecipe(items) {
  if (!items.length) return null;
  const wanted = items.map((item) => item.id).sort().join(',');
  return RECIPE_LIST.find((recipe) => recipe.items.slice().sort().join(',') === wanted) ?? null;
}

function usePass(game, station, time, audio) {
  const chef = game.chef;
  const dish = chef.carry.find((item) => item.kind === 'dish');
  if (!dish) {
    if (chef.carry.some((item) => item.kind !== 'dish')) {
      say(game, 'Plate it at the plating counter before it goes over the pass.', 'info', time);
    } else {
      say(game, 'Nothing to serve. The rail is filling up.', 'info', time);
    }
    if (audio) audio.error();
    return;
  }
  const order = findTicketForDish(game, dish.recipeId);
  if (!order) {
    chef.carry.splice(chef.carry.indexOf(dish), 1);
    game.wasted += 1;
    breakCombo(game);
    beginAction(chef, 'serve', time + 0.35, station);
    say(game, `No ticket calls for ${RECIPES[dish.recipeId].name}. That plate is wasted.`, 'bad', time);
    if (audio) audio.error();
    return;
  }
  chef.carry.splice(chef.carry.indexOf(dish), 1);
  serveOrder(game, order, dish, time, audio);
  beginAction(chef, 'serve', time + 0.35, station);
  for (let i = 0; i < 12; i += 1) {
    game.particles.push({
      x: station.x + station.w / 2 + (Math.random() - 0.5) * 50,
      y: station.y + 30,
      vx: (Math.random() - 0.5) * 120,
      vy: -70 - Math.random() * 90,
      life: 0.7,
      max: 0.9,
      color: '#ffe1a0',
      size: 2 + Math.random() * 2,
      spark: true,
    });
  }
  void CARRY_LIMIT;
}

function say(game, text, tone, time) {
  game.messages.push({ text, tone, until: time + 2.8 });
}
