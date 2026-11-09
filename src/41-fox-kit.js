// ---------- the Fox Family book: its kit ----------
// The second book shows only the supplied art: the family and every prop are cut
// out of the picture sheets (tools/fox_extract.py), then moved, flipped, swapped
// and timed here. Nothing is drawn in code; a page whose art hasn't arrived lists
// what it is waiting for instead.
const FOX = { ink: '#3b2a24', cream: '#f1e4c8', paper: '#f0e2c4', ochre: '#d3a046' };
const foxArt = n => art('fox-' + n);
// draws prop n (bottom centre at x,y, w wide) and returns its box [x0, y0, x1, y1]
function prop(n, x, y, w, flip = false, rot = 0) {
  const im = foxArt(n); if (!im) return [x - w / 2, y - w * 0.6, x + w / 2, y];
  pic(im, x, y, w, flip, rot);
  return [x - w / 2, y - w * im.naturalHeight / im.naturalWidth, x + w / 2, y];
}
// an animated painted background: its frames played forward then back (so the loop never jumps), fps frames a second.
// frame forces one frame (a night's own look). Returns false until the pictures have loaded.
function drawScene(name, n, t, fps = 6, frame = null) {
  let i = frame;
  if (i === null) { const k = Math.floor(t * fps) % (2 * n - 2); i = k < n ? k : 2 * n - 2 - k; }
  const im = art(`bg-fox-${name}-${i}`) || art(`bg-fox-${name}-0`);
  if (!im) return false;
  drawArt(im); return true;
}
const inBox = (b, x, y, pad = 0) => b && x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
const boxMid = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

// ---------- the family ----------
// Each character is a set of painted poses that all hang from the same foot point
// (FOX_POSES), so swapping poses never makes anyone jump. Idle life: breathing,
// a slight sway, and blinks where the art has a closed-eye picture (Papa and the
// twins; Mama's sheet has none, so she doesn't blink).
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
    ctx.translate(this.x, this.y + this.jy);
    ctx.rotate((this.lean + sway) * Math.PI / 180);
    ctx.scale(flip * s * (1 + this.squash), s * (1 + breath - this.squash));
    ctx.drawImage(im, -P[0], -P[1]);
    ctx.restore();
  }
}

// ---------- the pages share this ----------
// A FoxPage has up to three tricks, one per button; each also lives on the page
// as a thing to tap (spots()). Only supplied art is shown: where a picture hasn't
// arrived yet, the page says so in plain words (missing) instead of drawing it.
class FoxPage extends StoryPage {
  constructor(o) {
    super(Object.assign({ floor: 700 }, o));
    this.book = 'fox'; this.tried = new Set(); this.tap = null; this.glintI = 0;
    this.tricks = o.tricks.map(n => [n]); this.missing = o.missing || [];
  }
  press(k) { const n = this.tricks[k][0]; this.tried.add(n); this.lastTrick = n; super.press(k); this.tap = null; }
  // for the button pictures: each trick's best moment, in seconds after the tap
  peak() {
    const P = { suitcase: 0.3, twinsPerk: 0.45, calendar: 2.3, clothes: 0.35, socks: 0.75, pocket: 0.55, hugMama: 1.1, waveBye: 0.6,
      sleepNight: 1.0, door: 0.9, run: 2.1, together: 3, mamaHug: 1.5 };
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
  finish() {
    this.st.drawWords();
    if (this.missing.length) { // a plain note, not a picture: what art this page is still waiting for
      // (just under the story words, where nothing on the page covers it)
      ctx.font = '400 31px Andika, "Trebuchet MS", system-ui, sans-serif'; // (the story's lines are counted in the story's font)
      const y = (this.text ? 30 + wrapText(this.text, 1020).length * 42 : 0) + 34, msg = 'Art needed: ' + this.missing.join(' · ');
      ctx.font = '400 21px Andika, "Trebuchet MS", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(240,226,196,0.95)'; ctx.lineJoin = 'round'; ctx.strokeText(msg, W / 2, y);
      ctx.fillStyle = 'rgba(59,42,36,0.85)'; ctx.fillText(msg, W / 2, y);
    }
  }
  // a page with no background art yet: just the paper
  paper() { rect(0, 0, W, H, FOX.paper); }
  say(text, x, y, size = 46, col = FOX.cream) { this.st.say(text, x, y, size, col); }
}

