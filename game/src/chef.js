// The chef: where she stands, what she carries and the short locked actions
// (chop, plate) that give every station its little beat of feedback.

import { CHEF_SPEED, CARRY_LIMIT, FLOOR } from './config.js';

export const START_POSITION = { x: 640, y: 560 };

export function createChef() {
  return {
    x: START_POSITION.x,
    y: START_POSITION.y,
    facing: 'right',
    carrying: [],
    carry: [],
    moving: false,
    walkPhase: 0,
    action: null,
  };
}

export function resetChef(chef) {
  chef.x = START_POSITION.x;
  chef.y = START_POSITION.y;
  chef.facing = 'right';
  chef.carry.length = 0;
  chef.action = null;
  chef.moving = false;
}

export function carryCount(chef) {
  return chef.carry.length;
}

export function carryHasRoom(chef) {
  return chef.carry.length < CARRY_LIMIT;
}

export function giveChef(chef, item) {
  if (!carryHasRoom(chef)) return false;
  chef.carry.push(item);
  return true;
}

export function takeFromChef(chef, predicate) {
  const index = chef.carry.findIndex(predicate);
  if (index === -1) return null;
  return chef.carry.splice(index, 1)[0];
}

export function countCarried(chef, predicate) {
  return chef.carry.filter(predicate).length;
}

export function beginAction(chef, kind, seconds, station) {
  chef.action = { kind, until: seconds, station: station ? station.id : null };
}

export function actionBusy(chef) {
  return Boolean(chef.action);
}

// dt drives the walk cycle and the action lock; the action's `until` is an
// absolute game time so it survives a slow frame.
export function updateChef(chef, dt, time, input, target) {
  if (chef.action && time >= chef.action.until) chef.action = null;

  let vx = 0;
  let vy = 0;
  if (!chef.action && !target) {
    const axis = input.moveAxis();
    vx = axis.x;
    vy = axis.y;
  } else if (!chef.action && target) {
    const dx = target.x - chef.x;
    const dy = target.y - chef.y;
    const length = Math.hypot(dx, dy);
    if (length > 6) {
      vx = dx / length;
      vy = dy / length;
    } else if (target.onArrive) {
      const arrive = target.onArrive;
      target.onArrive = null;
      arrive();
    }
  }

  const speed = CHEF_SPEED;
  chef.x += vx * speed * dt;
  chef.y += vy * speed * dt;
  chef.moving = Math.abs(vx) + Math.abs(vy) > 0.01;
  if (chef.moving) {
    chef.walkPhase += dt;
    if (Math.abs(vx) > 0.05) chef.facing = vx < 0 ? 'left' : 'right';
  }
  chef.x = Math.max(FLOOR.x + 26, Math.min(FLOOR.x + FLOOR.w - 26, chef.x));
  chef.y = Math.max(FLOOR.y + 30, Math.min(FLOOR.y + FLOOR.h - 24, chef.y));
  return chef.moving;
}
