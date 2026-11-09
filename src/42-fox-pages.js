// ---------- the Fox Family book: Mama's three-sleep trip ----------
// Eight pages. Each has three things to tap (also the three buttons).

// ---------- 1. the big news (the kitchen) ----------
class FoxNewsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-news', music: 'morning', amb: 'fox-in',
      text: 'Mama has something to tell us. She has to go away for work. Three sleeps, and then she’ll come home!',
      tricks: ['suitcase', 'twinsPerk', 'calendar'], who: ['Suitcase', 'The twins', 'Calendar'],
      durs: { suitcase: 1.3, twinsPerk: 1.6, calendar: 5.2 } });
    this.papa = new Fox('papa', 850, 704, { face: -1 });
    this.mama = new Fox('mama', 1010, 700, { face: -1 });
    this.blue = new Fox('blue', 250, 708, { face: 1 });
    this.rust = new Fox('rust', 385, 714, { face: 1 });
    this.cast = [this.papa, this.mama, this.blue, this.rust];
    this.moons = 0;
  }
  spots() {
    return [
      { name: 'suitcase', box: this.caseBox },
      { name: 'twinsPerk', box: this.blue.box() }, { name: 'twinsPerk', box: this.rust.box() },
      { name: 'calendar', box: this.calBox },
    ];
  }
  act(a) {
    const st = this.st;
    if (a === 'suitcase') { sfx('thump', 0.7, 0.8); setTimeout(() => sfx('creak', 0.4, 1.3), 250); }
    if (a === 'twinsPerk') {
      // a tap on one cub wakes just that one; the button wakes both
      const who = this.tap ? [Math.abs(this.tap[0] - this.blue.x) < Math.abs(this.tap[0] - this.rust.x) ? this.blue : this.rust] : [this.blue, this.rust];
      who.forEach((c, i) => setTimeout(() => {
        c.say(i ? 'talk' : 'excited', 1.4); c.hop(26); c.squash = -0.1;
        const [hx, hy] = c.head(); this.say(c === this.blue ? '?' : '!', hx + 30, hy - 70, 58, FOX.ochre);
        sfx('boing', 0.35, 1.7 + i * 0.2);
      }, i * 160));
    }
    if (a === 'calendar') { this.moons = 0; }
  }
  tick(dt, t, A) {
    if (A.on('calendar')) {
      const k = A.t('calendar'), n = k < 0.3 ? 0 : k < 1.1 ? 1 : k < 1.9 ? 2 : 3;
      if (n !== this.moons) {
        this.moons = n; const [cx, cy] = boxMid(this.calBox), mx = this.calBox[0] + (this.calBox[2] - this.calBox[0]) * (0.24 + 0.27 * (n - 1));
        this.st.sparkles(mx, cy + 10, 8, 30, '#ffe7a0'); sfx('chime', 0.6, 1 + n * 0.12);
        this.say(['', 'One', 'Two', 'Three sleeps!'][n], n === 3 ? cx : mx, this.calBox[3] + 34, n === 3 ? 40 : 36, FOX.ochre);
        if (n === 3) { this.blue.say('excited', 1.6); this.rust.say('excited', 1.6); }
      }
    } else this.moons = 0;
  }
  draw() {
    const st = this.st, t = st.t, A = this.acts;
    const bg = art('bg-fox-kitchen'); if (bg) drawArt(bg); else rect(0, 0, W, H, '#e8d4b0');
    // the calendar hangs over the picture on the wall
    this.calBox = prop('calendar-' + this.moons, 482, 296, 152);
    st.draw(0);
    prop('table-set', 520, 640, 520);
    // the suitcase by the door: rocks from one corner to the other when tapped
    const wob = A.on('suitcase') ? A.t('suitcase') : -1;
    const tilt = wob < 0 ? '' : Math.sin(wob * 20) > 0 ? '-tilt-r' : '-tilt-l';
    const hop = wob < 0 ? 0 : Math.abs(Math.sin(wob * 20)) * 8 * (1 - wob / 1.3);
    this.caseBox = prop('suitcase' + tilt, 1160, 694 - hop, 168);
    for (const c of [this.papa, this.mama, this.rust, this.blue]) c.draw();
    this.finish();
  }
}

