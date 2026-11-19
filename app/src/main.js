// Leonida Polaroid Press — a postcard-style GTA 6 cover maker.
// Every scene is drawn with canvas code: no photos, no network, no fonts fetched.
// The cover is one <canvas>; layouts place "photos" (procedural scenes) as
// tilted polaroids, diagonal cuts or a contact sheet, then a halftone title
// block, outlined gradient lettering, grain and a vignette finish the print.

'use strict';

// ---------------------------------------------------------------- utilities

/** Deterministic PRNG so a scene draws the same way every run. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

/** A small linear gradient helper: stops are [offset, color]. */
function grad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// ---------------------------------------------------------------- scenes

const SCENE_SIZE = 720;
const sceneCache = new Map();

function sceneCanvas(name) {
  if (sceneCache.has(name)) return sceneCache.get(name);
  const c = document.createElement('canvas');
  c.width = SCENE_SIZE; c.height = SCENE_SIZE;
  const ctx = c.getContext('2d');
  SCENES[name](ctx, SCENE_SIZE, SCENE_SIZE);
  sceneCache.set(name, c);
  return c;
}

function drawSun(ctx, x, y, r, core, halo) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.2);
  g.addColorStop(0, halo); g.addColorStop(1, 'rgba(255,120,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function drawPalm(ctx, x, y, h, lean, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(lean);
  ctx.strokeStyle = color; ctx.lineWidth = h * 0.035; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(h * 0.06, -h * 0.55, h * 0.02, -h); ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.12 - (i / 6) * Math.PI * 0.85;
    const len = h * (0.34 + (i % 2) * 0.07);
    const tipX = h * 0.02 + Math.cos(a) * len;
    const tipY = -h + Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(h * 0.02, -h);
    ctx.quadraticCurveTo(h * 0.02 + Math.cos(a) * len * 0.5, -h + Math.sin(a) * len * 0.4 - h * 0.06, tipX, tipY);
    ctx.quadraticCurveTo(h * 0.02 + Math.cos(a) * len * 0.55, -h + Math.sin(a) * len * 0.55, h * 0.02, -h);
    ctx.fill();
  }
  ctx.restore();
}

function drawBuildingRow(ctx, w, baseY, topMin, topMax, color, rng, lit) {
  let x = -10;
  while (x < w + 10) {
    const bw = 46 + rng() * 90;
    const top = topMin + rng() * (topMax - topMin);
    ctx.fillStyle = color;
    ctx.fillRect(x, top, bw, baseY - top);
    if (lit) {
      for (let wy = top + 14; wy < baseY - 16; wy += 26) {
        for (let wx = x + 10; wx < x + bw - 10; wx += 22) {
          if (rng() < 0.42) {
            ctx.fillStyle = rng() < 0.7 ? 'rgba(255,214,120,0.9)' : 'rgba(140,230,255,0.85)';
            ctx.fillRect(wx, wy, 9, 12);
          }
        }
      }
    }
    x += bw + 4 + rng() * 14;
  }
}

