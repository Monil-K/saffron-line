// Keyboard and mouse handling. Keys are read as held state; presses are queued
// so a tap can never be lost between frames. The mouse reports clicks in the
// game's own 1280 by 800 coordinates, whatever the window size.

const MOVE_KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function createInput(canvas) {
  const held = new Set();
  const presses = [];
  const pointer = { x: VIEW_CENTER.x, y: VIEW_CENTER.y, click: null, holding: false };

  function toGame(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 800;
    return { x, y };
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Enter' || MOVE_KEYS[event.code]) event.preventDefault();
    if (!held.has(event.code)) presses.push(event.code);
    held.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });

  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointermove', (event) => {
    const point = toGame(event);
    pointer.x = point.x;
    pointer.y = point.y;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toGame(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.holding = true;
    pointer.click = point;
  });

  canvas.addEventListener('pointerup', () => {
    pointer.holding = false;
  });

  return {
    held,
    pointer,
    moveAxis() {
      let x = 0;
      let y = 0;
      if (held.has('ArrowLeft') || held.has('KeyA')) x -= 1;
      if (held.has('ArrowRight') || held.has('KeyD')) x += 1;
      if (held.has('ArrowUp') || held.has('KeyW')) y -= 1;
      if (held.has('ArrowDown') || held.has('KeyS')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    // Presses since the last frame, for a one-shot action key.
    takePresses() {
      const out = presses.slice();
      presses.length = 0;
      return out;
    },
    takeClick() {
      const click = pointer.click;
      pointer.click = null;
      return click;
    },
    anyKeyPressed() {
      return presses.length > 0;
    },
  };
}

const VIEW_CENTER = { x: 640, y: 400 };