// ---------- 2. packing trouble (the bedroom) ----------
class FoxPackPage extends FoxPage {
  constructor() {
    super({ name: 'fox-pack', music: 'daycare', amb: 'fox-in',
      text: 'Mama needs clothes, her toothbrush, and her work things. But the twins think she needs a rubber duck and a pine cone too!',
      tricks: ['clothes', 'socks', 'pocket'], who: ['Clothes', 'Socks', 'Suitcase pocket'],
      durs: { clothes: 1.2, socks: 1.6, pocket: 1.4 } });
    this.mama = new Fox('mama', 1065, 708, { face: -1 });
    this.blue = new Fox('blue', 175, 716, { face: 1 });
    this.rust = new Fox('rust', 830, 716, { face: -1 });
    this.cast = [this.mama, this.blue, this.rust];
    this.packed = false;             // the clothes are in the case
    this.popped = [];                // what has come out of the pocket so far: 'duck', 'cone'
    this.fly = [];                   // things in the air: {n, x0,y0,x1,y1, t, dur, arc, s0, s1, then}
    this.CASE = [330, 500];          // the case on the bed, bottom centre
  }
  spots() {
    return [
      { name: 'clothes', box: this.packed ? this.caseInBox : this.clothesBox },
      { name: 'socks', box: this.socksBox },
      { name: 'pocket', box: this.pocketBox, glint: this.pocketBox && boxMid(this.pocketBox) },
    ];
  }
  focus() { // the case on the bed and the thing on its way in or out
    const B = { clothes: [430, 560, 800, 690], socks: [400, 600, 560, 720], pocket: [430, 380, 640, 500] }[this.lastTrick];
    return B ? [[150, 250], [520, 510], [B[0], B[1]], [B[2], B[3]]] : super.focus();
  }
  toss(n, x0, y0, x1, y1, dur, arc, w0, w1, then) { this.fly.push({ n, x0, y0, x1, y1, t: 0, dur, arc, w0, w1, then }); }
  act(a) {
    const [cx, cy] = this.CASE;
    if (a === 'clothes') {
      if (!this.packed) {
        this.toss('pack-sweaters', 610, 660, cx - 20, cy - 70, 0.7, 170, 150, 110, null);
        setTimeout(() => this.toss('pack-shirt', 720, 668, cx + 40, cy - 70, 0.7, 150, 120, 90, () => { this.packed = true; sfx('thump', 0.5, 1.3); }), 140);
        this.clothesOut = false; sfx('swoosh', 0.6, 1.3); this.mama.say('idle', 0.1);
      } else {
        this.packed = false; sfx('swoosh', 0.6, 1.1);
        this.toss('pack-sweaters', cx - 20, cy - 70, 610, 660, 0.7, 150, 110, 150, () => { this.clothesOut = true; });
        this.toss('pack-shirt', cx + 40, cy - 70, 720, 668, 0.75, 130, 90, 120, () => { this.clothesOut = true; });
      }
    }
    if (a === 'socks') {
      this.socksAway = true; sfx('swoosh', 0.5, 1.5);
      this.toss('pack-socks', 470, 696, cx, cy - 70, 0.55, 140, 90, 70, () => {
        sfx('boing', 0.8, 1.2); this.say('BOING!', cx + 20, cy - 190, 50, FOX.ochre);
        const lx = rnd(440, 520);
        this.toss('pack-socks', cx, cy - 70, lx, 696, 0.7, 210, 70, 90, () => { this.socksAway = false; this.socksX = lx; this.blue.say('joy', 1); this.rust.say('joy', 1); sfx('giggle', 0.5, 1.3); });
      });
    }
    if (a === 'pocket') {
      if (this.popped.length === 2) { // both are out: back into the pocket they go
        const [px, py] = boxMid(this.pocketBox);
        this.toss('pack-duck', 520, 470, px, py, 0.5, 90, 76, 30, null);
        this.toss('cone', 600, 476, px, py, 0.55, 110, 1, 0.4, null);
        this.popped = []; sfx('pop', 0.6, 0.8); return;
      }
      const what = this.popped.includes('duck') ? 'cone' : 'duck', [px, py] = boxMid(this.pocketBox);
      const [lx, ly] = what === 'duck' ? [520, 470] : [600, 476];
      this.toss(what === 'duck' ? 'pack-duck' : 'cone', px, py, lx, ly, 0.75, 170, 30, what === 'duck' ? 76 : 1, () => { this.popped.push(what); });
      sfx(what === 'duck' ? 'rubberduck' : 'pop', 0.9, 1.1);
      this.say(what === 'duck' ? 'SQUEAK!' : 'A PINE CONE?', px, py - 210, 42, FOX.ochre);
      setTimeout(() => { this.blue.say('cheer', 1); this.rust.say('cheer2', 1); sfx('giggle', 0.6, 1.2); }, 400);
    }
  }
  tick(dt) {
    for (const f of this.fly) { f.t += dt; if (f.t >= f.dur && !f.done) { f.done = true; f.then && f.then(); } }
    this.fly = this.fly.filter(f => !f.done);
  }
  flying(n) { return this.fly.some(f => f.n === n); }
  draw() {
    const st = this.st, t = st.t, [cx, cy] = this.CASE;
    const bg = art('bg-fox-bedroom'); if (bg) drawArt(bg); else rect(0, 0, W, H, '#e8d4b0');
    st.draw(0);
    // the case on the bed, and the work things beside it
    const caseB = prop(this.packed ? 'case-full' : 'case-open', cx, cy, 330);
    this.caseInBox = [caseB[0] + 30, caseB[1] + 90, caseB[2] - 30, caseB[3] - 60];
    this.pocketBox = [cx - 70, cy - 70, cx + 70, cy - 4];
    prop('pack-notebook', 95, 470, 92, false, -0.1);
    prop('pack-toothbrush', 905, 632, 74);
    prop('pack-thermos', 960, 640, 46);
    // what came out of the pocket waits on the quilt
    if (this.popped.includes('duck') && !this.flying('pack-duck')) prop('pack-duck', 520, 470, 76);
    if (this.popped.includes('cone') && !this.flying('cone')) foxPineCone(600, 452, 1, 0.5);
    // the clothes pile on the floor (unless packed or on the way)
    if (!this.packed && !this.flying('pack-sweaters') && !this.flying('pack-shirt')) {
      const a = prop('pack-sweaters', 610, 660, 150), b = prop('pack-shirt', 720, 668, 120);
      this.clothesBox = [a[0], Math.min(a[1], b[1]), b[2], a[3]];
    }
    if (!this.socksAway) this.socksBox = prop('pack-socks', this.socksX || 470, 696, 90, false, 0.08);
    for (const c of [this.blue, this.rust, this.mama]) c.draw();
    // things in the air, over everyone
    for (const f of this.fly) {
      const k = clamp(f.t / f.dur, 0, 1), x = lerp(f.x0, f.x1, k), y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * f.arc;
      if (f.n === 'cone') foxPineCone(x, y - 20, lerp(f.w0, f.w1, k), k * 8);
      else prop(f.n, x, y, lerp(f.w0, f.w1, k), false, Math.sin(k * Math.PI) * 0.5);
    }
    this.finish();
  }
}