const SCENES = {
  // Ocean Drive at golden hour: striped sun, palm silhouettes, a road
  // running straight at the viewer.
  boulevard(ctx, w, h) {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#2b1055'], [0.42, '#ff2e88'], [0.62, '#ff7a1a'], [0.75, '#ffd23e'], [1, '#3a1c4d']]);
    ctx.fillRect(0, 0, w, h);
    drawSun(ctx, w * 0.5, h * 0.46, 86, '#fff3c4', 'rgba(255,150,60,0.55)');
    // Sun slats, a synthwave touch.
    ctx.fillStyle = 'rgba(43,16,85,0.85)';
    for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.5 - 95, h * 0.46 + 18 + i * 20, 190, 7 + i * 2);
    ctx.fillStyle = '#1d0b33';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    drawBuildingRow(ctx, w, h * 0.64, h * 0.30, h * 0.5, '#160826', mulberry32(11), true);
    // The road: a dark wedge with a glowing centre line.
    ctx.fillStyle = '#241533';
    ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.64); ctx.lineTo(w * 0.58, h * 0.64); ctx.lineTo(w * 0.78, h); ctx.lineTo(w * 0.22, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23e';
    for (let i = 0; i < 5; i++) {
      const y = h * 0.66 + i * h * 0.068;
      const s = 4 + i * 5;
      ctx.fillRect(w * 0.5 - s / 2, y, s, 12 + i * 6);
    }
    drawPalm(ctx, w * 0.10, h * 0.98, h * 0.42, -0.10, '#12041f');
    drawPalm(ctx, w * 0.90, h * 0.98, h * 0.36, 0.12, '#12041f');
    drawPalm(ctx, w * 0.30, h * 0.66, h * 0.16, -0.06, '#160826');
  },

  // A rain-slick neon street: signs, reflections, a lone figure.
  neon(ctx, w, h) {
    const rng = mulberry32(42);
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#070313'], [0.55, '#150a33'], [1, '#2a0f45']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.25 + rng() * 0.6; ctx.fillRect(rng() * w, rng() * h * 0.4, 2, 2); }
    ctx.globalAlpha = 1;
    drawBuildingRow(ctx, w, h * 0.78, h * 0.12, h * 0.42, '#0b0618', mulberry32(7), true);
    const signs = [
      ['VICE', '#ff2e88', 0.08, 0.16, 150], ['HOTEL', '#0ec5c5', 0.66, 0.10, 132],
      ['24H', '#ffd23e', 0.72, 0.34, 96], ['LEONIDA', '#7b2fff', 0.12, 0.38, 150],
    ];
    for (const [text, color, fx, fy, fs] of signs) {
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = 26;
      ctx.fillStyle = color;
      ctx.font = `900 ${fs * 0.42}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(text, w * fx, h * fy);
      ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.strokeRect(w * fx - 8, h * fy - fs * 0.36, ctx.measureText(text).width + 16, fs * 0.5);
    }
    // Wet street with stretched reflections.
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    for (let i = 0; i < 26; i++) {
      const colors = ['#ff2e88', '#0ec5c5', '#ffd23e', '#7b2fff'];
      ctx.fillStyle = colors[i % 4];
      ctx.globalAlpha = 0.16 + rng() * 0.3;
      const rx = rng() * w;
      ctx.fillRect(rx, h * 0.80 + rng() * h * 0.16, 3 + rng() * 8, 26 + rng() * 60);
    }
    ctx.globalAlpha = 1;
    // A lone figure with a duffel bag, mid-crossing.
    ctx.fillStyle = '#05030a';
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.845, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(w * 0.5 - 11, h * 0.86, 22, 52);
    ctx.fillRect(w * 0.5 - 12, h * 0.91, 8, 46);
    ctx.fillRect(w * 0.5 + 4, h * 0.91, 8, 46);
    ctx.fillRect(w * 0.5 + 12, h * 0.89, 16, 12);
  },

  // A quiet beach at dusk: banded sea, one palm, a striped umbrella.
  beach(ctx, w, h) {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#123a5c'], [0.4, '#e8836b'], [0.55, '#ffc46b'], [0.62, '#2a7f8f'], [1, '#e8c98f']]);
    ctx.fillRect(0, 0, w, h);
    drawSun(ctx, w * 0.68, h * 0.44, 62, '#fff0b8', 'rgba(255,180,90,0.5)');
    ctx.fillStyle = '#2a7f8f';
    ctx.fillRect(0, h * 0.55, w, h * 0.17);
    const rng = mulberry32(99);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 9; i++) {
      const y = h * (0.57 + rng() * 0.13);
      ctx.fillRect(rng() * w * 0.7, y, 60 + rng() * 130, 3);
    }
    ctx.fillStyle = '#e8c98f';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = 'rgba(120,70,30,0.25)';
    for (let i = 0; i < 5; i++) ctx.fillRect(0, h * (0.76 + i * 0.045), w, 3);
    // Umbrella: alternating wedges.
    const ux = w * 0.30, uy = h * 0.80;
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy - 78); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#ff2e88' : '#fff3d6';
      ctx.beginPath();
      ctx.moveTo(ux, uy - 78);
      ctx.arc(ux, uy - 78, 74, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
      ctx.closePath(); ctx.fill();
    }
    drawPalm(ctx, w * 0.82, h * 0.97, h * 0.38, 0.14, '#3d2410');
  },

  // Downtown at night: lit towers, a big moon, water at the foot.
  skyline(ctx, w, h) {
    const rng = mulberry32(2026);
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#04060f'], [0.5, '#101a3a'], [0.78, '#3b2a5e'], [1, '#0a0616']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.3 + rng() * 0.7; ctx.fillRect(rng() * w, rng() * h * 0.5, 2, 2); }
    ctx.globalAlpha = 1;
    drawSun(ctx, w * 0.78, h * 0.16, 44, '#f4f1de', 'rgba(220,220,255,0.35)');
    ctx.fillStyle = 'rgba(4,6,15,0.25)';
    ctx.beginPath(); ctx.arc(w * 0.78 - 14, h * 0.16 - 8, 34, 0, Math.PI * 2); ctx.fill();
    drawBuildingRow(ctx, w, h * 0.86, h * 0.22, h * 0.58, '#0a0f22', mulberry32(5), true);
    drawBuildingRow(ctx, w, h * 0.86, h * 0.45, h * 0.7, '#05070f', mulberry32(31), true);
    ctx.fillStyle = '#0d1530';
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(255,214,120,0.5)' : 'rgba(140,230,255,0.5)';
      ctx.fillRect(rng() * w, h * 0.87 + rng() * h * 0.11, 4 + rng() * 10, 3);
    }
  },
};

const SCENE_LIST = [
  { id: 'boulevard', name: 'Ocean Drive' },
  { id: 'neon', name: 'Neon Street' },
  { id: 'beach', name: 'Beach Dusk' },
  { id: 'skyline', name: 'Skyline Night' },
];

// ---------------------------------------------------------------- grades

const GRADES = {
  vice:   { name: 'Vice Sunset',  filter: 'saturate(1.55) contrast(1.12) hue-rotate(-12deg) brightness(1.05)', swatch: '#ff2e88' },
  neon:   { name: 'Neon Noir',    filter: 'saturate(1.35) contrast(1.28) hue-rotate(24deg) brightness(0.92)', swatch: '#7b2fff' },
  faded:  { name: 'Faded Film',   filter: 'saturate(0.72) contrast(0.86) brightness(1.09) sepia(0.28)', swatch: '#d9b48a' },
  golden: { name: 'Golden Hour',  filter: 'saturate(1.45) contrast(1.06) hue-rotate(-26deg) brightness(1.09) sepia(0.16)', swatch: '#ffb347' },
  mono:   { name: 'Mono Noir',    filter: 'grayscale(1) contrast(1.18) brightness(1.03)', swatch: '#888888' },
  teal:   { name: 'Teal Crush',   filter: 'saturate(1.25) contrast(1.12) hue-rotate(18deg) brightness(0.98)', swatch: '#0ec5c5' },
};

// ---------------------------------------------------------------- layouts

// Slots are normalized to the cover. frame: 'bleed' | 'polaroid' | 'thin'.
// clip: normalized polygon points the photo is cut to (diagonal cuts).
const LAYOUTS = {
  hero: {
    name: 'Hero',
    slots: [{ scene: 0, x: 0, y: 0, w: 1, h: 1, rot: 0, frame: 'bleed', title: 'bottom' }],
  },
  stack: {
    name: 'Polaroid Stack',
    slots: [
      { scene: 0, x: 0.06, y: 0.05, w: 0.56, h: 0.50, rot: -6, frame: 'polaroid' },
      { scene: 1, x: 0.40, y: 0.14, w: 0.56, h: 0.50, rot: 4, frame: 'polaroid' },
      { scene: 2, x: 0.22, y: 0.36, w: 0.56, h: 0.50, rot: -2, frame: 'polaroid' },
    ],
  },
  contact: {
    name: 'Contact Sheet',
    slots: [
      { scene: 0, x: 0.05, y: 0.16, w: 0.44, h: 0.36, rot: -1.5, frame: 'thin' },
      { scene: 1, x: 0.51, y: 0.16, w: 0.44, h: 0.36, rot: 1.5, frame: 'thin' },
      { scene: 2, x: 0.05, y: 0.56, w: 0.44, h: 0.36, rot: 1, frame: 'thin' },
      { scene: 3, x: 0.51, y: 0.56, w: 0.44, h: 0.36, rot: -1, frame: 'thin' },
    ],
  },
  diagonal: {
    name: 'Diagonal Cut',
    slots: [
      { scene: 0, x: 0, y: 0, w: 1, h: 1, rot: 0, frame: 'bleed', clip: [[0, 0], [1, 0.18], [0.82, 1], [0, 1]], title: 'bottom' },
      { scene: 3, x: 0, y: 0, w: 1, h: 1, rot: 0, frame: 'bleed', clip: [[1, 0.18], [1, 1], [0.82, 1]], title: null },
    ],
  },
  postcard: {
    name: 'Postcard',
    slots: [{ scene: 2, x: 0.04, y: 0.04, w: 0.92, h: 0.58, rot: -1, frame: 'polaroid', title: 'band' }],
  },
  collage: {
    name: 'Collage',
    slots: [
      { scene: 1, x: 0.04, y: 0.05, w: 0.58, h: 0.78, rot: -2, frame: 'polaroid' },
      { scene: 3, x: 0.64, y: 0.05, w: 0.32, h: 0.38, rot: 3, frame: 'polaroid' },
      { scene: 0, x: 0.64, y: 0.55, w: 0.32, h: 0.38, rot: -3, frame: 'polaroid' },
    ],
  },
};

const CAPTIONS = ['Sunset Heist', 'Boulevard Queen', 'Vice City Nights', 'Leonida Calling', '13 Years of Waiting', 'Ocean Drive'];

// ---------------------------------------------------------------- state

function defaultState() {
  return {
    layout: 'hero',
    grade: 'vice',
    title: 'LEONIDA',
    subtitle: 'GRAND THEFT AUTO VI',
    caption: 'Sunset Heist',
    // One photo entry per scene slot index; layouts point at these.
    photos: SCENE_LIST.map((s, i) => ({ scene: i, dx: 0, dy: 0, zoom: 1.18, tilt: 0 })),
    selected: 0,
  };
}

let state = defaultState();
let history = [];
let future = [];

function snapshot() { return JSON.stringify(state); }
function pushHistory() {
  history.push(snapshot());
  if (history.length > 40) history.shift();
  future = [];
  refreshUndoButtons();
}
function restore(json) {
  state = JSON.parse(json);
  syncControls();
  render();
}

// ---------------------------------------------------------------- grain

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 160; c.height = 160;
  const g = c.getContext('2d');
  const img = g.createImageData(160, 160);
  const rng = mulberry32(777);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// ---------------------------------------------------------------- rendering

function drawHalftone(ctx, x, y, w, h, color, gap, maxR) {
  ctx.fillStyle = color;
  for (let yy = y + gap / 2; yy < y + h; yy += gap) {
    for (let xx = x + gap / 2; xx < x + w; xx += gap) {
      const t = (yy - y) / h;
      const r = maxR * (0.25 + 0.75 * t);
      ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawTape(ctx, x, y, w, h, rot) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,244,200,0.55)';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-w / 2, -h / 2, w, h * 0.35);
  ctx.restore();
}

function drawTitleBlock(ctx, W, H, placement) {
  const bandH = H * (placement === 'band' ? 0.24 : 0.26);
  const bandY = placement === 'band' ? H * 0.74 : H - bandH;
  // Halftone backdrop: a deep violet band fading into the photo.
  const bg = ctx.createLinearGradient(0, bandY, 0, H);
  bg.addColorStop(0, 'rgba(20,6,38,0)');
  bg.addColorStop(0.18, 'rgba(20,6,38,0.88)');
  bg.addColorStop(1, 'rgba(20,6,38,0.96)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, W, H - bandY);
  drawHalftone(ctx, 0, bandY + bandH * 0.12, W, bandH * 0.5, 'rgba(255,46,136,0.5)', 22, 3.4);

  const cx = W / 2;
  const titleSize = W * 0.115;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(W * 0.012)}px`; } catch (e) { /* older canvas: no letter tracking */ }
  const titleGrad = grad(ctx, cx - W * 0.3, 0, cx + W * 0.3, 0, [[0, '#ff2e88'], [0.5, '#ffd23e'], [1, '#0ec5c5']]);
  ctx.font = `900 ${titleSize}px "Arial Black", Arial, sans-serif`;
  const ty = bandY + bandH * 0.62;
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.strokeStyle = '#14061f';
  ctx.strokeText(state.title, cx, ty);
  ctx.fillStyle = titleGrad;
  ctx.fillText(state.title, cx, ty);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  // Subtitle with a small rule on each side.
  const subSize = W * 0.032;
  ctx.font = `700 ${subSize}px Arial, sans-serif`;
  ctx.fillStyle = '#ffe9f3';
  const sy = bandY + bandH * 0.86;
  const sw = ctx.measureText(state.subtitle).width;
  ctx.fillText(state.subtitle, cx, sy);
  ctx.strokeStyle = 'rgba(255,233,243,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - sw / 2 - 90, sy - subSize * 0.35); ctx.lineTo(cx - sw / 2 - 22, sy - subSize * 0.35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + sw / 2 + 22, sy - subSize * 0.35); ctx.lineTo(cx + sw / 2 + 90, sy - subSize * 0.35); ctx.stroke();
}

