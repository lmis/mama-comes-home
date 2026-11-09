// ---------- the Fox Family book: its drawing kit ----------
// The second book is painted, not drawn with the candy kit: the family and the
// furniture are cut out of the supplied picture sheets (tools/fox_extract.py),
// and whatever the sheets don't have (skies, a city, pans, presents) is drawn
// here in the same muted colours with a warm, slightly wobbly ink line.
const FOX = {
  ink: '#3b2a24', cream: '#f1e4c8', paper: '#f0e2c4', ochre: '#d3a046', rust: '#b5532f',
  olive: '#7d8a4a', sage: '#a4a874', dusty: '#6f8aa6', dustyDark: '#4f6680', brown: '#8a5a3a', rose: '#c98b7d',
};

// a pseudo-random wobble that stays put from frame to frame (so lines don't shimmer)
function wob(i, k = 1) { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; }
function fpaint(fill, lw = 2.6) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = FOX.ink; ctx.stroke(); }
}
// a hand-drawn polygon: every edge bows a little
function fpoly(pts, fill, lw = 2.6, seed = 1) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i <= pts.length; i += 2) {
    const x0 = pts[i - 2], y0 = pts[i - 1], x1 = pts[i % pts.length], y1 = pts[(i + 1) % pts.length];
    const mx = (x0 + x1) / 2 + wob(i, seed) * 1.6, my = (y0 + y1) / 2 + wob(i + 7, seed) * 1.6;
    ctx.quadraticCurveTo(mx, my, x1, y1);
  }
  ctx.closePath(); fpaint(fill, lw);
}
function frect(x, y, w, h, fill, lw = 2.6, seed = 1) { fpoly([x, y, x + w, y, x + w, y + h, x, y + h], fill, lw, seed); }
function fell(x, y, rx, ry, fill, lw = 2.6, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, Math.abs(rx)), Math.max(0.1, Math.abs(ry)), rot, 0, TAU); fpaint(fill, lw);
}
function fline(x1, y1, x2, y2, w = 2.6, col = FOX.ink) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2 + wob(x1 + y2) * 1.5, (y1 + y2) / 2 + wob(y1 + x2) * 1.5, x2, y2);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
}
function fword(text, x, y, size, col = FOX.cream, rot = 0) { // a sound word in the book's muted colours
  push(x, y, rot);
  ctx.font = `700 ${size}px Fredoka, "Baloo 2", system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.18; ctx.strokeStyle = FOX.ink; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = col; ctx.fillText(text, 0, 0);
  pop();
}
// pic with its centre (not bottom) at x,y
function picC(im, x, y, w, flip = false, rot = 0) {
  const h = w * im.naturalHeight / im.naturalWidth;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
const foxArt = n => art('fox-' + n);
// draws prop n (bottom centre at x,y, w wide) and returns its box [x0, y0, x1, y1]
function prop(n, x, y, w, flip = false, rot = 0) {
  const im = foxArt(n); if (!im) return [x - w / 2, y - w * 0.6, x + w / 2, y];
  pic(im, x, y, w, flip, rot);
  return [x - w / 2, y - w * im.naturalHeight / im.naturalWidth, x + w / 2, y];
}
const inBox = (b, x, y, pad = 0) => b && x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
const boxMid = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

// the paper: a faint grain over every page, so painted sheets and drawn parts sit on one paper
let FOX_GRAIN = null;
function paperGrain(a = 0.07) {
  if (!FOX_GRAIN && typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), d = g.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 200 + Math.random() * 55 - (Math.random() < 0.02 ? 50 : 0);
      d.data[i] = v; d.data[i + 1] = v * 0.94; d.data[i + 2] = v * 0.84; d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0); FOX_GRAIN = ctx.createPattern(c, 'repeat');
  }
  if (!FOX_GRAIN) return;
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = FOX_GRAIN; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ---------- the family ----------
// Each character is a set of painted poses that all hang from the same foot point
// (FOX_POSES), so swapping poses never makes anyone jump. Idle life: breathing,
// a slight sway, and blinks (Papa and the twins have a closed-eye picture; Mama's
// sheet has none, so her eyelids are painted on).
const FOX_KIND = {
  papa: { pre: 'papa-', native: 1, blink: 'blink' },
  mama: { pre: 'mama-', native: 1, blink: null },
  blue: { pre: 'twin-blue-', native: 1, blink: 'joy' },
  rust: { pre: 'twin-rust-', native: -1, blink: 'joy' },
};
// how tall each stands on a page, before a page's own zoom
const FOX_H = { papa: 400, mama: 372, blue: 228, rust: 228 };
class Fox {
  constructor(kind, x, y, o = {}) {
    this.kind = kind; this.x = x; this.y = y; this.face = o.face ?? 1; this.h = o.h ?? FOX_H[kind];
    this.base = o.pose || 'idle'; this.pose = null; this.poseT = 0;
    this.jy = 0; this.lean = 0; this.leanTo = 0; this.squash = 0; this.t = rnd(0, 10);
    this.blinkT = rnd(1.5, 4); this.tw = null; this.wave = 0; this.hidden = false; this.alpha = 1;
    this.ph = rnd(0, TAU);
  }
  say(pose, dur) { this.pose = pose; this.poseT = dur; }
  // go to x,y over dur seconds, hopping if hop > 0; h tweens too (for coming out of a doorway)
  moveTo(x, y, dur, hop = 0, h = this.h) {
    this.tw = { x0: this.x, y0: this.y, h0: this.h, x1: x, y1: y, h1: h, t: 0, dur, hop };
    if (Math.abs(x - this.x) > 4) this.face = Math.sign(x - this.x);
  }
  hop(height = 30) { this.hopT = 0; this.hopH = height; }
  get moving() { return !!this.tw; }
  get scale() { return this.h / 160; } // (the button-picture tool sizes characters by this,
  get tx() { return this.tw ? this.tw.x1 : null; } // and waits until nobody is walking)
  update(dt) {
    this.t += dt;
    if (this.poseT > 0 && (this.poseT -= dt) <= 0) this.pose = null;
    if (this.wave > 0) this.wave -= dt;
    this.blinkT -= dt; if (this.blinkT < -0.14) this.blinkT = rnd(2.2, 5);
    this.lean += (this.leanTo - this.lean) * Math.min(1, dt * 8);
    this.squash *= Math.pow(0.02, dt);
    this.jy = 0;
    if (this.tw) {
      const w = this.tw; w.t += dt; const k = clamp(w.t / w.dur, 0, 1), e = ease(k);
      this.x = lerp(w.x0, w.x1, e); this.y = lerp(w.y0, w.y1, e); this.h = lerp(w.h0, w.h1, e);
      if (w.hop) this.jy = -Math.abs(Math.sin(k * Math.PI * Math.max(1, Math.round(w.dur * 3)))) * w.hop;
      if (k >= 1) { this.tw = null; this.squash = 0.06; }
    }
    if (this.hopT !== undefined) {
      this.hopT += dt; const k = this.hopT / 0.5;
      if (k >= 1) { this.hopT = undefined; this.squash = 0.08; } else this.jy += -Math.sin(k * Math.PI) * this.hopH;
    }
  }
  // which picture is showing right now
  current() {
    const K = FOX_KIND[this.kind];
    if (this.wave > 0 && (this.kind === 'blue' || this.kind === 'rust')) return Math.sin(this.t * 14) > 0 ? 'cheer' : 'cheer2';
    if (this.wave > 0 && this.kind === 'papa') return Math.sin(this.t * 10) > 0 ? 'wide' : 'laugh';
    if (this.pose) return this.pose;
    if (K.blink && this.blinkT < 0 && this.base === 'idle') return K.blink;
    return this.base;
  }
  box() { // where the character is on the page, for taps
    const w = this.h * (this.kind === 'papa' ? 0.42 : this.kind === 'mama' ? 0.46 : 0.62);
    return [this.x - w / 2, this.y + this.jy - this.h, this.x + w / 2, this.y + this.jy];
  }
  head() { return [this.x + this.face * this.h * 0.06, this.y + this.jy - this.h * (this.kind === 'mama' ? 0.82 : 0.8)]; }
  draw(clipY = null) {
    if (this.hidden) return;
    const K = FOX_KIND[this.kind], name = K.pre + this.current(), im = foxArt(name), P = FOX_POSES[name];
    if (!im || !P) return;
    const s = this.h / P[2], breath = Math.sin(this.t * 2.1 + this.ph) * 0.009, sway = Math.sin(this.t * 0.9 + this.ph) * 0.4;
    const flip = this.face * K.native;
    ctx.save();
    if (clipY !== null) { ctx.beginPath(); ctx.rect(-50, -50, W + 100, clipY + 50); ctx.clip(); }
    if (this.alpha < 1) ctx.globalAlpha = this.alpha;
    // a soft shadow on the floor
    if (clipY === null && this.shadow !== false) {
      ctx.save(); ctx.globalAlpha *= 0.18 * clamp(1 + this.jy / 120, 0.3, 1);
      ell(this.x, this.y + 2, this.h * 0.2, this.h * 0.03, '#2a1a10', 0); ctx.restore();
    }
    ctx.translate(this.x, this.y + this.jy);
    ctx.rotate((this.lean + sway) * Math.PI / 180);
    ctx.scale(flip * s * (1 + this.squash), s * (1 + breath - this.squash));
    ctx.drawImage(im, -P[0], -P[1]);
    // Mama's painted blink: a lid of eye-white and a lash line over each eye
    if (this.kind === 'mama' && this.blinkT < 0 && !this.pose && this.base === 'idle') {
      const ox = -P[0], oy = -P[1];
      for (const [ex, ey] of [[170, 110], [216, 110]]) {
        ell(ox + ex, oy + ey, 9, 11, '#f4e2c6', 0);
        ctx.beginPath(); ctx.arc(ox + ex, oy + ey - 4, 8, 0.25, Math.PI - 0.25); ctx.lineWidth = 3.4; ctx.strokeStyle = FOX.ink; ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ---------- the pages share this ----------
// A FoxPage has three tricks, one per button; each also lives on the page as a
// thing to tap (spots()). Things not tried yet glint now and then, so small
// fingers find them.
class FoxPage extends StoryPage {
  constructor(o) {
    super(Object.assign({ floor: 700 }, o));
    this.book = 'fox'; this.tried = new Set(); this.tap = null; this.glintI = 0;
    this.tricks = o.tricks.map(n => [n]);
  }
  press(k) { const n = this.tricks[k][0]; this.tried.add(n); this.lastTrick = n; super.press(k); this.tap = null; }
  // for the button pictures: each trick's best moment, in seconds after the tap
  peak() {
    const P = { suitcase: 0.3, twinsPerk: 0.45, calendar: 2.3, clothes: 0.35, socks: 0.75, pocket: 0.55, hugMama: 1.1, waveBye: 0.6, drive: 1.7,
      train: 1.0, windows: 0.6, tie: 0.5, flip: 0.55, stir: 0.6, onHead: 2.3, curtains: 1.0, stars: 0.6, sleepNight: 1.0, door: 0.9, run: 2.1, together: 3, wiggle: 0.35, ribbon: 0.4, mamaHug: 1.5 };
    const t = this.acts.t(this.lastTrick);
    return t !== undefined && t >= (P[this.lastTrick] ?? 0.5);
  }
  // for the button pictures: the thing just tapped is where the action is
  focus() {
    const pts = [];
    for (const s of this.spots()) if (s.name === this.lastTrick && s.box) pts.push([s.box[0], s.box[1]], [s.box[2], s.box[3]]);
    return pts;
  }
  // the trick under a tap at page point x,y, or null
  hit(x, y) {
    for (const s of this.spots()) if (s.box && inBox(s.box, x, y, s.pad ?? 10)) { this.tap = [x, y]; return s.name; }
    return null;
  }
  spots() { return []; }
  update(dt) {
    super.update(dt);
    // a little glint on something not tapped yet, every few seconds (after the words have had time)
    // (not while the button-picture tool is watching for what a trick adds)
    if (this.shown > 3 && this.every('glint', 2.6) && !(typeof window !== 'undefined' && window.__noGlint)) {
      const left = this.spots().filter(s => s.box && !this.tried.has(s.name));
      if (left.length) {
        const s = left[this.glintI++ % left.length], [cx, cy] = s.glint || boxMid(s.box);
        this.st.sparkles(cx, cy, 5, 26, '#fff3c4');
      }
    }
  }
  finish() { this.st.draw(0); this.st.draw(1); this.st.draw(2); this.st.drawWords(); paperGrain(); }
  hearts(x, y, n, col = '#c8574a') {
    for (let i = 0; i < n; i++) this.st.add({ kind: 'heart', layer: 2, x: x + rnd(-30, 30), y, vx: rnd(-30, 30), vy: rnd(-120, -70), rot: rnd(0, 6), size: rnd(9, 14), col, life: rnd(1.3, 1.9) });
  }
  say(text, x, y, size = 46, col = FOX.cream) { this.st.say(text, x, y, size, col); }
}

// ---------- drawn scenery ----------
function foxSky(top, bottom, y1 = 520) { rect(0, 0, W, y1, grad(0, 0, 0, y1, [top, bottom])); }
function foxCloud(x, y, s, col = '#f6eedb', a = 0.9) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.beginPath();
  for (const [bx, by, r] of [[-40, 6, 22], [-12, -8, 30], [22, -4, 26], [48, 8, 18], [0, 12, 24]]) { ctx.moveTo(x + (bx + r) * s, y + by * s); ctx.arc(x + bx * s, y + by * s, r * s, 0, TAU); }
  ctx.fillStyle = col; ctx.fill();
  ctx.restore();
}
// rolling hills: a wavy band from y0, coloured col
function foxHills(y0, amp, col, seed, lw = 2) {
  ctx.beginPath(); ctx.moveTo(-20, H);
  for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, y0 + Math.sin(x * 0.006 + seed) * amp + Math.sin(x * 0.017 + seed * 3) * amp * 0.35);
  ctx.lineTo(W + 20, H); ctx.closePath(); fpaint(col, lw);
}
function foxTree(x, y, s, col = FOX.olive) {
  line(x, y, x, y - 30 * s, 6 * s, '#6b4a30', 0);
  fell(x, y - 46 * s, 22 * s, 28 * s, col, 2);
  fell(x - 6 * s, y - 54 * s, 8 * s, 10 * s, shade(col, 0.18), 0);
}
function foxGrass(xs, y, t, col = '#7d8a4a') {
  for (const x of xs) for (let i = -1; i <= 1; i++) {
    const sw = Math.sin(t * 1.4 + x * 0.05 + i) * 3;
    curve(x + i * 5, y, x + i * 6 + sw * 0.5, y - 8, x + i * 8 + sw, y - 15 - (i === 0 ? 4 : 0), 2.2, col, 0);
  }
}
// the countryside outside the cottage: sky, hills, a road winding to the horizon.
// dusk: 0 by day, 1 at sunset (for Mama coming home)
const ROAD = t => { // a point along the road, t = 0 at the gate, 1 on the horizon
  const x = lerp(820, 1150, ease(t)) + Math.sin(t * 5) * 40 * (1 - t), y = lerp(720, 400, Math.pow(t, 0.7));
  return [x, y, lerp(1, 0.18, Math.pow(t, 0.75))];
};
function foxCountry(t, dusk = 0) {
  const sky = dusk ? ['#9fa3b8', '#e3b994', '#f0d2a8'] : ['#c9d5d3', '#e6e4cf', '#efe3c6'];
  rect(0, 0, W, 470, grad(0, 0, 0, 470, sky));
  if (dusk) { glow(980, 380, 260, '#f6c27a', 0.55); circ(980, 392, 38, '#f2bb6e', 0); }
  for (const [cx, cy, s] of [[200, 170, 1.1], [620, 120, 0.8], [1040, 190, 1.3]]) foxCloud((cx + t * 6) % (W + 300) - 100, cy, s, dusk ? '#f2d6bb' : '#f6eedb', 0.85);
  foxHills(390, 18, dusk ? '#8f8f78' : '#a9ad84', 1.3, 1.6);
  for (const [x, s] of [[700, 0.55], [760, 0.7], [1210, 0.6], [930, 0.5]]) foxTree(x, 405 + Math.sin(x) * 6, s, dusk ? '#6f7356' : '#86904f');
  foxHills(430, 14, dusk ? '#868b62' : '#a4a46a', 4.1, 1.8);
  rect(0, 470, W, H - 470, grad(0, 470, 0, H, dusk ? ['#8f8d5c', '#77754a'] : ['#b1ad6c', '#9a9858']));
  // the road: wide by the gate, a thread on the horizon
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) { const [x, y, s] = ROAD(i / 30); ctx.lineTo(x - 90 * s, y); }
  for (let i = 30; i >= 0; i--) { const [x, y, s] = ROAD(i / 30); ctx.lineTo(x + 90 * s, y); }
  ctx.closePath(); fpaint(dusk ? '#c7ab80' : '#dcc596', 2);
  for (let i = 1; i < 12; i++) { const [x, y, s] = ROAD(i / 12); ell(x + wob(i) * 30 * s, y, 10 * s, 3 * s, alpha('#8a6a44', 0.35), 0); }
}
// a strip of grass along y from x0 to x1, to sit a cut-out (the cottage) into the meadow
function foxGrassEdge(x0, x1, y, col, t) {
  ctx.beginPath(); ctx.moveTo(x0, y + 26);
  for (let x = x0; x <= x1; x += 9) ctx.lineTo(x, y - 6 - Math.abs(wob(x, 3)) * 9 + Math.sin(t * 1.3 + x * 0.04) * 1.5);
  ctx.lineTo(x1, y + 26); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = alpha('#3b2a24', 0.35); ctx.stroke();
}
// the little car that takes Mama away (and brings her back); facing right, wheels at y
function foxCar(x, y, s, t, moving, who = null) {
  push(x, y, 0, s, s);
  const b = moving ? Math.sin(t * 22) * 1.5 : 0;
  fpoly([-110, -36 + b, -104, -70 + b, -60, -74 + b, -40, -112 + b, 46, -112 + b, 74, -74 + b, 108, -66 + b, 114, -36 + b], FOX.dusty, 3);
  fpoly([-30, -104 + b, 0, -104 + b, 0, -76 + b, -50, -76 + b], '#d8e2e4', 2.4);
  fpoly([10, -104 + b, 40, -104 + b, 62, -76 + b, 10, -76 + b], '#d8e2e4', 2.4);
  if (who) { ctx.save(); ctx.beginPath(); ctx.rect(10, -104 + b, 52, 28); ctx.clip(); who(36, -76 + b); ctx.restore(); }
  frect(-112, -44 + b, 228, 10, FOX.cream, 2.2);
  fell(104, -56 + b, 7, 7, '#f6e2a6', 2);
  for (const wx of [-66, 70]) {
    fell(wx, -18, 22, 22, '#3f3530', 3); fell(wx, -18, 9, 9, '#c8b89a', 2);
    if (moving) fline(wx, -18, wx + Math.cos(t * 18) * 9, -18 + Math.sin(t * 18) * 9, 2.2);
  }
  pop();
}
// a frying pan (handle to the right), with what's in it drawn by inside()
function foxPan(x, y, s, rot = 0) {
  push(x, y, rot, s, s);
  line(56, -2, 130, -16, 12, '#3f3530', 2.6);
  fell(0, 0, 66, 16, '#4a3f3a', 3);
  fell(0, -3, 56, 11, '#2f2724', 0);
  pop();
}
function foxPancake(x, y, s, flip = 1, rot = 0, top = false) {
  push(x, y, rot, s, s * Math.max(0.12, Math.abs(flip)));
  fell(0, 0, 46, 13, flip > 0 ? '#e2b062' : '#d39a4c', 2.4);
  if (flip > 0) { fell(-12, -3, 9, 3, '#c9893f', 0); fell(14, 2, 7, 2.4, '#c9893f', 0); }
  if (top) { fell(4, -6, 14, 5, '#f4e0a8', 1.6); } // a little pat of butter
  pop();
}
function foxBowl(x, y, s, t, stir) {
  push(x, y, 0, s, s);
  // the spoon, behind the rim, going round when stirring
  const a = stir ? t * 9 : 0.5, sx = Math.cos(a) * 24, sy = Math.sin(a) * 6;
  line(sx, -26 + sy, sx * 1.6 + 24, -96, 7, '#b88a52', 2.4);
  fell(0, -26, 62, 16, '#f0dfb7', 2.6);
  fell(0, -26, 52, 11, '#ecd29a', 0); // the batter
  ctx.beginPath();
  for (let i = 0; i < 26; i++) { const r = i * 1.9, an = i * 0.6 + (stir ? t * 7 : 0); ctx.lineTo(Math.cos(an) * r, -26 + Math.sin(an) * r * 0.22); }
  ctx.lineWidth = 2; ctx.strokeStyle = '#c9a060'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-62, -26); ctx.bezierCurveTo(-58, 30, 58, 30, 62, -26); fpaint('#e8d6b0', 2.6);
  fline(-48, 2, 48, 2, 6, FOX.dusty);
  pop();
}
function foxPlate(x, y, n) {
  fell(x, y, 66, 14, '#f3e8d0', 2.4); fell(x, y - 1, 48, 9, '#e6d8bb', 0);
  for (let i = 0; i < n; i++) foxPancake(x + wob(i) * 3, y - 6 - i * 9, 0.9, 1, 0, i === n - 1);
}
function foxPineCone(x, y, s, rot = 0) {
  push(x, y, rot, s, s);
  fell(0, 0, 16, 24, '#8a5a3a', 2.4);
  for (let r = -16; r <= 16; r += 8) { fline(-14, r, 0, r + 5, 2); fline(14, r, 0, r + 5, 2); }
  line(0, -24, 2, -32, 4, '#6b4a30', 0);
  pop();
}
// a wrapped present: the lid never lifts. col: paper, rib: ribbon
function foxGift(x, y, w, h, col, rib, t, wig = 0, flutter = 0) {
  push(x, y, Math.sin(wig * 40) * 7 * clamp(wig * 3, 0, 1), 1, 1);
  const lh = h * 0.24;
  frect(-w / 2, -h, w, h, col, 3, x);
  fline(-w / 2 + 4, -h * 0.55, w / 2 - 4, -h * 0.55, 1.2, alpha('#3b2a24', 0.25));
  rect(-9, -h, 18, h, rib); fline(-9, -h, -9, 0, 1.6); fline(9, -h, 9, 0, 1.6);
  // the lid, a little wider, sitting on top for good
  frect(-w / 2 - 6, -h - lh + 6, w + 12, lh, shade(col, 0.08), 3, x + 3);
  rect(-9, -h - lh + 8, 18, lh - 4, rib); fline(-9, -h - lh + 7, -9, -h + 6, 1.6); fline(9, -h - lh + 7, 9, -h + 6, 1.6);
  // the bow: two loops and two tails, which flutter when tapped
  const f = Math.sin(t * 18) * 10 * flutter, by = -h - lh + 6;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, by);
    ctx.bezierCurveTo(d * 34, by - 34 - f * d, d * 46, by - 4 + f, 0, by); fpaint(rib, 2.4);
    ctx.beginPath(); ctx.moveTo(d * 4, by + 2); ctx.quadraticCurveTo(d * 18 + f * 0.6, by + 18, d * 26 + f, by + 26 - f * 0.4);
    ctx.lineWidth = 7; ctx.strokeStyle = FOX.ink; ctx.stroke(); ctx.lineWidth = 4.5; ctx.strokeStyle = rib; ctx.stroke();
  }
  fell(0, by, 8, 7, rib, 2.4);
  pop();
}