// ---------- 3. goodbye for now (outside the cottage) ----------
const COTTAGE = { x: 370, y: 612, w: 760 };
const DOOR = [396, 346, 528, 560]; // the doorway on the page, when the cottage is drawn at COTTAGE
class FoxByePage extends FoxPage {
  constructor() {
    super({ name: 'fox-bye', music: 'station', amb: 'fox-out',
      text: 'One hug. Two hugs. Three enormous hugs! Goodbye, Mama. See you after three sleeps!',
      tricks: ['hugMama', 'waveBye', 'drive'], who: ['Mama', 'The twins', 'The car'],
      durs: { hugMama: 2.6, waveBye: 1.8, drive: 5.2 } });
    this.papa = new Fox('papa', 470, 700, { face: 1, h: 330 });
    this.blue = new Fox('blue', 610, 706, { face: 1, h: 190 });
    this.rust = new Fox('rust', 705, 708, { face: 1, h: 190 });
    this.mama = new Fox('mama', 845, 696, { face: -1, h: 307 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.hugs = 0;
  }
  // the cubs come first: one may be standing in front of Mama, hugging her
  spots() { return [{ name: 'waveBye', box: this.blue.box() }, { name: 'waveBye', box: this.rust.box() }, { name: 'hugMama', box: this.mama.hidden ? null : this.mama.box() }, { name: 'drive', box: this.carBox }]; }
  act(a) {
    if (a === 'hugMama') {
      // one cub at a time runs for a hug, then goes back
      const c = this.hugs++ % 2 ? this.rust : this.blue, home = c.x;
      c.moveTo(this.mama.x - 70, c.y, 0.5, 18);
      setTimeout(() => { c.say('joy', 1.2); c.leanTo = 8; this.mama.leanTo = -5; this.hearts(this.mama.x - 40, 470, 5); sfx('hug', 0.8); this.say(['One hug!', 'Two hugs!', 'Three enormous hugs!'][Math.min(this.hugs - 1, 2)], 760, 330, 40, FOX.cream); }, 520);
      setTimeout(() => { c.leanTo = 0; this.mama.leanTo = 0; c.moveTo(home, c.y, 0.6, 14); }, 1750);
      setTimeout(() => { c.face = 1; }, 2400);
    }
    if (a === 'waveBye') {
      this.blue.wave = 1.6; this.rust.wave = 1.6; this.papa.say('laugh', 1.4);
      this.say('Bye-bye, Mama!', 660, 380, 44, FOX.cream); sfx('giggle', 0.5, 1.1);
    }
    if (a === 'drive') { this.mama.hidden = true; sfx('engine', 0.6); setTimeout(() => sfx('toot', 0.5, 1.3), 400); }
  }
  tick(dt, t, A) { if (!A.on('drive') && this.mama.hidden) { this.mama.hidden = false; this.mama.alpha = 0; } if (this.mama.alpha < 1) this.mama.alpha = Math.min(1, this.mama.alpha + dt * 2.5); }
  draw() {
    const st = this.st, t = st.t, A = this.acts;
    foxCountry(t, 0);
    // the car: drives off along the road, out of sight, and comes back for next time
    let k = 0, a = 1;
    if (A.on('drive')) { const d = A.t('drive'); k = clamp((d - 0.5) / 3.2, 0, 1); a = d > 4.2 ? clamp((d - 4.2) / 0.8, 0, 1) : k > 0.92 ? 1 - (k - 0.92) / 0.08 : 1; if (d > 4.2) k = 0; }
    const tt = lerp(0.5, 1, ease(k)), [rx, ry, rs] = ROAD(tt);
    ctx.save(); ctx.globalAlpha = a;
    const inCar = A.on('drive') && A.t('drive') < 4.2 ? (x, y) => { const im = foxArt('mama-idle'); if (im) { const P = FOX_POSES['mama-idle']; ctx.save(); ctx.translate(x, y + 30); ctx.scale(0.28, 0.28); ctx.drawImage(im, -P[0], -P[1] + 140); ctx.restore(); } } : null;
    foxCar(rx, ry, rs * 0.9, t, k > 0 && k < 1, inCar);
    ctx.restore();
    this.carBox = [rx - 110 * rs, ry - 120 * rs, rx + 110 * rs, ry];
    if (A.on('drive') && k > 0.05 && k < 0.9 && this.every('wave', 0.6)) this.say('Bye!', rx, ry - 150 * rs, 30, FOX.cream);
    st.draw(0);
    prop('cottage', COTTAGE.x, COTTAGE.y, COTTAGE.w);
    foxGrassEdge(-10, 770, COTTAGE.y - 2, '#aeaa68', t);
    prop('robin', 1170, 250, 250, true);
    for (const c of [this.papa, this.blue, this.rust, this.mama]) c.draw();
    if (!this.mama.hidden) prop('suitcase', 932, 694, 104);
    prop('hydrangea', 100, 742, 260);
    foxGrass([40, 290, 560, 760, 1040, 1230], 718, t);
    this.finish();
  }
}

// ---------- 4. Mama's adventure (the city) ----------
const CITY_WIN = (() => { // the windows animals can pop out of: [x, y] of each window's bottom centre
  const w = [];
  for (const [bx, cols, rows, top] of [[60, 2, 3, 180], [330, 3, 3, 150], [640, 2, 4, 120], [860, 3, 3, 170], [1110, 2, 3, 200]])
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) w.push([bx + 40 + c * 62, top + 70 + r * 66]);
  return w;
})();
const CITY_ANIMALS = ['rabbit', 'owl', 'cat', 'mouse', 'hedgehog', 'duck'];
function cityAnimal(kind, x, y, k) { // a head peeping up from a window sill at x,y; k 0..1 how far up
  ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 48, 40, 48); ctx.clip();
  push(x, y + (1 - k) * 56, 0, 1.2, 1.2);
  const fur = { rabbit: '#d9cbb5', owl: '#9a7a52', cat: '#c98a4a', mouse: '#a9a39a', hedgehog: '#8a6a4a', duck: '#e8c24e' }[kind];
  if (kind === 'rabbit') { fell(-8, -44, 5, 14, fur, 2); fell(8, -44, 5, 14, fur, 2); }
  if (kind === 'cat') { fpoly([-16, -32, -12, -48, -4, -36], fur, 2); fpoly([16, -32, 12, -48, 4, -36], fur, 2); }
  if (kind === 'mouse') { fell(-14, -36, 9, 9, fur, 2); fell(14, -36, 9, 9, fur, 2); }
  if (kind === 'hedgehog') for (let i = -3; i <= 3; i++) fpoly([i * 6 - 4, -30, i * 6, -46, i * 6 + 4, -30], '#5f4632', 1.5);
  fell(0, -22, 18, 16, fur, 2.4);
  if (kind === 'owl') { fell(-7, -24, 6, 6, '#f1e4c8', 1.6); fell(7, -24, 6, 6, '#f1e4c8', 1.6); fpoly([-3, -18, 3, -18, 0, -13], FOX.ochre, 1.4); }
  if (kind === 'duck') fell(10, -18, 9, 4, '#d48a3a', 1.6);
  circ(-6, -24, 2.2, FOX.ink, 0); circ(6, -24, 2.2, FOX.ink, 0);
  pop(); ctx.restore();
}
class FoxCityPage extends FoxPage {
  constructor() {
    super({ name: 'fox-city', music: 'office', amb: 'fox-city',
      text: 'Far away, Mama visits a busy city. There are tall buildings, important meetings, and a very serious bear wearing a tiny tie.',
      tricks: ['train', 'windows', 'tie'], who: ['The train', 'Windows', 'The bear'],
      durs: { train: 4.2, windows: 1.6, tie: 1.6 } });
    this.mama = new Fox('mama', 250, 714, { face: 1, h: 360 });
    this.cast = [this.mama];
    this.peeks = []; // {i, kind, t}
    this.trainX = 300;
  }
  spots() {
    const s = [{ name: 'train', box: [this.trainX - 300, 380, this.trainX + 20, 470] }, { name: 'tie', box: [870, 340, 1100, 712] }];
    CITY_WIN.forEach((w, i) => s.push({ name: 'windows', box: [w[0] - 22, w[1] - 50, w[0] + 22, w[1]], pad: 4, glint: i === 7 ? [w[0], w[1] - 25] : null }));
    return s.filter(x => x.name !== 'windows' || x.glint || this.tried.has('windows') || true);
  }
  focus() { // the window with someone in it, rather than all of them
    if (this.lastTrick !== 'windows') return super.focus();
    return this.peeks.flatMap(pk => { const [x, y] = CITY_WIN[pk.i]; return [[x - 60, y - 90], [x + 60, y + 20]]; });
  }
  act(a) {
    if (a === 'train') { sfx('choo', 0.6); setTimeout(() => sfx('chug', 0.5), 300); }
    if (a === 'windows') {
      let i = irnd(CITY_WIN.length);
      if (this.tap) i = CITY_WIN.findIndex(w => Math.abs(w[0] - this.tap[0]) < 26 && this.tap[1] > w[1] - 54 && this.tap[1] < w[1] + 4);
      if (i < 0) i = irnd(CITY_WIN.length);
      const kind = pick(CITY_ANIMALS);
      this.peeks = this.peeks.filter(p => p.i !== i); this.peeks.push({ i, kind, t: 0 });
      sfx(kind === 'owl' ? 'hoo' : kind === 'duck' ? 'quack' : kind === 'cat' ? 'meow' : 'squeak', 0.5, 1.2);
    }
    if (a === 'tie') { sfx('whee', 0.5, 1.6); this.say('Ahem.', 980, 300, 36, FOX.cream); }
  }
  tick(dt, t, A) {
    for (const p of this.peeks) p.t += dt; this.peeks = this.peeks.filter(p => p.t < 1.8);
    if (A.on('train')) { const k = A.t('train') / 4.2; this.trainX = k < 0.5 ? lerp(300, 1700, ease(k * 2)) : lerp(-500, 300, ease((k - 0.5) * 2)); }
    if (this.every('pigeon', 7)) sfx('coo', 0.15, 1);
  }
  building(x, w, top, col, roof) {
    frect(x, top, w, 470 - top, col, 2.6, x);
    if (roof === 'gable') fpoly([x - 8, top, x + w / 2, top - 50, x + w + 8, top], FOX.rust, 2.6);
    if (roof === 'flat') frect(x - 6, top - 12, w + 12, 14, shade(col, -0.15), 2.4);
    if (roof === 'dome') { ctx.beginPath(); ctx.ellipse(x + w / 2, top, w * 0.3, 40, 0, Math.PI, 0); fpaint('#8aa2a0', 2.6); }
  }
  draw() {
    const st = this.st, t = st.t, A = this.acts;
    rect(0, 0, W, 470, grad(0, 0, 0, 470, ['#cfd6d0', '#ece2c8']));
    foxCloud(300 + t * 4, 150, 1); foxCloud(900 + t * 3, 110, 0.8);
    // far skyline
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let i = 0; i < 14; i++) frect(i * 96 - 20, 230 + wob(i) * 40, 80, 300, '#a7b3b4', 1.4, i);
    ctx.restore();
    // the near buildings, each with windows
    const B = [[60, 160, 180, '#d9b98a', 'gable'], [330, 220, 150, '#c97a55', 'flat'], [640, 160, 120, '#e3d3ae', 'dome'], [860, 220, 170, FOX.sage, 'flat'], [1110, 160, 200, '#d6a65e', 'gable']];
    for (const [x, w, top, col, roof] of B) this.building(x, w, top, col, roof);
    CITY_WIN.forEach(([x, y], i) => {
      frect(x - 20, y - 48, 40, 48, '#f3e4bd', 2, i);
      const p = this.peeks.find(p => p.i === i);
      if (p) cityAnimal(p.kind, x, y, clamp(Math.min(p.t * 5, (1.8 - p.t) * 4), 0, 1));
      fline(x - 20, y - 24, x + 20, y - 24, 2); fline(x, y - 48, x, y, 2);
      frect(x - 24, y - 2, 48, 6, '#cbb48a', 2, i + 3);
    });
    // the railway bridge and the train
    rect(0, 470, W, 30, '#b9a27a'); fline(0, 470, W, 470, 2.6); fline(0, 500, W, 500, 2.6);
    for (let x = 30; x < W; x += 160) { ctx.beginPath(); ctx.ellipse(x + 50, 500, 50, 40, 0, Math.PI, 0); fpaint('#9d8a68', 2.4); }
    const tx = this.trainX, bob = A.on('train') ? Math.sin(t * 24) * 1.2 : 0;
    for (let c = 0; c < 2; c++) {
      const x0 = tx - 300 + c * 160;
      frect(x0, 404 + bob, 150, 62, c ? FOX.cream : FOX.rust, 3, c + 9);
      for (let w = 0; w < 3; w++) fell(x0 + 30 + w * 45, 428 + bob, 13, 13, '#e9eef0', 2.2);
      fell(x0 + 30, 470, 9, 9, '#3f3530', 2); fell(x0 + 120, 470, 9, 9, '#3f3530', 2);
    }
    fpoly([tx + 10, 404 + bob, tx + 30, 420 + bob, tx + 30, 466 + bob, tx + 10, 466 + bob], FOX.rust, 3);
    fell(tx + 26, 442 + bob, 5, 5, '#f6e2a6', 1.6);
    if (A.on('train') && this.every('steam', 0.2)) st.puff(tx - 10, 396, 14, '#efe7da', 0);
    // the street
    rect(0, 500, W, H - 500, grad(0, 500, 0, H, ['#c8b897', '#b2a17e']));
    for (let x = 0; x < W; x += 90) fline(x, 600, x + 40, 600, 2, alpha('#3b2a24', 0.3));
    st.draw(0);
    this.drawBear(980, 712, t, A);
    this.mama.draw();
    prop('suitcase', 380, 712, 110);
    this.finish();
  }
  // the very serious bear: a big brown suit, a straight mouth, and a tiny red tie
  drawBear(x, y, t, A) {
    const br = Math.sin(t * 1.8) * 1.5;
    push(x, y);
    ell(0, 2, 90, 12, 'rgba(42,26,16,0.18)', 0);
    fell(-44, -20, 30, 18, '#4f3a2c', 2.6); fell(44, -20, 30, 18, '#4f3a2c', 2.6); // feet
    fpoly([-88, -40, -96, -210 + br, -60, -250 + br, 60, -250 + br, 96, -210 + br, 88, -40], '#5e6a74', 3); // the suit
    fpoly([-30, -250 + br, 0, -170 + br, 30, -250 + br], '#efe7d6', 2.4); // the shirt
    fell(-96, -150, 22, 60, '#5e6a74', 2.6, 0.12); fell(96, -150, 22, 60, '#5e6a74', 2.6, -0.12);
    // the briefcase
    frect(84, -120, 58, 44, '#6b4a30', 2.6); fline(102, -120, 102, -130, 3); fline(124, -120, 124, -130, 3); fline(102, -130, 124, -130, 3);
    // the head
    fell(-56, -342 + br, 22, 22, FOX.brown, 2.6); fell(56, -342 + br, 22, 22, FOX.brown, 2.6);
    fell(0, -300 + br, 74, 66, FOX.brown, 3);
    fell(0, -280 + br, 32, 24, '#c9a27a', 2.2);
    fell(0, -292 + br, 10, 7, FOX.ink, 0);
    fline(-12, -268 + br, 12, -268 + br, 3); // a very serious mouth
    fell(-28, -318 + br, 5, 5, FOX.ink, 0); fell(28, -318 + br, 5, 5, FOX.ink, 0);
    fline(-40, -334 + br, -16, -330 + br, 3.2); fline(40, -334 + br, 16, -330 + br, 3.2);
    // the tiny tie: spins round and flutters when tapped
    const k = A.on('tie') ? A.t('tie') / 1.6 : 0, spin = k ? Math.sin(k * Math.PI) * TAU * 2.2 : 0;
    push(0, -246 + br, spin * 57.3 * (1 - k) + Math.sin(t * 30) * 12 * (k > 0 ? 1 - k : 0));
    fpoly([-6, 0, 6, 0, 3, 6, -3, 6], '#b5432f', 2);
    fpoly([-3, 6, 3, 6, 6, 26 + Math.sin(t * 40) * 3 * (k ? 1 : 0), 0, 32, -6, 26], '#b5432f', 2);
    pop();
    pop();
  }
}