/** Draw one scene into a slot rect, panned/zoomed by its photo entry. */
function drawPhotoInto(ctx, photo, rect, clip) {
  const img = sceneCanvas(SCENE_LIST[photo.scene].id);
  ctx.save();
  if (clip) {
    ctx.beginPath();
    clip.forEach(([px, py], i) => {
      const x = rect.x + px * rect.w, y = rect.y + py * rect.h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath(); ctx.clip();
  } else {
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  }
  // Cover the rect, then pan/zoom inside it.
  const scale = Math.max(rect.w / SCENE_SIZE, rect.h / SCENE_SIZE) * photo.zoom;
  const dw = SCENE_SIZE * scale, dh = SCENE_SIZE * scale;
  const dx = rect.x + (rect.w - dw) / 2 + photo.dx * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + photo.dy * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function renderCover(canvas, W, H) {
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const layout = LAYOUTS[state.layout];

  // Paper base.
  ctx.fillStyle = '#f6ead6';
  ctx.fillRect(0, 0, W, H);

  // Grade: draw every photo through a graded pass first.
  const pass = document.createElement('canvas');
  pass.width = W; pass.height = H;
  const pctx = pass.getContext('2d');
  pctx.fillStyle = '#f6ead6';
  pctx.fillRect(0, 0, W, H);
  // Reuse drawSlot against the pass canvas, then grade the whole pass.
  const savedSelected = state.selected;
  layout.slots.forEach((slot) => {
    const photo = state.photos[slot.scene];
    const rot = ((slot.rot + photo.tilt) * Math.PI) / 180;
    const x = slot.x * W, y = slot.y * H, w = slot.w * W, h = slot.h * H;
    const cx = x + w / 2, cy = y + h / 2;
    pctx.save();
    pctx.translate(cx, cy); pctx.rotate(rot); pctx.translate(-cx, -cy);
    if (slot.frame === 'bleed') {
      drawPhotoInto(pctx, photo, { x, y, w, h }, slot.clip || null);
    } else {
      const pad = slot.frame === 'polaroid' ? w * 0.045 : w * 0.02;
      drawPhotoInto(pctx, photo, { x: x + pad, y: y + pad, w: w - pad * 2, h: h - pad * 2 }, null);
    }
    pctx.restore();
  });
  ctx.filter = GRADES[state.grade].filter;
  ctx.drawImage(pass, 0, 0);
  ctx.filter = 'none';

  // Frames, tape and captions sit on top of the graded photos.
  layout.slots.forEach((slot) => {
    const photo = state.photos[slot.scene];
    const rot = ((slot.rot + photo.tilt) * Math.PI) / 180;
    const x = slot.x * W, y = slot.y * H, w = slot.w * W, h = slot.h * H;
    const cx = x + w / 2, cy = y + h / 2;
    if (slot.frame === 'bleed') {
      // A thin diagonal white seam where two bleeds meet.
      if (slot.clip) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(4, W * 0.008);
        ctx.beginPath();
        ctx.moveTo(x + w, y + h * 0.18); ctx.lineTo(x + w * 0.82, y + h);
        ctx.stroke();
      }
      return;
    }
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(x + 8, y + 10, w, h + (slot.frame === 'polaroid' ? h * 0.17 : 0));
    const pad = slot.frame === 'polaroid' ? w * 0.045 : w * 0.02;
    const capH = slot.frame === 'polaroid' ? h * 0.17 : 0;
    ctx.fillStyle = '#fffdf6';
    // Border ring only: the photo itself is already on the canvas.
    ctx.fillRect(x, y, w, pad);
    ctx.fillRect(x, y + h - pad, w, pad);
    ctx.fillRect(x, y, pad, h);
    ctx.fillRect(x + w - pad, y, pad, h);
    if (capH) ctx.fillRect(x, y + h, w, capH);
    drawTape(ctx, cx, y + 2, w * 0.42, Math.max(16, H * 0.028), (slot.rot > 0 ? -1 : 1) * 0.06);
    if (slot.frame === 'polaroid') {
      ctx.fillStyle = '#2c2140';
      ctx.font = `italic ${Math.max(15, w * 0.075)}px "Segoe Print", "Comic Sans MS", cursive`;
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(cx, y + h + capH * 0.62);
      ctx.rotate(-0.03);
      ctx.fillText(state.caption, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    if (!SHOT_MODE && state.selected === slot.scene) {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy);
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      ctx.strokeRect(x - 6, y - 6, w + 12, h + 12 + capH);
      ctx.restore();
    }
  });
  state.selected = savedSelected;

  // Title block for layouts that carry one.
  const titled = layout.slots.find((s) => s.title);
  if (titled) drawTitleBlock(ctx, W, H, titled.title);

  // The contact-sheet header sits above the grid, drawn after the graded
  // pass so the pass's paper base never covers it.
  if (state.layout === 'contact') {
    ctx.fillStyle = '#241a2e';
    ctx.font = `900 ${W * 0.035}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('LEONIDA — CONTACT SHEET 06', W * 0.05, H * 0.10);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(W * 0.05, H * 0.115, W * 0.9, 3);
  }

  // Grain, then a soft vignette.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- preview + UI

const stage = document.getElementById('stage');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
// In a screenshot preset there is no editor, so no selection ring.
const SHOT_MODE = params.has('shot');

function render() {
  const portrait = params.get('shot') === 'portrait';
  renderCover(stage, portrait ? 1080 : 1080, portrait ? 1350 : 1080);
}

function setStatus(msg) { statusEl.textContent = msg; }

function chip(label, pressed, onClick, swatch) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  if (swatch) {
    const s = document.createElement('span');
    s.className = 'swatch';
    s.style.background = swatch;
    b.appendChild(s);
  }
  b.appendChild(document.createTextNode(label));
  b.addEventListener('click', onClick);
  return b;
}

function buildChips() {
  const layoutRow = document.getElementById('layoutRow');
  layoutRow.replaceChildren();
  for (const [id, def] of Object.entries(LAYOUTS)) {
    layoutRow.appendChild(chip(def.name, state.layout === id, () => {
      pushHistory();
      state.layout = id;
      state.selected = LAYOUTS[id].slots[0].scene;
      syncControls(); render();
      setStatus(`Layout: ${def.name}.`);
    }));
  }
  const gradeRow = document.getElementById('gradeRow');
  gradeRow.replaceChildren();
  for (const [id, def] of Object.entries(GRADES)) {
    gradeRow.appendChild(chip(def.name, state.grade === id, () => {
      pushHistory();
      state.grade = id;
      syncControls(); render();
      setStatus(`Grade: ${def.name}.`);
    }, def.swatch));
  }
  const sceneRow = document.getElementById('sceneRow');
  sceneRow.replaceChildren();
  for (const s of SCENE_LIST) {
    sceneRow.appendChild(chip(s.name, state.photos[state.selected].scene === SCENE_LIST.indexOf(s), () => {
      pushHistory();
      state.photos[state.selected].scene = SCENE_LIST.indexOf(s);
      syncControls(); render();
      setStatus(`Photo ${state.selected + 1} is now ${s.name}.`);
    }));
  }
}

function syncControls() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('captionInput').value = state.caption;
  document.getElementById('tiltInput').value = String(state.photos[state.selected].tilt);
  buildChips();
  refreshUndoButtons();
}

function refreshUndoButtons() {
  document.getElementById('undoBtn').disabled = history.length === 0;
  document.getElementById('redoBtn').disabled = future.length === 0;
}

// Text inputs: live update, one history entry per change burst.
let textTimer = null;
function onTextInput() {
  state.title = document.getElementById('titleInput').value || 'LEONIDA';
  state.subtitle = document.getElementById('subtitleInput').value || '';
  state.caption = document.getElementById('captionInput').value || '';
  render();
  clearTimeout(textTimer);
  textTimer = setTimeout(() => pushHistory(), 600);
}
document.getElementById('titleInput').addEventListener('input', onTextInput);
document.getElementById('subtitleInput').addEventListener('input', onTextInput);
document.getElementById('captionInput').addEventListener('input', onTextInput);
document.getElementById('tiltInput').addEventListener('input', (e) => {
  state.photos[state.selected].tilt = Number(e.target.value);
  render();
});
document.getElementById('tiltInput').addEventListener('change', () => pushHistory());

document.getElementById('shuffleBtn').addEventListener('click', () => {
  pushHistory();
  const layoutIds = Object.keys(LAYOUTS);
  const gradeIds = Object.keys(GRADES);
  state.layout = layoutIds[Math.floor(Math.random() * layoutIds.length)];
  state.grade = gradeIds[Math.floor(Math.random() * gradeIds.length)];
  state.caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
  const used = new Set();
  state.photos.forEach((p) => {
    let s;
    do { s = Math.floor(Math.random() * SCENE_LIST.length); } while (used.has(s) && used.size < SCENE_LIST.length);
    used.add(s);
    p.scene = s; p.dx = 0; p.dy = 0; p.zoom = 1.18; p.tilt = Math.round((Math.random() * 8) - 4);
  });
  state.selected = LAYOUTS[state.layout].slots[0].scene;
  syncControls(); render();
  setStatus('Shuffled — a fresh deck of scenes, grade and layout.');
});

document.getElementById('undoBtn').addEventListener('click', () => {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  setStatus('Undone.');
});
document.getElementById('redoBtn').addEventListener('click', () => {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  setStatus('Redone.');
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const [w, h] = document.getElementById('sizeSelect').value.split('x').map(Number);
  const out = document.createElement('canvas');
  renderCover(out, w, h);
  out.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — the browser refused the canvas.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported ${w} × ${h} PNG — check your downloads.`);
  }, 'image/png');
});

