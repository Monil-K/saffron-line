// The room itself: the pass counter, the pantry bins, the board, the stove and
// the pass. Holds the floor plan and answers which station the chef is standing
// in front of, so the rest of the game never does geometry.

import { STATIONS, COUNTER, FLOOR, BURNERS, USE_RANGE } from './config.js';

export function createKitchen() {
  return {
    stations: STATIONS,
    counter: COUNTER,
    floor: FLOOR,
    burners: BURNERS,
    bins: STATIONS.filter((station) => station.type === 'bin'),
    board: STATIONS.find((station) => station.type === 'board'),
    stove: STATIONS.find((station) => station.type === 'stove'),
    plating: STATIONS.find((station) => station.type === 'plating'),
    pass: STATIONS.find((station) => station.type === 'pass'),
  };
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// The station within reach of the chef, nearest first.
export function stationInReach(kitchen, x, y) {
  let best = null;
  let bestDistance = USE_RANGE;
  for (const station of kitchen.stations) {
    const d = distance(x, y, station.usePoint.x, station.usePoint.y);
    if (d < bestDistance) {
      best = station;
      bestDistance = d;
    }
  }
  return best;
}

export function stationAt(kitchen, x, y, pad = 0) {
  for (const station of kitchen.stations) {
    if (
      x >= station.x - pad && x <= station.x + station.w + pad &&
      y >= station.y - pad && y <= station.y + station.h + pad
    ) {
      return station;
    }
  }
  return null;
}

// The burner the chef is closest to: the stove holds two pans.
export function nearestBurner(kitchen, x) {
  let best = kitchen.burners[0];
  for (const burner of kitchen.burners) {
    if (Math.abs(burner.x - x) < Math.abs(best.x - x)) best = burner;
  }
  return best;
}

export function walkableTarget(kitchen, x, y) {
  const margin = 30;
  const clampedX = Math.max(kitchen.floor.x + margin, Math.min(kitchen.floor.x + kitchen.floor.w - margin, x));
  // Stay on the open floor: never inside the counter block.
  const minY = kitchen.floor.y + 26;
  const clampedY = Math.max(minY, Math.min(kitchen.floor.y + kitchen.floor.h - margin, y));
  return { x: clampedX, y: clampedY };
}