// ---------- 5. adventures with Papa (pancakes in the kitchen) ----------
class FoxPancakePage extends FoxPage {
  constructor() {
    super({ name: 'fox-pancakes', music: 'dinner', amb: 'fox-in',
      text: 'Back home, Papa and the twins make pancakes. One lands on a plate. Another lands somewhere rather surprising!',
      tricks: ['flip', 'stir', 'onHead'], who: ['Frying pan', 'Mixing bowl', 'Papa'],
      durs: { flip: 1.3, stir: 1.8, onHead: 4.6 } });
    this.papa = new Fox('papa', 780, 704, { face: -1, pose: 'happy' });
    this.blue = new Fox('blue', 250, 646, { face: 1 });
    this.rust = new Fox('rust', 420, 650, { face: 1 });
    this.cast = [this.papa, this.blue, this.rust];
    this.PAN = [612, 540]; this.plate = 1; this.flips = 0; this.toPlate = false;
  }
  spots() { return [{ name: 'flip', box: [this.PAN[0] - 80, this.PAN[1] - 40, this.PAN[0] + 120, this.PAN[1] + 30] }, { name: 'stir', box: [330 - 80, 430, 330 + 80, 560] }, { name: 'onHead', box: this.papa.box() }]; }
  act(a) {
    if (a === 'flip') { this.toPlate = ++this.flips % 2 === 0; sfx('flip', 0.8); this.say('FLIP!', this.PAN[0] - 40, 260, 44, FOX.ochre); }
    if (a === 'stir') { sfx('swoosh', 0.4, 1.6); setTimeout(() => sfx('swoosh', 0.4, 1.8), 500); setTimeout(() => sfx('blub', 0.4), 1100); this.say('swish swish', 330, 360, 34, FOX.cream); }
    if (a === 'onHead') { sfx('flip', 1, 0.9); }
  }
  tick(dt, t, A) {
    if (this.at('flip', 1.1)) {
      if (this.toPlate) { this.plate = this.plate >= 4 ? 1 : this.plate + 1; sfx('thump', 0.5, 1.5); this.blue.say('excited', 0.9); }
      else sfx('tap', 0.6);
    }
    if (this.at('onHead', 1.2)) { sfx('splat', 0.7, 1.3); this.papa.say('oh', 1.4); this.say('PLOP!', this.papa.x, 230, 52, FOX.ochre); }
    if (this.at('onHead', 1.9)) {
      this.papa.say('laugh', 2); this.blue.say('joy', 2.2); this.rust.say('cheer', 2.2); this.blue.hop(22); setTimeout(() => this.rust.hop(22), 150);
      this.say('HA HA HA!', 340, 330, 46, FOX.cream); sfx('giggle', 1, 1.1);
    }
  }
  draw() {
    const st = this.st, t = st.t, A = this.acts, [px, py] = this.PAN;
    const bg = art('bg-fox-kitchen'); if (bg) drawArt(bg); else rect(0, 0, W, H, '#e8d4b0');
    st.draw(0);
    // the twins stand behind the little table, the bowl and the plate on top
    this.blue.draw(); this.rust.draw();
    prop('table', 360, 704, 330);
    foxBowl(300, 548, 1, t, A.on('stir'));
    if (A.on('stir') && this.every('drip', 0.35)) st.add({ kind: 'crumb', layer: 2, x: 300 + rnd(-30, 30), y: 515, vx: rnd(-60, 60), vy: rnd(-140, -80), size: 4, col: '#ecd29a', life: 0.7, g: 600 });
    foxPlate(450, 552, this.plate);
    this.papa.draw();
    // the pancake on Papa's head
    const H0 = A.on('onHead') ? A.t('onHead') : -1, [hx, hy] = this.papa.head(), headTop = hy - this.papa.h * 0.12;
    // the pan in Papa's hand, the pancake inside or in the air
    const pk = A.on('flip') ? A.t('flip') / 1.1 : H0 >= 0 && H0 < 1.2 ? H0 / 1.2 : -1;
    const lift = A.on('flip') ? Math.sin(Math.min(pk, 1) * Math.PI) * 6 : 0;
    foxPan(px, py - lift, 1, -6 + lift);
    if (pk >= 0 && pk < 1) { // in the air, turning over
      const toX = A.on('flip') ? (this.toPlate ? 450 : px) : hx, toY = A.on('flip') ? (this.toPlate ? 540 : py - 6) : headTop;
      const x = lerp(px, toX, pk), y = lerp(py - 6, toY, pk) - Math.sin(pk * Math.PI) * (A.on('flip') ? 290 : 200);
      foxPancake(x, y, 1, Math.cos(pk * TAU * 1.5), pk * 40);
    } else if (!(H0 >= 1.2)) foxPancake(px, py - 6, 0.95, 1);
    if (H0 >= 1.2) { // on his head, then sliding off onto the plate
      const s = clamp((H0 - 3.8) / 0.8, 0, 1);
      foxPancake(lerp(hx, 450, s), lerp(headTop + 4, 540, ease(s)) - Math.sin(s * Math.PI) * 60, 1.15, 1, (1 - s) * Math.sin(t * 3) * 6);
      if (s >= 1 && !this.slid) { this.slid = true; this.plate = Math.min(4, this.plate + 1); }
    } else this.slid = false;
    if (A.on('flip') || A.on('onHead')) { if (this.every('sz', 0.25)) st.puff(px + rnd(-30, 30), py - 20, 8, '#f1ece2', 2); }
    this.finish();
  }
}