// ---------------------------------------------------------------- drag to reframe

function slotAt(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const px = (clientX - rect.left) / rect.width;
  const py = (clientY - rect.top) / rect.height;
  const layout = LAYOUTS[state.layout];
  for (let i = layout.slots.length - 1; i >= 0; i--) {
    const s = layout.slots[i];
    const pad = s.frame === 'polaroid' ? 0.17 : 0;
    if (px >= s.x - 0.01 && px <= s.x + s.w + 0.01 && py >= s.y - 0.01 && py <= s.y + s.h * (1 + pad) + 0.01) return i;
  }
  return -1;
}

let drag = null;
stage.addEventListener('pointerdown', (e) => {
  const i = slotAt(e.clientX, e.clientY);
  if (i < 0) return;
  const slot = LAYOUTS[state.layout].slots[i];
  pushHistory();
  state.selected = slot.scene;
  syncControls();
  drag = { scene: slot.scene, startX: e.clientX, startY: e.clientY, moved: false };
  stage.setPointerCapture(e.pointerId);
  stage.classList.add('dragging');
  render();
});
stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  const photo = state.photos[drag.scene];
  photo.dx = clamp(photo.dx + (e.movementX || 0) / rect.width * 1.4, -0.45, 0.45);
  photo.dy = clamp(photo.dy + (e.movementY || 0) / rect.height * 1.4, -0.45, 0.45);
  if (e.movementX || e.movementY) drag.moved = true;
  render();
});
stage.addEventListener('pointerup', () => {
  if (drag && !drag.moved) setStatus(`Photo ${drag.scene + 1} selected — pick a scene for it.`);
  drag = null;
  stage.classList.remove('dragging');
});
stage.addEventListener('wheel', (e) => {
  const i = slotAt(e.clientX, e.clientY);
  if (i < 0) return;
  e.preventDefault();
  pushHistory();
  const photo = state.photos[LAYOUTS[state.layout].slots[i].scene];
  photo.zoom = clamp(photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1.0, 2.4);
  render();
}, { passive: false });

