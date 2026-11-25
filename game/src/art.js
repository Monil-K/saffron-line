// All of the kitchen's drawing: the chef, the raw and cooked ingredients, the
// pans, the plated dishes, the steam and sparks. Everything here is drawn with
// canvas paths, so the game carries no image files and renders the same bytes
// wherever it runs.

import { INGREDIENTS, RECIPES, PALETTE, PAN } from './config.js';

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function label(ctx, text, x, y, options = {}) {
  const {
    size = 16, weight = '600', color = PALETTE.ink, align = 'center',
    family = '"Trebuchet MS", "Gill Sans", sans-serif', alpha = 1,
  } = options;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function seeded(index) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

// A soft steam column: three wobbling ribbons that fade as they rise.
export function drawSteam(ctx, x, y, time, scale = 1, strength = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i += 1) {
    const phase = time * 1.4 + i * 2.1;
    const rise = ((time * 34 + i * 22) % 62) * scale;
    const drift = Math.sin(phase) * 9 * scale;
    const alpha = (0.15 - rise / (62 * scale) * 0.12) * strength;
    ctx.strokeStyle = `rgba(255, 244, 226, ${Math.max(0, alpha)})`;
    ctx.lineWidth = 7 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + drift + i * 8 * scale, y - rise);
    ctx.quadraticCurveTo(
      x + drift + 6 * scale + Math.sin(phase + 1) * 8,
      y - rise - 14 * scale,
      x + drift + Math.cos(phase) * 6,
      y - rise - 26 * scale,
    );
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSpark(ctx, x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Ingredients

export function drawIngredient(ctx, id, x, y, size, options = {}) {
  const ingredient = INGREDIENTS[id];
  if (!ingredient) return;
  const { chopped = false, cooked = false, burnt = false, alpha = 1, angle = 0 } = options;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (burnt) {
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = '#2c211c';
  }
  const shade = burnt ? '#241b17' : cooked ? ingredient.shade : ingredient.hue;
  const light = burnt ? '#3b2c24' : cooked ? ingredient.light : ingredient.blush;
  const dark = burnt ? '#1a1310' : ingredient.shade;
  const s = size;

  if (chopped) {
    // A little heap of cut pieces, scattered but reading as one pile.
    for (let i = 0; i < 7; i += 1) {
      const a = seeded(i + s) * Math.PI * 2;
      const r = seeded(i * 3 + 7) * s * 0.5;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.55 + s * 0.1;
      ctx.fillStyle = i % 3 === 0 ? light : i % 3 === 1 ? shade : dark;
      ctx.beginPath();
      ctx.ellipse(px, py, s * 0.24, s * 0.16, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20, 12, 8, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.18, s * 0.62, s * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (id === 'emberroot') {
    // A long tapered root with a leafy crown and hot little scars.
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.62);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.1, s * 0.16, s * 0.68);
    ctx.quadraticCurveTo(-s * 0.28, s * 0.2, -s * 0.34, -s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(-s * 0.02, -s * 0.5);
    ctx.quadraticCurveTo(s * 0.26, -s * 0.02, -s * 0.02, s * 0.42);
    ctx.quadraticCurveTo(-s * 0.16, 0, -s * 0.2, -s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cooked ? '#7fae5c' : '#5d9b52';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * s * 0.18, -s * 0.72, s * 0.09, s * 0.26, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(90, 30, 10, 0.5)';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc((seeded(i) - 0.5) * s * 0.5, (seeded(i + 9) - 0.5) * s * 0.8, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'glasspea') {
    // A translucent pod holding three bright peas.
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, -s * 0.1);
    ctx.quadraticCurveTo(0, -s * 0.55, s * 0.6, -s * 0.02);
    ctx.quadraticCurveTo(s * 0.1, s * 0.5, -s * 0.62, -s * 0.1);
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.08);
    ctx.quadraticCurveTo(0, -s * 0.4, s * 0.46, -s * 0.04);
    ctx.quadraticCurveTo(0, s * 0.3, -s * 0.5, -s * 0.08);
    ctx.fill();
    ctx.fillStyle = cooked ? '#e9f7c4' : '#d8efae';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.28, -s * 0.06 + Math.abs(i) * s * 0.05, s * 0.17, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 240, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.16, -s * 0.22, s * 0.2, s * 0.07, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'sunpetal') {
    // A flower whose petals curl, brighter once it hits the pan.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? shade : light;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.42, s * 0.19, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = cooked ? '#ffe9a3' : '#8a5f16';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      ctx.fillStyle = 'rgba(120, 80, 20, 0.5)';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.07, Math.sin(a) * s * 0.07, s * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cloudcap') {
    // A pale mushroom, cap domed, stem short, gills faintly visible.
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.16, s * 0.22, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, s * 0.04);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.62, 0, -s * 0.64);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.62, s * 0.62, s * 0.04);
    ctx.quadraticCurveTo(0, s * 0.3, -s * 0.62, s * 0.04);
    ctx.fill();
    ctx.fillStyle = cooked ? '#f3e6cf' : '#e6d6c0';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.26);
    ctx.quadraticCurveTo(0, -s * 0.5, s * 0.36, -s * 0.3);
    ctx.quadraticCurveTo(0, -s * 0.1, -s * 0.4, -s * 0.26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 70, 55, 0.5)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.16, -s * 0.12, s * 0.06, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pans

export function drawPan(ctx, pan, x, y, time, options = {}) {
  const radius = options.radius ?? 44;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.5, radius * 1.02, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  // Handle toward the back.
  ctx.fillStyle = '#2b2522';
  roundRect(ctx, -radius * 0.24, radius * 0.1, radius * 0.48, radius * 0.9, 6);
  ctx.fill();
  // Rim and basin.
  const basin = ctx.createRadialGradient(0, -4, radius * 0.2, 0, 0, radius);
  basin.addColorStop(0, '#4a4038');
  basin.addColorStop(0.7, '#241e1b');
  basin.addColorStop(1, '#5b4a3a');
  ctx.fillStyle = basin;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7d6a52';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (pan.item) {
    const progress = Math.min(1.2, pan.progress);
    const hot = progress > PAN.readyFrom / PAN.burntAt;
    ctx.save();
    ctx.translate(0, 2);
    const wiggle = hot ? Math.sin(time * 15) * 1.6 : 0;
    drawIngredient(ctx, pan.item, wiggle, 0, radius * 1.24, {
      chopped: true,
      cooked: progress > 0.12,
      burnt: pan.burnt,
    });
    // Sizzle specks around the food while the pan is hot.
    if (hot) {
      for (let i = 0; i < 5; i += 1) {
        const a = time * 3 + i * 1.3;
        ctx.fillStyle = 'rgba(255, 214, 140, ' + (0.35 + Math.sin(a * 4) * 0.2) + ')';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * radius * 0.5, Math.sin(a * 1.4) * radius * 0.25, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    if (hot) drawSteam(ctx, 0, -radius * 0.18, time, 0.55, pan.burnt ? 1.4 : 0.8);
    if (pan.burnt) {
      ctx.fillStyle = 'rgba(40, 30, 25, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.75, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Plates and dishes

export function drawPlate(ctx, x, y, radius, options = {}) {
  const { fill = true, shadow = true } = options;
  ctx.save();
  ctx.translate(x, y);
  if (shadow) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(2, radius * 0.3, radius * 1.02, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const glaze = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius);
  glaze.addColorStop(0, '#fffaf0');
  glaze.addColorStop(0.72, '#ece0cb');
  glaze.addColorStop(1, '#cbbba0');
  ctx.fillStyle = fill ? glaze : 'rgba(240, 230, 210, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.84, radius * 0.52, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// A finished dish, drawn per recipe so each plate has its own look.
export function drawDish(ctx, recipeId, x, y, radius, time = 0, options = {}) {
  const recipe = RECIPES[recipeId];
  ctx.save();
  ctx.translate(x, y);
  const s = radius;
  if (recipeId === 'ember_noodles') {
    // A nest of noodles with charred root slices and bright peas.
    ctx.strokeStyle = '#d98a3b';
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * (0.3 + i * 0.09), s * (0.18 + i * 0.05), 0.4 + i * 0.3, 0, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.strokeStyle = '#f6b766';
    ctx.lineWidth = s * 0.05;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.02, s * (0.42 + i * 0.08), s * (0.22 + i * 0.04), -0.5 + i * 0.4, 0.4, Math.PI * 1.4);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i += 1) {
      const a = -1.1 + i * 0.9;
      ctx.save();
      ctx.translate(Math.cos(a) * s * 0.34, Math.sin(a) * s * 0.2 - s * 0.05);
      ctx.rotate(a);
      drawIngredient(ctx, 'emberroot', 0, 0, s * 0.5, { chopped: true, cooked: true });
      ctx.restore();
    }
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = '#a9d873';
      ctx.beginPath();
      ctx.arc(-s * 0.3 + i * s * 0.2, s * 0.12 - (i % 2) * s * 0.1, s * 0.075, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#5c8f3c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.32, -s * 0.44, s * 0.4, -s * 0.18);
    ctx.stroke();
  } else if (recipeId === 'glass_dumplings') {
    for (let i = 0; i < 3; i += 1) {
      const dx = (i - 1) * s * 0.34;
      const dy = (i % 2 === 0 ? -1 : 1) * s * 0.1 - s * 0.04;
      const skin = ctx.createLinearGradient(dx - s * 0.2, dy - s * 0.2, dx + s * 0.2, dy + s * 0.2);
      skin.addColorStop(0, '#dff1bf');
      skin.addColorStop(1, '#a9cf87');
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(dx - s * 0.22, dy + s * 0.12);
      ctx.quadraticCurveTo(dx, dy - s * 0.3, dx + s * 0.22, dy + s * 0.12);
      ctx.quadraticCurveTo(dx, dy + s * 0.26, dx - s * 0.22, dy + s * 0.12);
      ctx.fill();
      ctx.strokeStyle = '#7ea85f';
      ctx.lineWidth = 1.2;
      for (let k = -2; k <= 2; k += 1) {
        ctx.beginPath();
        ctx.moveTo(dx + k * s * 0.07, dy - s * 0.16 + Math.abs(k) * s * 0.035);
        ctx.lineTo(dx + k * s * 0.09, dy + s * 0.08);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#efe1c8';
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.translate(-s * 0.36 + i * s * 0.34, -s * 0.16 + (i % 2) * s * 0.06);
      drawIngredient(ctx, 'cloudcap', 0, 0, s * 0.26, { chopped: true, cooked: true });
      ctx.restore();
    }
  } else if (recipeId === 'cloud_skewers') {
    ctx.strokeStyle = '#c9a06a';
    ctx.lineWidth = s * 0.06;
    for (let i = 0; i < 2; i += 1) {
      const offset = (i - 0.5) * s * 0.36;
      ctx.beginPath();
      ctx.moveTo(offset - s * 0.3, s * 0.28);
      ctx.lineTo(offset + s * 0.3, -s * 0.34);
      ctx.stroke();
      for (let k = 0; k < 3; k += 1) {
        const t = 0.2 + k * 0.3;
        const px = offset - s * 0.3 + t * s * 0.6;
        const py = s * 0.28 - t * s * 0.62;
        drawIngredient(ctx, k % 2 === 0 ? 'cloudcap' : 'sunpetal', px, py, s * 0.24, {
          chopped: k % 2 === 1,
          cooked: true,
        });
      }
    }
    ctx.fillStyle = '#e9c977';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(s * 0.3 - i * s * 0.06, s * 0.2 - i * s * 0.02, s * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (recipeId === 'sun_broth') {
    // A bowl of golden broth: petals floating, a root slice, a cloudcap.
    ctx.fillStyle = '#5d3a22';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.68, s * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    const broth = ctx.createRadialGradient(-s * 0.15, -s * 0.1, s * 0.05, 0, 0, s * 0.6);
    broth.addColorStop(0, '#f7d37c');
    broth.addColorStop(0.7, '#e2a63f');
    broth.addColorStop(1, '#b97b25');
    ctx.fillStyle = broth;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.02, s * 0.58, s * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.02, s * 0.58, s * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      const a = i * 1.7;
      ctx.save();
      ctx.translate(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.16 + s * 0.02);
      ctx.rotate(a);
      drawIngredient(ctx, 'sunpetal', 0, 0, s * 0.26, { chopped: true, cooked: true });
      ctx.restore();
    }
    for (let i = 0; i < 2; i += 1) {
      ctx.save();
      ctx.translate(-s * 0.24 + i * s * 0.46, -s * 0.1 + i * s * 0.18);
      drawIngredient(ctx, i === 0 ? 'emberroot' : 'cloudcap', 0, 0, s * 0.24, {
        chopped: true, cooked: true,
      });
      ctx.restore();
    }
  }
  if (options.steam) drawSteam(ctx, 0, -s * 0.35, time, 0.62, 1);
  ctx.restore();
}

// A plate mid-assembly: the cooked parts laid out but not yet composed.
export function drawPartialPlate(ctx, items, x, y, radius, time) {
  ctx.save();
  ctx.translate(x, y);
  const count = Math.max(1, items.length);
  items.forEach((item, index) => {
    const a = (index / count) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * radius * 0.4;
    const py = Math.sin(a) * radius * 0.22;
    drawIngredient(ctx, item, px, py, radius * 0.52, { chopped: true, cooked: true, angle: a });
  });
  ctx.fillStyle = 'rgba(255, 244, 220, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.16, radius * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  drawSteam(ctx, 0, -radius * 0.2, time, 0.4, items.length > 1 ? 0.7 : 0.4);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The chef

export function drawChef(ctx, chef, time) {
  const { x, y, facing } = chef;
  const walk = chef.walkPhase ?? 0;
  const bob = chef.moving ? Math.sin(walk * 9) * 2 : Math.sin(time * 2) * 0.8;
  const flip = facing === 'left' ? -1 : 1;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(1.34, 1.34);

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 30, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs.
  const step = chef.moving ? Math.sin(walk * 9) * 6 : 0;
  ctx.fillStyle = '#2f2a34';
  ctx.beginPath();
  ctx.ellipse(-10 + step, 16, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10 - step, 16, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1720';
  ctx.beginPath();
  ctx.ellipse(-11 + step, 25, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11 - step, 25, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso in a rust-coloured apron with a bib.
  ctx.fillStyle = '#3c3a4a';
  ctx.beginPath();
  ctx.ellipse(0, -2, 22, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  const apron = ctx.createLinearGradient(-20, -18, 20, 24);
  apron.addColorStop(0, '#b04a34');
  apron.addColorStop(1, '#7e3022');
  ctx.fillStyle = apron;
  ctx.beginPath();
  ctx.moveTo(-16, -10);
  ctx.quadraticCurveTo(0, -16, 16, -10);
  ctx.lineTo(20, 20);
  ctx.quadraticCurveTo(0, 27, -20, 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 190, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 22);
  ctx.stroke();

  // Head and toque.
  ctx.fillStyle = '#e8b98f';
  ctx.beginPath();
  ctx.arc(0, -32, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2430';
  ctx.beginPath();
  ctx.ellipse(flip * 2, -36, 15, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Eyes, a little tired and focused.
  ctx.fillStyle = '#241c18';
  ctx.beginPath();
  ctx.arc(flip * -4 + 1, -31, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(flip * 5 + 1, -31, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a4f3a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(flip * 1, -25, 4, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.fillStyle = '#f7f1e2';
  ctx.beginPath();
  ctx.ellipse(0, -49, 17, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -55, 7, 0, Math.PI * 2);
  ctx.arc(2, -58, 7, 0, Math.PI * 2);
  ctx.arc(11, -54, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190, 178, 158, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-4, -45, 13, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Arms reach toward what the chef is working on.
  const reach = chef.action ? 10 : 0;
  ctx.strokeStyle = '#e8b98f';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-19, -6);
  ctx.quadraticCurveTo(-28, 2 - reach, -24, 10 - reach);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, -6);
  ctx.quadraticCurveTo(28, 2 - reach, 24, 10 - reach);
  ctx.stroke();

  // The tray of carried things, held out in front.
  const carryCount = chef.carry.length;
  if (carryCount > 0) {
    const trayY = 6;
    ctx.fillStyle = '#d9c6a2';
    roundRect(ctx, -30, trayY - 4, 60, 9, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(90, 60, 35, 0.4)';
    roundRect(ctx, -30, trayY + 3, 60, 3, 2);
    ctx.fill();
    chef.carry.forEach((item, index) => {
      const px = -22 + index * 15;
      ctx.save();
      ctx.translate(px, trayY - 7);
      if (item.kind === 'dish') {
        drawPlate(ctx, 0, 0, 11);
        drawDish(ctx, item.recipeId, 0, -1, 10, time, {});
      } else if (item.kind === 'plate') {
        drawPlate(ctx, 0, 0, 11);
      } else {
        drawIngredient(ctx, item.id, 0, 0, 11, {
          chopped: item.kind !== 'raw',
          cooked: item.kind === 'cooked',
          burnt: item.kind === 'burnt',
        });
      }
      ctx.restore();
    });
  }

  // A puff of movement dust when chopping or plating.
  if (chef.action && chef.action.kind === 'chop') {
    drawSpark(ctx, 0, -6, 12 + Math.sin(time * 30) * 3, 'rgba(255, 214, 150, 0.8)', 0.8);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Order tickets

export function drawTicket(ctx, order, x, y, w, h, remaining, time) {
  const recipe = RECIPES[order.recipeId];
  ctx.save();
  ctx.translate(x, y);
  const urgency = 1 - Math.max(0, remaining) / order.patience;
  const warm = urgency > 0.72;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const paper = ctx.createLinearGradient(0, 0, 0, h);
  paper.addColorStop(0, warm ? '#f6dcc0' : '#f7ecd5');
  paper.addColorStop(1, warm ? '#e8bfa0' : '#e8d6b4');
  ctx.fillStyle = paper;
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Clip and torn bottom edge.
  ctx.fillStyle = '#2e2622';
  roundRect(ctx, w / 2 - 16, -8, 32, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#b8ac96';
  ctx.beginPath();
  ctx.arc(w / 2, -1, 3, 0, Math.PI * 2);
  ctx.fill();

  label(ctx, 'TICKET ' + String(order.number).padStart(2, '0'), w / 2, 16, {
    size: 10, color: '#8a6b46', weight: '700',
  });

  // Dish name, wrapped to two lines if needed.
  const words = recipe.name.split(' ');
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 15px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (words.length > 2) {
    ctx.fillText(words.slice(0, 2).join(' '), w / 2, 38);
    ctx.fillText(words.slice(2).join(' '), w / 2, 54);
  } else {
    ctx.fillText(recipe.name, w / 2, 46);
  }

  // Ingredient icons, each with a tick when it is plated.
  const items = recipe.items;
  const spacing = Math.min(30, (w - 20) / items.length);
  const startX = w / 2 - ((items.length - 1) * spacing) / 2;
  items.forEach((id, index) => {
    drawIngredient(ctx, id, startX + index * spacing, 78, 15, { cooked: false });
    ctx.strokeStyle = 'rgba(120, 92, 60, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(startX + index * spacing, 78, 13, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Patience bar with the seconds left.
  const barW = w - 24;
  const frac = Math.max(0, Math.min(1, remaining / order.patience));
  ctx.fillStyle = 'rgba(60, 42, 28, 0.22)';
  roundRect(ctx, 12, h - 34, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#6f9c53' : frac > 0.24 ? '#d79b34' : '#c8452f';
  roundRect(ctx, 12, h - 34, Math.max(3, barW * frac), 8, 4);
  ctx.fill();
  label(ctx, Math.ceil(Math.max(0, remaining)) + 's', w / 2, h - 16, {
    size: 10, color: warm ? '#8f2f20' : '#6b5a44', weight: '700',
  });

  if (urgency > 0.82) {
    ctx.globalAlpha = 0.35 + Math.sin(time * 8) * 0.2;
    ctx.strokeStyle = '#c8452f';
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, w - 2, h - 2, 6);
    ctx.stroke();
  }
  ctx.restore();
}