// ---------- 6. three sleeps (the twins' bedroom at night) ----------
const WIN = [578, 0, 812, 268]; // the window glass on the bedroom picture
class FoxSleepsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-sleeps', music: 'tuck', amb: 'fox-night',
      text: 'At night, the twins look at the moon. “Mama can see that moon too,” says Papa. One sleep, two sleeps, three sleeps...',
      tricks: ['curtains', 'stars', 'sleepNight'], who: ['Curtains', 'Stars', 'The moon'],
      durs: { curtains: 1.2, stars: 1.6, sleepNight: 6.4 } });
    this.blue = new Fox('blue', 225, 470, { face: 1, h: 210 });
    this.rust = new Fox('rust', 380, 474, { face: 1, h: 210 });
    this.papa = new Fox('papa', 690, 712, { face: -1 });
    for (const c of [this.blue, this.rust]) c.shadow = false;
    this.cast = [this.papa, this.blue, this.rust];
    this.open = 0; this.openTo = 0; this.nights = 0;
    this.stars = Array.from({ length: 16 }, (_, i) => ({ x: lerp(WIN[0] + 12, WIN[2] - 12, (i * 0.618) % 1), y: lerp(140, WIN[3] - 70, (i * 0.37) % 1), ph: i * 1.7, r: 2 + (i % 3) }));
  }
  spots() {
    if (this.openTo < 0.5) return [{ name: 'curtains', box: [WIN[0] - 20, 130, WIN[2] + 20, WIN[3]] }, { name: 'sleepNight', box: this.calBox }];
    const [mx, my] = this.moonAt();
    return [
      { name: 'sleepNight', box: [mx - 40, my - 40, mx + 40, my + 40] }, { name: 'sleepNight', box: this.calBox },
      { name: 'curtains', box: [WIN[0] - 34, 130, WIN[0] + 20, WIN[3]] }, { name: 'curtains', box: [WIN[2] - 20, 130, WIN[2] + 34, WIN[3]] },
      { name: 'stars', box: [WIN[0] + 20, 130, WIN[2] - 20, WIN[3] - 20], glint: [WIN[2] - 40, 165] },
    ];
  }
  // a night, once begun, always finishes (a second tap mid-night would otherwise start it over, and
  // little hands tap twice): the countdown only ever moves forward
  press(k) { if (this.tricks[k][0] === 'sleepNight' && this.acts.on('sleepNight')) return; super.press(k); }
  // the moon's place in the window: low on the left at dusk, high in the middle, setting on the right
  moonAt() { const k = this.moonK ?? 0.35; return [lerp(WIN[0] + 30, WIN[2] - 30, k), 230 - Math.sin(k * Math.PI) * 70]; }
  act(a) {
    if (a === 'curtains') { this.openTo = this.openTo > 0.5 ? 0 : 1; sfx('swoosh', 0.5, 0.8); }
    if (a === 'stars') { this.openTo = 1; sfx('shimmer', 0.6, 1.2); this.stars.forEach(s => { s.burst = rnd(0, 0.5); }); }
    if (a === 'sleepNight') {
      if (this.nights >= 3) this.nights = 0; // start the countdown again
      this.openTo = 1; this.night = this.nights + 1;
      this.papa.say('talk', 1.6); this.say('Mama can see that moon too.', 640, 330, 32, FOX.cream);
    }
  }
  tick(dt, t, A) {
    this.open += (this.openTo - this.open) * Math.min(1, dt * 4);
    for (const s of this.stars) if (s.burst !== undefined) { s.burst += dt; if (s.burst > 1.6) s.burst = undefined; }
    // one night: Mama looks at the moon too (0 - 1.8), the twins sleep and the moon crosses (1.8 - 4.6),
    // morning comes and a moon on the calendar lights up (4.6 - 6.4)
    if (A.on('sleepNight')) {
      const k = A.t('sleepNight');
      this.moonK = k < 1.8 ? 0.35 : k < 4.6 ? lerp(0.35, 1.15, (k - 1.8) / 2.8) : 0.35;
      const asleep = k > 1.8 && k < 4.6;
      for (const c of [this.blue, this.rust]) c.base = asleep ? 'joy' : 'idle';
      if (this.at('sleepNight', 1.9)) { sfx('yawn', 0.5); this.say('Zzz', 160, 250, 40, FOX.cream); }
      if (asleep && this.every('z', 0.9)) this.st.add({ kind: 'z', layer: 2, x: 170, y: 290, vx: 20, vy: -30, rot: 0, size: rnd(22, 30), col: FOX.cream, life: 2.6 });
      if (this.at('sleepNight', 4.6)) {
        this.nights = this.night; sfx('chime', 0.8, 1 + this.nights * 0.12);
        const [cx, cy] = boxMid(this.calBox); this.st.sparkles(cx, cy, 10, 50, '#ffe7a0');
        this.say(['', 'One sleep!', 'Two sleeps!', 'Three sleeps! Mama comes home today!'][this.nights], 640, 330, this.nights === 3 ? 36 : 44, FOX.ochre);
        if (this.nights === 3) { this.blue.wave = 2; this.rust.wave = 2; sfx('giggle', 0.8, 1.2); }
      }
    } else { this.moonK = 0.35; this.blue.base = this.rust.base = 'idle'; }
  }
  sky() { // night (0) to morning (1) in the window
    const A = this.acts; if (!A.on('sleepNight')) return 0;
    const k = A.t('sleepNight'); return k < 4.2 ? 0 : k < 4.8 ? (k - 4.2) / 0.6 : k < 5.9 ? 1 : 1 - (k - 5.9) / 0.5;
  }
  draw() {
    const st = this.st, t = st.t, A = this.acts, day = clamp(this.sky(), 0, 1), night = this.night || this.nights || 1;
    const bg = art('bg-fox-bedroom'); if (bg) drawArt(bg); else rect(0, 0, W, H, '#e8d4b0');
    // the room at night: blue dark over everything but the window
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1 - day * 0.6;
    rect(0, 0, W, H, '#5b6994'); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.25 * (1 - day); rect(0, 0, W, H, '#1c2340'); ctx.restore();
    // the window: the sky, the moon and the stars (each night a little different)
    ctx.save(); ctx.beginPath(); ctx.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]); ctx.clip();
    rect(WIN[0], 0, WIN[2] - WIN[0], WIN[3], grad(0, 0, 0, WIN[3], day > 0 ? [alpha('#f2c99a', day), alpha('#f6e4bd', day)] : ['#1d2748', '#34406a']));
    if (day < 1) {
      ctx.globalAlpha = 1 - day;
      rect(WIN[0], 0, WIN[2] - WIN[0], WIN[3], grad(0, 0, 0, WIN[3], ['#1d2748', '#3a4672']));
      for (const s of this.stars) {
        const b = s.burst !== undefined ? Math.sin(Math.min(1, s.burst / 1.6) * Math.PI) : 0;
        const tw = 0.55 + 0.45 * Math.sin(t * 2 + s.ph), r = s.r * (1 + b * 1.6);
        star(s.x, s.y, r * 2.2, t * 0.3 + s.ph, 4, alpha('#fff2c0', tw), 0); if (b > 0.2) glow(s.x, s.y, r * 8, '#fff2c0', b * 0.5);
      }
      const [mx, my] = this.moonAt();
      glow(mx, my, 90, '#fff2c8', 0.35);
      fell(mx, my, 30, 30, '#f6ebc6', 2.2);
      // night one a crescent, night two a half moon, night three round and full
      if (night < 3) { ctx.beginPath(); ctx.arc(mx + (night === 1 ? 14 : 30), my - 4, 30, 0, TAU); ctx.fillStyle = '#2a3558'; ctx.fill(); }
      if (night === 3) { fell(mx - 8, my - 6, 6, 5, '#e3d6a8', 0); fell(mx + 9, my + 8, 4, 4, '#e3d6a8', 0); }
      // night two an owl on the sill; night three a shooting star
      if (night === 2) { fell(WIN[2] - 40, WIN[3] - 22, 16, 20, '#4a3f3a', 2); circ(WIN[2] - 46, WIN[3] - 28, 3, '#f6e2a6', 0); circ(WIN[2] - 34, WIN[3] - 28, 3, '#f6e2a6', 0); }
      if (night === 3 && (t % 4) < 0.8) { const k = (t % 4) / 0.8; fline(WIN[0] + 40 + k * 140, 150 + k * 50, WIN[0] + 10 + k * 140, 140 + k * 50, 2.4, '#fff2c0'); }
      ctx.globalAlpha = 1;
    } else { glow(WIN[2] - 50, WIN[3] - 20, 120, '#ffd27a', 0.6); }
    ctx.restore();
    // the window bars over the sky
    fline((WIN[0] + WIN[2]) / 2, 0, (WIN[0] + WIN[2]) / 2, WIN[3], 9, '#6d4a2c');
    fline(WIN[0], 135, WIN[2], 135, 9, '#6d4a2c');
    // moonlight on the floor
    if (day < 1 && this.open > 0.2) { ctx.save(); ctx.globalAlpha = 0.18 * this.open * (1 - day); fpoly([WIN[0] + 10, WIN[3], WIN[2] - 10, WIN[3], 980, H, 420, H], '#e8edf8', 0); ctx.restore(); }
    // the curtains: drawn shut over the window until tapped
    const half = (WIN[2] - WIN[0]) / 2 + 12, cw = lerp(half, 26, this.open);
    for (const d of [-1, 1]) {
      const edge = d < 0 ? WIN[0] - 12 : WIN[2] + 12, x0 = d < 0 ? edge : edge - cw;
      frect(x0, 128, cw, WIN[3] - 118, '#7b88a8', 2.6, d + 5);
      for (let i = 1; i < 5; i++) fline(x0 + cw * i / 5, 132, x0 + cw * i / 5 + wob(i) * 4, WIN[3] + 6, 1.6, alpha('#3b2a24', 0.4));
    }
    fline(WIN[0] - 40, 130, WIN[2] + 40, 130, 6, '#6d4a2c');
    // the countdown calendar on the wall
    this.calBox = prop('calendar-' + this.nights, 348, 290, 150);
    if (this.nights === 0 && !A.on('sleepNight')) { /* nothing lit yet */ }
    st.draw(0);
    // the twins sit up in bed under the patchwork quilt (drawn down to their tummies, then the quilt's edge)
    const qy = 404;
    ctx.save(); if (day < 1) ctx.filter = `brightness(${lerp(0.62, 1, day)}) saturate(${lerp(0.75, 1, day)})`;
    this.blue.draw(qy + 6); this.rust.draw(qy + 6);
    ctx.restore();
    // the sheet turned down over the quilt, tucked across their laps
    ctx.save(); if (day < 1) ctx.filter = `brightness(${lerp(0.62, 1, day)}) saturate(${lerp(0.75, 1, day)})`;
    const top = x => qy - 2 + Math.sin(x * 0.045) * 3 - Math.exp(-Math.pow((x - 225) / 50, 2)) * 9 - Math.exp(-Math.pow((x - 380) / 50, 2)) * 9;
    ctx.beginPath(); ctx.moveTo(118, top(118));
    for (let x = 126; x <= 530; x += 8) ctx.lineTo(x, top(x));
    for (let x = 530; x >= 118; x -= 8) ctx.lineTo(x, top(x) + 30 + Math.sin(x * 0.07) * 2);
    ctx.closePath(); fpaint('#efe3c8', 2.6);
    for (const x of [200, 300, 420]) fline(x, top(x) + 6, x + 10, top(x) + 26, 1.4, alpha('#3b2a24', 0.35)); // folds
    ctx.restore();
    ctx.save(); if (day < 1) ctx.filter = `brightness(${lerp(0.62, 1, day)}) saturate(${lerp(0.75, 1, day)})`;
    this.papa.draw(); ctx.restore();
    // Mama far away looks at the same moon from her window (the first part of each night)
    const mk = A.on('sleepNight') ? A.t('sleepNight') : -1;
    if (mk >= 0 && mk < 2.2) this.drawMamaWindow(clamp(Math.min(mk * 3, (2.2 - mk) * 3), 0, 1), t);
    this.finish();
  }
  drawMamaWindow(a, t) {
    const x = 1060, y = 250, r = 104;
    ctx.save(); ctx.globalAlpha = a;
    // a thought-cloud trail from the twins
    for (const [cx, cy, cr] of [[880, 340, 8], [930, 318, 12]]) fell(cx, cy, cr, cr, '#f1e4c8', 2);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.save(); ctx.clip();
    rect(x - r, y - r, r * 2, r * 2, grad(0, y - r, 0, y + r, ['#1d2748', '#3a4672']));
    glow(x + 50, y - 50, 60, '#fff2c8', 0.4); fell(x + 50, y - 50, 16, 16, '#f6ebc6', 1.6);
    const im = foxArt('mama-idle'), P = FOX_POSES['mama-idle'];
    if (im) { ctx.save(); ctx.translate(x - 25, y + 262); ctx.scale(0.55, 0.55); ctx.drawImage(im, -P[0], -P[1]); ctx.restore(); }
    // her hotel window frame
    frect(x - r, y + 40, r * 2, 70, '#8a6a4a', 2.4);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = '#f1e4c8'; ctx.stroke(); ctx.lineWidth = 2.6; ctx.strokeStyle = FOX.ink; ctx.stroke();
    ctx.restore();
  }
}