// ---------------------------------------------------------------- screenshot presets

// ?shot=cover|editor|portrait|sheet drives a deterministic look for captures.
const SHOTS = {
  cover: { layout: 'hero', grade: 'vice', caption: 'Sunset Heist', title: 'LEONIDA', subtitle: 'GRAND THEFT AUTO VI', scenes: [0, 1, 2, 3] },
  editor: { layout: 'stack', grade: 'golden', caption: 'Boulevard Queen', title: 'LEONIDA', subtitle: 'GRAND THEFT AUTO VI', scenes: [0, 1, 2, 3] },
  portrait: { layout: 'postcard', grade: 'neon', caption: 'Vice City Nights', title: 'LEONIDA', subtitle: 'GRAND THEFT AUTO VI', scenes: [2, 3, 0, 1] },
  sheet: { layout: 'contact', grade: 'teal', caption: 'Leonida Calling', title: 'LEONIDA', subtitle: 'GRAND THEFT AUTO VI', scenes: [0, 1, 2, 3] },
};

function applyShot(name) {
  const preset = SHOTS[name];
  if (!preset) return;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.caption = preset.caption;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  preset.scenes.forEach((scene, i) => { state.photos[i].scene = scene; });
  state.selected = LAYOUTS[preset.layout].slots[0].scene;
  document.body.classList.add(`shot-${name}`);
}

const shot = params.get('shot');
if (shot) applyShot(shot);
syncControls();
render();