// ---------- 7. Mama comes home! (the cottage at sunset) ----------
class FoxHomePage extends FoxPage {
  constructor() {
    super({ name: 'fox-home', music: 'home', amb: 'fox-out',
      text: 'And then, at last, the door opens. “MAMAAAA!” Two little foxes run into Mama’s arms.',
      tricks: ['door', 'run', 'together'], who: ['The door', 'The twins', 'Everyone'],
      durs: { door: 1.4, run: 2.2, together: 6 } });
    // inside, small in the doorway until they come out
    this.papa = new Fox('papa', 450, 556, { face: 1, h: 190 });
    this.blue = new Fox('blue', 438, 558, { face: 1, h: 110 });
    this.rust = new Fox('rust', 492, 558, { face: 1, h: 110 });
    this.mama = new Fox('mama', 1340, 698, { face: -1, h: 307 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.opened = false; this.out = false; this.hugging = false;
    this.mama.moveTo(990, 698, 2.2, 7); // she walks up the road
  }
  spots() {
    // the door opens on the first tap; once the family is standing in it, a tap there sends them out
    const s = [{ name: this.opened && !this.out ? 'run' : 'door', box: DOOR }, { name: 'together', box: this.mama.box() }];
    if (this.out) s.push({ name: 'run', box: this.blue.box() }, { name: 'run', box: this.rust.box() });
    else s.push({ name: 'run', box: null });
    return s;
  }
  openDoor() { if (this.opened) return; this.opened = true; sfx('creak', 0.8); this.say('Click!', 462, 320, 34, FOX.cream); }
  comeOut(cb) {
    if (this.out) { cb && cb(); return; }
    this.openDoor(); this.out = true;
    setTimeout(() => {
      this.papa.moveTo(500, 694, 0.9, 0, 330); this.blue.moveTo(600, 704, 0.8, 10, 190); this.rust.moveTo(690, 706, 0.8, 10, 190);
      setTimeout(() => cb && cb(), 950);
    }, this.opened ? 250 : 600);
  }
  act(a) {
    if (a === 'door') { if (!this.opened) this.openDoor(); else { this.blue.say('excited', 1); this.rust.say('excited', 1); sfx('giggle', 0.5, 1.3); } }
    if (a === 'run') this.comeOut(() => this.run());
    if (a === 'together') this.comeOut(() => this.together());
  }
  run() {
    if (this.hugging) return;
    this.say('MAMAAAA!', 760, 360, 58, FOX.ochre); sfx('whee', 0.6, 1.3);
    this.blue.moveTo(this.mama.x - 130, 708, 1.0, 26); this.rust.moveTo(this.mama.x - 60, 712, 1.0, 26);
    this.blue.wave = 1; this.rust.wave = 1;
    setTimeout(() => {
      this.blue.say('joy', 1.4); this.rust.say('joy', 1.4); this.blue.leanTo = 10; this.rust.leanTo = 8; this.mama.leanTo = -7;
      this.hearts(this.mama.x - 80, 450, 7); sfx('hug', 1); sfx('smooch', 0.6, 1.1);
    }, 1050);
    setTimeout(() => { this.blue.leanTo = this.rust.leanTo = this.mama.leanTo = 0; }, 2400);
  }
  // the reunion: everyone comes together in one big, long hug
  together() {
    if (this.hugging) return; // one hug at a time: a second tap mid-hug lets this one finish
    this.hugging = true;
    const mx = 780;
    this.mama.moveTo(mx + 70, 700, 1.1, 0); this.papa.moveTo(mx - 90, 696, 1.3, 0);
    this.blue.moveTo(mx - 20, 712, 1.1, 20, 190); this.rust.moveTo(mx + 60, 716, 1.1, 20, 190);
    this.say('Mama is home!', 760, 300, 52, FOX.ochre);
    setTimeout(() => {
      this.mama.face = -1; this.papa.face = 1; this.blue.face = 1; this.rust.face = -1;
      this.papa.say('wide', 3.6); this.blue.say('joy', 3.6); this.rust.say('joy', 3.6);
      this.papa.leanTo = 7; this.mama.leanTo = -6; this.blue.leanTo = 5; this.rust.leanTo = -5;
      sfx('hug', 1); sfx('lullaby', 0.5);
    }, 1350);
    for (let i = 0; i < 8; i++) setTimeout(() => this.hearts(mx + rnd(-60, 60), 430, 3), 1400 + i * 420);
    setTimeout(() => { this.papa.leanTo = this.mama.leanTo = this.blue.leanTo = this.rust.leanTo = 0; this.hugging = false; }, 5200);
  }
  draw() {
    const st = this.st, t = st.t, A = this.acts;
    foxCountry(t, 1);
    st.draw(0);
    prop(this.opened ? 'cottage-open' : 'cottage', COTTAGE.x, COTTAGE.y, COTTAGE.w);
    foxGrassEdge(-10, 770, COTTAGE.y - 2, '#8d8b5b', t);
    // warm light from the open door
    if (this.opened) { glow(462, 470, 160, '#ffd27a', 0.4); }
    // the family inside, seen through the doorway, until they come out
    if (this.opened && !this.out) {
      ctx.save(); ctx.beginPath(); ctx.rect(DOOR[0], DOOR[1], DOOR[2] - DOOR[0], DOOR[3] - DOOR[1]); ctx.clip();
      for (const c of [this.papa, this.blue, this.rust]) c.draw();
      ctx.restore();
    }
    // a glow round the hug
    if (A.on('together') && A.t('together') > 1.3) { const k = Math.min(1, (A.t('together') - 1.3) / 0.6) * Math.min(1, (6 - A.t('together')) / 0.8); glow(780, 560, 300, '#ffd9a0', 0.35 * k); }
    // Papa at the back, then Mama and her suitcase (which she carries in, then puts down), the twins in front
    if (this.out) this.papa.draw();
    this.mama.draw();
    prop('suitcase', Math.max(1080, this.mama.x + 90), 698, 110);
    if (this.out) { this.blue.draw(); this.rust.draw(); }
    prop('hydrangea', 100, 742, 260);
    foxGrass([40, 290, 560, 760, 1040, 1230], 718, t, '#6c7442');
    this.finish();
  }
}

// ---------- 8. two little surprises (the living room) ----------
const GIFTS = [{ x: 560, y: 668, w: 118, h: 86, col: '#6f8aa6' }, { x: 720, y: 672, w: 104, h: 96, col: '#b5532f' }];
const RIBBONS = ['#d3a046', '#f1e4c8', '#7d8a4a', '#c98b7d', '#e3c27a'];
class FoxGiftsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-gifts', music: 'cover', amb: 'fox-in',
      text: '“I brought something for each of you,” says Mama. “What’s inside?” ask the twins. Mama smiles. “You’ll have to wait and see.”',
      tricks: ['wiggle', 'ribbon', 'mamaHug'], who: ['Presents', 'Ribbons', 'Mama'],
      durs: { wiggle: 1.2, ribbon: 1.2, mamaHug: 3.8 } });
    this.blue = new Fox('blue', 430, 714, { face: 1 });
    this.rust = new Fox('rust', 862, 716, { face: -1 });
    this.mama = new Fox('mama', 1010, 706, { face: -1 });
    this.papa = new Fox('papa', 1165, 708, { face: -1 });
    this.cast = [this.blue, this.rust, this.mama, this.papa];
    this.rib = [0, 2]; this.wig = [-1, -1]; this.flut = [-1, -1];
  }
  spots() {
    const s = [];
    GIFTS.forEach((g, i) => { s.push({ name: 'ribbon', box: [g.x - 46, g.y - g.h - 60, g.x + 46, g.y - g.h + 4], i }); });
    GIFTS.forEach((g, i) => { s.push({ name: 'wiggle', box: [g.x - g.w / 2, g.y - g.h, g.x + g.w / 2, g.y], i }); });
    s.push({ name: 'mamaHug', box: this.mama.box() });
    return s;
  }
  hit(x, y) { // which present was tapped matters here
    for (const s of this.spots()) if (s.box && inBox(s.box, x, y, 6)) { this.tap = [x, y]; this.tapI = s.i; return s.name; }
    return null;
  }
  act(a) {
    const which = this.tap ? [this.tapI] : [0, 1];
    if (a === 'wiggle') which.forEach((i, j) => setTimeout(() => {
      this.wig[i] = 0; sfx('tap', 0.6, 1 + i * 0.2); setTimeout(() => sfx('tap', 0.5, 1.2 + i * 0.2), 160);
      this.say('?', GIFTS[i].x + 40, GIFTS[i].y - GIFTS[i].h - 80, 52, FOX.ochre);
      (i ? this.rust : this.blue).say('excited', 1);
    }, j * 300));
    if (a === 'ribbon') which.forEach(i => { this.flut[i] = 0; this.rib[i] = (this.rib[i] + 1) % RIBBONS.length; sfx('flutter', 0.6, 1.2); this.st.sparkles(GIFTS[i].x, GIFTS[i].y - GIFTS[i].h - 30, 6, 30, '#fff3c4'); });
    if (a === 'mamaHug') {
      this.blue.moveTo(this.mama.x - 140, 714, 0.8, 16); this.rust.moveTo(this.mama.x - 70, 716, 0.6, 14); this.papa.moveTo(this.mama.x + 90, 708, 0.6, 0);
      setTimeout(() => {
        this.blue.face = 1; this.rust.face = 1; this.papa.face = -1;
        this.blue.say('joy', 1.8); this.rust.say('joy', 1.8); this.papa.say('wide', 1.8);
        this.blue.leanTo = 8; this.rust.leanTo = 6; this.papa.leanTo = -6; this.mama.leanTo = -4;
        this.hearts(this.mama.x - 40, 420, 8); sfx('hug', 1);
      }, 850);
      setTimeout(() => {
        this.blue.leanTo = this.rust.leanTo = this.papa.leanTo = this.mama.leanTo = 0;
        this.blue.moveTo(430, 714, 0.8, 12); this.rust.moveTo(862, 716, 0.5, 10); this.papa.moveTo(1165, 708, 0.6, 0);
        setTimeout(() => { this.blue.face = 1; this.rust.face = -1; this.papa.face = -1; }, 850);
      }, 2900);
      this.hugged = true;
    }
  }
  tick(dt) {
    for (let i = 0; i < 2; i++) { if (this.wig[i] >= 0 && (this.wig[i] += dt) > 1) this.wig[i] = -1; if (this.flut[i] >= 0 && (this.flut[i] += dt) > 1.1) this.flut[i] = -1; }
  }
  draw() {
    const st = this.st, t = st.t;
    // the living room: a plaster wall, a wooden floor, and the furniture from the sheet
    rect(0, 0, W, 470, grad(0, 0, 0, 470, ['#e6d4b0', '#efe0c0']));
    rect(0, 470, W, H - 470, grad(0, 470, 0, H, ['#b98a52', '#a47744']));
    for (let y = 490; y < H; y += 34) fline(0, y, W, y + wob(y) * 3, 1.4, alpha('#3b2a24', 0.35));
    fline(0, 470, W, 470, 3);
    rect(0, 452, W, 18, '#c9a46c'); fline(0, 452, W, 452, 2);
    prop('window', 1005, 372, 300);
    prop('shelf', 150, 486, 270);
    prop('fireplace', 640, 486, 320);
    glow(640, 430, 120, '#ffb45a', 0.18 + Math.sin(t * 7) * 0.04);
    prop('plant', 845, 492, 120);
    prop('lamp', 1215, 520, 100);
    prop('rug', 640, 772, 560);
    prop('sofa', 215, 612, 380);
    st.draw(0);
    // the twins first, then their presents in front, then Mama and Papa
    this.blue.draw(); this.rust.draw();
    GIFTS.forEach((g, i) => {
      const k = this.wig[i] >= 0 ? this.wig[i] : 0, hop = this.wig[i] >= 0 ? Math.abs(Math.sin(k * 14)) * 10 * (1 - k) : 0;
      foxGift(g.x, g.y - hop, g.w, g.h, g.col, RIBBONS[this.rib[i]], t, this.wig[i] >= 0 ? k : 0, this.flut[i] >= 0 ? 1 - this.flut[i] / 1.1 : 0);
    });
    this.mama.draw(); this.papa.draw();
    if (this.hugged && !this.acts.on('mamaHug')) { ctx.globalAlpha = 0.8 + Math.sin(t * 2) * 0.2; fword('The End', 640, 300, 48, FOX.cream); ctx.globalAlpha = 1; }
    this.finish();
  }
}
