// ---------- the Fox Family book: Mama's three-sleep trip ----------
// Eight pages, made only of the supplied art. A trick whose art hasn't arrived
// yet is left out, and the page lists that art as missing.

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
    if (a === 'calendar') this.moons = 0;
  }
  tick(dt, t, A) {
    if (A.on('calendar')) {
      const k = A.t('calendar'), n = k < 0.3 ? 0 : k < 1.1 ? 1 : k < 1.9 ? 2 : 3;
      if (n !== this.moons) {
        this.moons = n; const [cx] = boxMid(this.calBox), mx = this.calBox[0] + (this.calBox[2] - this.calBox[0]) * (0.24 + 0.27 * (n - 1));
        sfx('chime', 0.6, 1 + n * 0.12);
        this.say(['', 'One', 'Two', 'Three sleeps!'][n], n === 3 ? cx : mx, this.calBox[3] + 34, n === 3 ? 40 : 36, FOX.ochre);
        if (n === 3) { this.blue.say('excited', 1.6); this.rust.say('excited', 1.6); }
      }
    } else this.moons = 0;
  }
  draw() {
    const A = this.acts;
    const bg = art('bg-fox-kitchen'); if (bg) drawArt(bg); else this.paper();
    // the calendar hangs over the picture on the wall
    this.calBox = prop('calendar-' + this.moons, 482, 296, 152);
    prop('table-set', 520, 640, 520);
    // the suitcase by the door: rocks from one corner to the other (its own tilted pictures) when tapped
    const wob = A.on('suitcase') ? A.t('suitcase') : -1;
    const tilt = wob < 0 ? '' : Math.sin(wob * 20) > 0 ? '-tilt-r' : '-tilt-l';
    const hop = wob < 0 ? 0 : Math.abs(Math.sin(wob * 20)) * 8 * (1 - wob / 1.3);
    this.caseBox = prop('suitcase' + tilt, 1160, 694 - hop, 168);
    for (const c of [this.papa, this.mama, this.rust, this.blue]) c.draw();
    this.finish();
  }
}

// ---------- 2. packing trouble (the sunny bedroom) ----------
// what Mama needs, laid out on the floor: [prop, x, width]; packing sends them all into the case
const PACK_THINGS = [['pack-notebook', 505, 78], ['pack-sweaters', 610, 140], ['pack-shirt', 712, 112], ['pack-toothbrush', 792, 60], ['pack-thermos', 838, 36]];
const PACK_FLOOR = 694;
class FoxPackPage extends FoxPage {
  constructor() {
    super({ name: 'fox-pack', music: 'daycare', amb: 'fox-in',
      text: 'Mama needs clothes, her toothbrush, and her work things. But the twins think she needs a rubber duck and a pine cone too!',
      tricks: ['clothes', 'socks', 'pocket'], who: ['Clothes', 'Socks', 'Suitcase pocket'],
      durs: { clothes: 1.4, socks: 1.6, pocket: 1.4 } });
    this.mama = new Fox('mama', 1090, 708, { face: -1 });
    this.blue = new Fox('blue', 175, 716, { face: 1 });
    this.rust = new Fox('rust', 940, 716, { face: -1 });
    this.cast = [this.mama, this.blue, this.rust];
    this.packed = false;             // Mama's things are in the case
    this.out = [];                   // what has popped out of the pocket so far: 'duck', 'cone'
    this.fly = [];                   // things in the air: {n, x0,y0,x1,y1, t, dur, arc, w0, w1, then}
    this.CASE = [330, 474];          // the case on the quilt, bottom centre
  }
  spots() {
    return [
      { name: 'clothes', box: this.packed ? this.caseInBox : this.thingsBox },
      { name: 'socks', box: this.socksBox },
      { name: 'pocket', box: this.pocketBox },
    ];
  }
  focus() { // the case on the bed and the thing on its way in or out
    const B = { clothes: [460, 600, 870, 700], socks: [380, 600, 520, 720], pocket: [430, 380, 640, 500] }[this.lastTrick];
    return B ? [[150, 260], [520, 490], [B[0], B[1]], [B[2], B[3]]] : super.focus();
  }
  toss(n, x0, y0, x1, y1, dur, arc, w0, w1, then) { this.fly.push({ n, x0, y0, x1, y1, t: 0, dur, arc, w0, w1, then }); }
  act(a) {
    const [cx, cy] = this.CASE;
    if (a === 'clothes') {
      const into = !this.packed;
      if (!into) this.packed = false;
      PACK_THINGS.forEach(([n, x, w], i) => setTimeout(() => {
        if (into) this.toss(n, x, PACK_FLOOR, cx - 50 + i * 25, cy - 60, 0.6, 160, w, w * 0.6, i === PACK_THINGS.length - 1 ? () => { this.packed = true; sfx('thump', 0.5, 1.3); } : null);
        else this.toss(n, cx - 50 + i * 25, cy - 60, x, PACK_FLOOR, 0.65, 140, w * 0.6, w, null);
        sfx('swoosh', 0.35, 1.1 + i * 0.08);
      }, i * 110));
      if (into) setTimeout(() => this.mama.hop(10), 700);
    }
    if (a === 'socks') {
      this.socksAway = true; sfx('swoosh', 0.5, 1.5);
      this.toss('pack-socks', this.socksX || 420, 700, cx, cy - 60, 0.55, 140, 84, 60, () => {
        sfx('boing', 0.8, 1.2); this.say('BOING!', cx + 20, cy - 200, 50, FOX.ochre);
        const lx = rnd(380, 450);
        this.toss('pack-socks', cx, cy - 60, lx, 700, 0.7, 210, 60, 84, () => { this.socksAway = false; this.socksX = lx; this.blue.say('joy', 1); this.rust.say('joy', 1); sfx('giggle', 0.5, 1.3); });
      });
    }
    if (a === 'pocket') {
      const [px, py] = boxMid(this.pocketBox);
      if (this.out.length === 2) { // both out: back into the pocket they go, ready to pop again
        this.toss('pack-duck', 520, 466, px, py, 0.5, 90, 66, 24, null);
        this.toss('pinecone', 590, 470, px, py, 0.55, 110, 52, 20, null);
        this.out = []; sfx('pop', 0.6, 0.8); return;
      }
      const duck = !this.out.includes('duck'), n = duck ? 'pack-duck' : 'pinecone';
      this.toss(n, px, py, duck ? 520 : 590, duck ? 466 : 470, 0.75, 170, duck ? 24 : 20, duck ? 66 : 52, () => { this.out.push(duck ? 'duck' : 'cone'); });
      sfx(duck ? 'rubberduck' : 'pop', 0.9, 1.1);
      this.say(duck ? 'SQUEAK!' : 'A PINE CONE?', px, py - 200, 42, FOX.ochre);
      setTimeout(() => { this.blue.say('cheer', 1); this.rust.say('cheer2', 1); sfx('giggle', 0.6, 1.2); }, 400);
    }
  }
  tick(dt) {
    for (const f of this.fly) { f.t += dt; if (f.t >= f.dur && !f.done) { f.done = true; f.then && f.then(); } }
    this.fly = this.fly.filter(f => !f.done);
  }
  flying(n) { return this.fly.some(f => f.n === n); }
  draw() {
    const [cx, cy] = this.CASE;
    if (!drawScene('bedroom-day', 9, this.st.t, 4)) this.paper();
    // the case lies open on the quilt: a little squashed, as the bed is seen from slightly above
    const caseB = prop(this.packed ? 'case-full' : 'case-open', cx, cy, 270, false, 0, 0.8);
    this.caseInBox = [caseB[0] + 20, caseB[1] + 60, caseB[2] - 20, caseB[3] - 30];
    this.pocketBox = [cx - 60, cy - 58, cx + 60, cy - 4];
    if (this.out.includes('duck') && !this.flying('pack-duck')) prop('pack-duck', 520, 466, 66);
    if (this.out.includes('cone') && !this.flying('pinecone')) prop('pinecone', 590, 470, 52, false, 0.4);
    // Mama's things on the floor (unless packed or on their way)
    if (!this.packed && !PACK_THINGS.some(([n]) => this.flying(n))) {
      const bs = PACK_THINGS.map(([n, x, w]) => prop(n, x, PACK_FLOOR, w));
      this.thingsBox = [bs[0][0], Math.min(...bs.map(b => b[1])), bs[bs.length - 1][2], PACK_FLOOR];
    }
    if (!this.socksAway) this.socksBox = prop('pack-socks', this.socksX || 420, 700, 84, false, 0.08);
    for (const c of [this.blue, this.rust, this.mama]) c.draw();
    // things in the air, over everyone
    for (const f of this.fly) {
      const k = clamp(f.t / f.dur, 0, 1), x = lerp(f.x0, f.x1, k), y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * f.arc;
      prop(f.n, x, y, lerp(f.w0, f.w1, k), false, Math.sin(k * Math.PI) * 0.5);
    }
    this.finish();
  }
}

// ---------- 3. goodbye for now (outside the cottage) ----------
// The cottage with the door that opens stands in front of the road-and-fields painting
// (whose own cottage it covers), so pages 3 and 7 show the same house.
const COTTAGE = { x: 400, y: 618, w: 880 };
const DOOR = [427, 300, 580, 559]; // the doorway on the page, when the cottage is drawn at COTTAGE
const ROAD = [[1150, 760, 1.0], [1080, 610, 0.78], [1010, 480, 0.55], [960, 400, 0.38], [925, 350, 0.25], [905, 330, 0.16]]; // [x, y, size] up the road
function roadAt(k) { // a point along the road, k = 0 near us, 1 at the far end
  const f = clamp(k, 0, 1) * (ROAD.length - 1), i = Math.min(Math.floor(f), ROAD.length - 2), u = f - i;
  return ROAD[i].map((v, j) => lerp(v, ROAD[i + 1][j], u));
}
function drawCountry(warm = 0) {
  ctx.save(); if (warm) ctx.filter = `sepia(${0.3 * warm}) saturate(${1 + 0.15 * warm}) brightness(${1 - 0.08 * warm})`;
  const bg = art('bg-fox-cottage-road'); if (bg) drawArt(bg); else rect(0, 0, W, H, FOX.paper);
  ctx.restore();
}
class FoxByePage extends FoxPage {
  constructor() {
    super({ name: 'fox-bye', music: 'station', amb: 'fox-out',
      text: 'One hug. Two hugs. Three enormous hugs! Goodbye, Mama. See you after three sleeps!',
      tricks: ['hugMama', 'waveBye', 'drive'], who: ['Mama', 'The twins', 'The car'],
      durs: { hugMama: 2.6, waveBye: 1.8, drive: 6 } });
    this.papa = new Fox('papa', 470, 706, { face: 1, h: 340 });
    this.blue = new Fox('blue', 610, 710, { face: 1, h: 196 });
    this.rust = new Fox('rust', 705, 712, { face: 1, h: 196 });
    this.mama = new Fox('mama', 850, 704, { face: -1, h: 318 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.hugs = 0;
  }
  // the cubs come first: one may be standing in front of Mama, hugging her
  spots() { return [{ name: 'waveBye', box: this.blue.box() }, { name: 'waveBye', box: this.rust.box() }, { name: 'hugMama', box: this.mama.hidden ? null : this.mama.box() }, { name: 'drive', box: this.carBox }]; }
  act(a) {
    if (a === 'hugMama' && !this.mama.hidden) {
      // one cub at a time runs for a hug, then goes back
      const c = this.hugs++ % 2 ? this.rust : this.blue, home = c.x;
      c.moveTo(this.mama.x - 70, c.y, 0.5, 18);
      setTimeout(() => { c.say('joy', 1.2); c.leanTo = 8; this.mama.leanTo = -5; sfx('hug', 0.8); this.say(['One hug!', 'Two hugs!', 'Three enormous hugs!'][Math.min(this.hugs - 1, 2)], 760, 330, 40, FOX.cream); }, 520);
      setTimeout(() => { c.leanTo = 0; this.mama.leanTo = 0; c.moveTo(home, c.y, 0.6, 14); }, 1750);
      setTimeout(() => { c.face = 1; }, 2400);
    }
    if (a === 'waveBye') {
      this.blue.wave = 1.6; this.rust.wave = 1.6; this.papa.say('laugh', 1.4);
      this.say('Bye-bye, Mama!', 660, 380, 44, FOX.cream); sfx('giggle', 0.5, 1.1);
    }
    // Mama gets in, the car drives up the road and away; after a moment it is back, ready to go again
    if (a === 'drive') { this.mama.hidden = true; sfx('engine', 0.6); setTimeout(() => sfx('toot', 0.5, 1.3), 500); setTimeout(() => { this.blue.wave = 1.6; this.rust.wave = 1.6; }, 600); }
  }
  tick(dt, t, A) {
    if (!A.on('drive') && this.mama.hidden) { this.mama.hidden = false; this.mama.alpha = 0; }
    if (this.mama.alpha < 1) this.mama.alpha = Math.min(1, this.mama.alpha + dt * 2.5);
  }
  draw() {
    const A = this.acts;
    drawCountry(0);
    // the car on the road: parked by the gate, or driving up and away, smaller as it goes
    const d = A.on('drive') ? A.t('drive') : -1, k = d < 0 ? 0 : clamp((d - 0.4) / 3.8, 0, 1);
    const back = d > 4.6 ? clamp((d - 4.6) / 0.8, 0, 1) : 1, gone = k >= 1 && d <= 4.6;
    const [rx, ry, rs] = roadAt(lerp(0.12, 1, ease(k)));
    if (!gone) this.carBox = prop('car', rx, ry - 4, 330 * rs, false, 0, 1, d > 4.6 ? back : k > 0.9 ? 1 - (k - 0.9) / 0.1 : 1);
    if (d >= 0 && k > 0.05 && k < 0.85 && this.every('bye', 0.7)) this.say('Bye!', rx, ry - 160 * rs, 30, FOX.cream);
    prop('cottage', COTTAGE.x, COTTAGE.y, COTTAGE.w);
    for (const c of [this.papa, this.blue, this.rust, this.mama]) c.draw();
    if (!this.mama.hidden) prop('suitcase', 940, 700, 104);
    prop('hydrangea', 90, 746, 250);
    this.finish();
  }
}

// ---------- 4. Mama's adventure (the station in the city) ----------
const VIADUCT = { y: 332, x0: 1040, stop: 1150 }; // the train runs along the bridge on the right of the painting
class FoxCityPage extends FoxPage {
  constructor() {
    super({ name: 'fox-city', music: 'office', amb: 'fox-city',
      text: 'Far away, Mama visits a busy city. There are tall buildings, important meetings, and a very serious bear wearing a tiny tie.',
      tricks: ['train', 'tie'], who: ['The train', 'The bear'],
      missing: ['animals peeking out of the station windows'],
      durs: { train: 3.4, tie: 1.6 } });
    this.mama = new Fox('mama', 520, 712, { face: -1, h: 340 });
    this.cast = [this.mama];
    this.trainIn = false; this.trainX = 1400;
    this.BEAR = [190, 744, 270]; // bottom centre and width: the bear stands close to us, cut off by the page's edge
  }
  spots() {
    const [bx, by, bw] = this.BEAR;
    return [{ name: 'train', box: [Math.min(this.trainX, 1180) - 90, VIADUCT.y - 50, 1280, VIADUCT.y + 6] }, { name: 'tie', box: [bx - bw / 2, by - bw * 1.1, bx + bw / 2, H] }];
  }
  act(a) {
    if (a === 'train') { this.trainIn = !this.trainIn; sfx('choo', 0.6); setTimeout(() => sfx('chug', 0.5), 300); this.mama.face = 1; this.mama.hop(10); }
    if (a === 'tie') { sfx('whee', 0.5, 1.6); this.say('Ahem.', this.BEAR[0] + 60, 380, 36, FOX.cream); }
  }
  tick(dt, t, A) {
    // in: rolls in from the right and stops on the bridge; out: backs away off the page again
    const to = this.trainIn ? VIADUCT.stop : 1400;
    this.trainX += (to - this.trainX) * Math.min(1, dt * 1.6);
    if (!A.on('train')) this.mama.face = -1;
  }
  draw() {
    const A = this.acts, t = this.st.t;
    if (!drawScene('station', 9, t, 6)) this.paper();
    // the train on the bridge, beyond the town
    const moving = A.on('train'), bob = moving ? Math.sin(t * 30) * 0.8 : 0;
    if (this.trainX < 1380) {
      ctx.save(); ctx.beginPath(); ctx.rect(VIADUCT.x0, 0, W - VIADUCT.x0, H); ctx.clip(); // it comes out from behind the town
      prop('train', this.trainX + 85, VIADUCT.y + bob, 170);
      if (moving) prop('train-smoke', this.trainX + 40 - (t % 1) * 20, VIADUCT.y - 40 - (t % 1) * 12, 60, false, 0, 1, 1 - (t % 1));
      ctx.restore();
    }
    this.mama.draw();
    prop('suitcase', 650, 712, 104);
    // the very serious bear in his bow tie, close to us; the bow tie flutters when tapped
    const [bx, by, bw] = this.BEAR, bear = foxArt('bear'), tie = foxArt('bear-bowtie');
    prop('bear', bx, by, bw);
    if (bear && tie && A.on('tie')) {
      const s = bw / bear.naturalWidth, k = A.t('tie') / 1.6, bh = bear.naturalHeight * s;
      const tw = tie.naturalWidth * s, th = tie.naturalHeight * s, tx = bx - bw / 2 + FOX_BOWTIE[0] * s + tw / 2, ty = by - bh + FOX_BOWTIE[1] * s + th / 2;
      push(tx, ty, Math.sin(k * TAU * 3) * 25 * (1 - k), 1 + Math.abs(Math.sin(k * TAU * 4)) * 0.45 * (1 - k), 1 + Math.abs(Math.sin(k * TAU * 4 + 1)) * 0.25 * (1 - k));
      ctx.drawImage(tie, -tw / 2, -th / 2, tw, th); pop();
    }
    this.finish();
  }
}

// ---------- 5. adventures with Papa (the dining room) ----------
const TABLE_EDGE = 570;                      // the far edge of the table: the twins sit behind it
const PAN = [740, 512, 200];                 // the pan in Papa's hand: bottom centre and width
const PLATE = [640, 610, 170];               // the pancake plate on the table
class FoxPancakePage extends FoxPage {
  constructor() {
    super({ name: 'fox-pancakes', music: 'dinner', amb: 'fox-in',
      text: 'Back home, Papa and the twins make pancakes. One lands on a plate. Another lands somewhere rather surprising!',
      tricks: ['flip', 'stir', 'onHead'], who: ['Frying pan', 'Mixing bowl', 'Papa'],
      durs: { flip: 1.3, stir: 1.6, onHead: 4.8 } });
    this.papa = new Fox('papa', 960, 712, { face: -1, pose: 'happy' });
    this.blue = new Fox('blue', 300, 650, { face: 1 });
    this.rust = new Fox('rust', 455, 652, { face: 1 });
    for (const c of [this.blue, this.rust]) c.shadow = false;
    this.cast = [this.papa, this.blue, this.rust];
    this.flips = 0; this.toPlate = false; this.plateBounce = -1;
  }
  spots() {
    return [
      { name: 'flip', box: [PAN[0] - PAN[2] / 2, PAN[1] - 80, PAN[0] + PAN[2] / 2, PAN[1] + 10] },
      { name: 'stir', box: [90, 580, 250, 700] },
      { name: 'onHead', box: this.papa.box() },
    ];
  }
  act(a) {
    if (a === 'flip') { this.toPlate = ++this.flips % 2 === 0; sfx('flip', 0.8); this.say('FLIP!', PAN[0] - 60, 300, 44, FOX.ochre); }
    if (a === 'stir') { sfx('swoosh', 0.4, 1.6); setTimeout(() => sfx('swoosh', 0.4, 1.8), 500); setTimeout(() => sfx('blub', 0.4), 1000); this.say('swish swish', 170, 540, 34, FOX.cream); }
    if (a === 'onHead') sfx('flip', 1, 0.9);
  }
  tick(dt, t, A) {
    if (this.at('flip', 1.1)) { if (this.toPlate) { this.plateBounce = 0; sfx('thump', 0.5, 1.5); this.blue.say('excited', 0.9); } else sfx('tap', 0.6); }
    if (this.at('onHead', 1.2)) { sfx('splat', 0.7, 1.3); this.papa.say('oh', 1.4); this.say('PLOP!', this.papa.x, 230, 52, FOX.ochre); }
    if (this.at('onHead', 1.9)) {
      this.papa.say('laugh', 2.2); this.blue.say('joy', 2.4); this.rust.say('cheer', 2.4); this.blue.hop(22); setTimeout(() => this.rust.hop(22), 150);
      this.say('HA HA HA!', 380, 420, 46, FOX.cream); sfx('giggle', 1, 1.1);
    }
    if (this.at('onHead', 4.6)) { this.plateBounce = 0; sfx('thump', 0.5, 1.5); }
    if (this.plateBounce >= 0 && (this.plateBounce += dt) > 0.4) this.plateBounce = -1;
  }
  draw() {
    const A = this.acts, t = this.st.t;
    const bg = art('bg-fox-dining'); if (bg) drawArt(bg); else this.paper();
    // the twins sit behind the table: only what is above its far edge shows
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, TABLE_EDGE); ctx.clip();
    this.blue.draw(); this.rust.draw();
    ctx.restore();
    // the batter bowl: stirring swings it, and the spoon swaps sides as it goes round
    const st = A.on('stir') ? A.t('stir') : -1, sw = st < 0 ? 0 : Math.sin(st * 14) * 0.07 * (1 - st / 1.6);
    prop('bowl', 168, 696, 150, st >= 0 && Math.sin(st * 14) < 0, sw);
    const pb = this.plateBounce >= 0 ? Math.sin(this.plateBounce / 0.4 * Math.PI) : 0;
    prop('plate-stack', PLATE[0], PLATE[1], PLATE[2] * (1 + pb * 0.05), false, 0, 1 - pb * 0.12);
    this.papa.draw();
    // the pan, and the pancake in it or in the air
    const H0 = A.on('onHead') ? A.t('onHead') : -1, [hx, hy] = this.papa.head(), headTop = hy - this.papa.h * 0.13;
    const pk = A.on('flip') ? A.t('flip') / 1.1 : H0 >= 0 && H0 < 1.2 ? H0 / 1.2 : -1;
    const lift = pk >= 0 && pk < 0.2 ? Math.sin(pk / 0.2 * Math.PI) * 14 : 0;
    const inPan = !(pk >= 0 && pk < 1) && !(H0 >= 1.2);
    prop(inPan ? 'pan-cake' : 'pan', PAN[0], PAN[1] - lift, PAN[2], false, -lift * 0.006);
    if (pk >= 0 && pk < 1) { // flying, turning over (squashed to its edge and back)
      const toX = A.on('flip') ? (this.toPlate ? PLATE[0] : PAN[0]) : hx, toY = A.on('flip') ? (this.toPlate ? PLATE[1] - 40 : PAN[1] - 10) : headTop + 10;
      const x = lerp(PAN[0], toX, pk), y = lerp(PAN[1] - 10, toY, pk) - Math.sin(pk * Math.PI) * (A.on('flip') ? 240 : 200);
      prop('pancake', x, y, 120, false, pk * 1.2, Math.max(0.15, Math.abs(Math.cos(pk * TAU * 1.5))));
    }
    if (H0 >= 1.2) { // on Papa's head like a hat, then it slides off onto the plate
      const s = clamp((H0 - 3.9) / 0.7, 0, 1);
      prop('pancake', lerp(hx + 6, PLATE[0], ease(s)), lerp(headTop + 14, PLATE[1] - 40, ease(s)) - Math.sin(s * Math.PI) * 60, 140, false, (1 - s) * (0.15 + Math.sin(t * 3) * 0.05), 0.55);
    }
    this.finish();
  }
}

// ---------- 6. three sleeps (the twins' bedroom at night) ----------
const NIGHT_DROP = 64; // the painting sits this much lower, so its moon shows below the story words
const NIGHT_LOOK = [0, 0, 4, 8];       // the painting's frame for each night: clear, cloudy, the moon going behind cloud
const CURTAIN_BOX = [352, 118, 908];   // where the curtain pictures hang over the painted window: left, rod, right
const STAR_LAMP = [1035, 240, 1175, 380]; // the star nightlight on the wall
// the quilts in front of each cub, as polygons on the page: the painting is put back over them there
const QUILT_BLUE = [0, 512, 140, 512, 250, 520, 345, 532, 360, 720, 0, 720];
const QUILT_RUST = [905, 516, 1010, 508, 1120, 508, 1280, 512, 1280, 720, 905, 720];
class FoxSleepsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-sleeps', music: 'tuck', amb: 'fox-night',
      text: 'At night, the twins look at the moon. “Mama can see that moon too,” says Papa. One sleep, two sleeps, three sleeps...',
      tricks: ['curtains', 'nightlight', 'sleepNight'], who: ['Curtains', 'Nightlight', 'The moon'],
      missing: ['the twins lying down asleep', 'Mama looking at the same moon'],
      durs: { curtains: 1.6, nightlight: 0.3, sleepNight: 6.4 } });
    // each twin sits up in their own bed, the quilt over their lap: blue stars on the left, red on the right
    this.blue = new Fox('blue', 210, 598, { face: 1, h: 220 });
    this.rust = new Fox('rust', 1025, 594, { face: -1, h: 220 });
    this.papa = new Fox('papa', 640, 712, { face: 1 });
    for (const c of [this.blue, this.rust]) c.shadow = false;
    this.cast = [this.papa, this.blue, this.rust];
    this.nights = 0;
    this.open = 0; this.openTo = 0;  // the curtains: 0 drawn shut, 1 open
    this.lamp = 1; this.dim = 0;     // the star nightlight: 1 on, 0 off; dim follows it smoothly
  }
  spots() {
    return [
      { name: 'curtains', box: [CURTAIN_BOX[0], CURTAIN_BOX[1], CURTAIN_BOX[2], 480], glint: [CURTAIN_BOX[0] + 60, 300] },
      { name: 'nightlight', box: STAR_LAMP },
      { name: 'sleepNight', box: this.calBox },
    ];
  }
  // a night, once begun, always finishes (a second tap mid-night would otherwise start it over, and
  // little hands tap twice): the countdown only ever moves forward
  press(k) { if (this.tricks[k][0] === 'sleepNight' && this.acts.on('sleepNight')) return; super.press(k); }
  act(a) {
    if (a === 'curtains') { this.openTo = this.openTo > 0.5 ? 0 : 1; sfx('swoosh', 0.5, 0.8); }
    if (a === 'nightlight') { this.lamp = this.lamp ? 0 : 1; sfx('lampOn', 0.6, this.lamp ? 1.2 : 0.9); }
    if (a === 'sleepNight') {
      if (this.nights >= 3) this.nights = 0; // start the countdown again
      this.night = this.nights + 1; this.openTo = 1; // the moon has to be seen
      this.papa.face = this.blue.x < this.papa.x ? -1 : 1; this.papa.say('talk', 1.6); this.say('Mama can see that moon too.', 640, 300, 32, FOX.cream);
    }
  }
  // one night: Papa says goodnight (0 - 1.8), the twins sleep (1.8 - 4.6),
  // morning comes and a moon on the calendar lights up (4.6 - 6.4)
  tick(dt, t, A) {
    this.open += (this.openTo - this.open) * Math.min(1, dt * 2.2);
    if (A.on('sleepNight')) {
      const k = A.t('sleepNight'), asleep = k > 1.8 && k < 4.6;
      for (const c of [this.blue, this.rust]) c.base = asleep ? 'joy' : 'idle';
      if (this.at('sleepNight', 1.9)) { sfx('yawn', 0.5); this.say('Zzz', 215, 370, 40, FOX.cream); setTimeout(() => this.say('Zzz', 1030, 370, 40, FOX.cream), 400); }
      if (this.at('sleepNight', 4.6)) {
        this.nights = this.night; sfx('chime', 0.8, 1 + this.nights * 0.12);
        this.say(['', 'One sleep!', 'Two sleeps!', 'Three sleeps! Mama comes home today!'][this.nights], 640, 300, this.nights === 3 ? 36 : 44, FOX.ochre);
        if (this.nights === 3) { this.blue.wave = 2; this.rust.wave = 2; sfx('giggle', 0.8, 1.2); }
      }
    } else this.blue.base = this.rust.base = 'idle';
  }
  draw() {
    const A = this.acts;
    // the sky in the window: the night being slept through, or the last one counted
    const look = NIGHT_LOOK[A.on('sleepNight') ? this.night : this.nights];
    const bg = art('bg-fox-twins-night-' + look);
    const room = () => { // the painting lowered; above it, its own top row of pixels stretched up to the page top
      if (!bg) { this.paper(); return; }
      const sc = Math.max(W / bg.naturalWidth, H / bg.naturalHeight), w = bg.naturalWidth * sc, x = (W - w) / 2;
      ctx.drawImage(bg, x, NIGHT_DROP, w, bg.naturalHeight * sc);
      ctx.drawImage(bg, 0, 0, bg.naturalWidth, 1, x, 0, w, NIGHT_DROP + 1);
    };
    room();
    // the star nightlight: dimmed when switched off (the painting's own lamp, darkened)
    // the curtains: drawn shut over the window until tapped, then opening step by step;
    // fully open, they fade away and the painting's own tied-back curtains show
    if (this.open < 0.98) {
      const i = Math.round(clamp(this.open, 0, 1) * 8), [cx0, cy0, cx1] = CURTAIN_BOX;
      const im = foxArt('curtain-' + i);
      if (im) { const w = cx1 - cx0, h = w * im.naturalHeight / im.naturalWidth; ctx.save(); ctx.globalAlpha = this.open > 0.85 ? (0.98 - this.open) / 0.13 : 1; ctx.drawImage(im, cx0, cy0, w, h); ctx.restore(); }
    }
    this.calBox = prop('calendar-' + this.nights, 300, 382, 104);
    // the twins in bed: drawn, then the painting put back over them where their quilts are
    ctx.save(); ctx.filter = this.lamp ? 'brightness(0.8) saturate(0.85)' : 'brightness(0.62) saturate(0.75)';
    this.blue.draw(); this.rust.draw();
    ctx.restore();
    ctx.save(); if (this.dim > 0.01) ctx.filter = `brightness(${1 - 0.35 * this.dim}) saturate(${1 - 0.25 * this.dim})`; repaint(room, QUILT_BLUE); repaint(room, QUILT_RUST); ctx.restore();
    ctx.save(); ctx.filter = this.lamp ? 'brightness(0.8) saturate(0.85)' : 'brightness(0.62) saturate(0.75)';
    this.papa.draw(); ctx.restore();
    this.finish();
  }
}

// ---------- 7. Mama comes home! (the cottage, late in the day) ----------
class FoxHomePage extends FoxPage {
  constructor() {
    super({ name: 'fox-home', music: 'home', amb: 'fox-out',
      text: 'And then, at last, the door opens. “MAMAAAA!” Two little foxes run into Mama’s arms.',
      tricks: ['door', 'run', 'together'], who: ['The door', 'The twins', 'Everyone'],
      durs: { door: 1.4, run: 2.2, together: 6 } });
    // inside, small in the doorway until they come out
    this.papa = new Fox('papa', 494, 556, { face: 1, h: 221 });
    this.blue = new Fox('blue', 478, 558, { face: 1, h: 126 });
    this.rust = new Fox('rust', 540, 558, { face: 1, h: 126 });
    this.mama = new Fox('mama', 1340, 704, { face: -1, h: 318 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.opened = false; this.out = false; this.hugging = false;
    this.mama.moveTo(1000, 704, 2.2, 7); // she walks up the road
  }
  spots() {
    // the door opens on the first tap; once the family is standing in it, a tap there sends them out
    const s = [{ name: this.opened && !this.out ? 'run' : 'door', box: DOOR }, { name: 'together', box: this.mama.box() }];
    if (this.out) s.push({ name: 'run', box: this.blue.box() }, { name: 'run', box: this.rust.box() });
    return s;
  }
  openDoor() { if (this.opened) return; this.opened = true; sfx('creak', 0.8); this.say('Click!', 503, 270, 34, FOX.cream); }
  comeOut(cb) {
    if (this.out) { cb && cb(); return; }
    this.openDoor(); this.out = true;
    setTimeout(() => {
      this.papa.moveTo(530, 700, 0.9, 0, 340); this.blue.moveTo(640, 708, 0.8, 10, 196); this.rust.moveTo(730, 710, 0.8, 10, 196);
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
    this.blue.moveTo(this.mama.x - 130, 712, 1.0, 26); this.rust.moveTo(this.mama.x - 60, 716, 1.0, 26);
    this.blue.wave = 1; this.rust.wave = 1;
    setTimeout(() => {
      this.blue.say('joy', 1.4); this.rust.say('joy', 1.4); this.blue.leanTo = 10; this.rust.leanTo = 8; this.mama.leanTo = -7;
      sfx('hug', 1); sfx('smooch', 0.6, 1.1);
    }, 1050);
    setTimeout(() => { this.blue.leanTo = this.rust.leanTo = this.mama.leanTo = 0; }, 2400);
  }
  // the reunion: everyone comes together in one big, long hug
  together() {
    if (this.hugging) return; // one hug at a time: a second tap mid-hug lets this one finish
    this.hugging = true;
    const mx = 790;
    this.mama.moveTo(mx + 70, 706, 1.1, 0); this.papa.moveTo(mx - 90, 702, 1.3, 0);
    this.blue.moveTo(mx - 20, 714, 1.1, 20, 196); this.rust.moveTo(mx + 60, 718, 1.1, 20, 196);
    this.say('Mama is home!', 770, 300, 52, FOX.ochre);
    setTimeout(() => {
      this.mama.face = -1; this.papa.face = 1; this.blue.face = 1; this.rust.face = -1;
      this.papa.say('wide', 3.6); this.blue.say('joy', 3.6); this.rust.say('joy', 3.6);
      this.papa.leanTo = 7; this.mama.leanTo = -6; this.blue.leanTo = 5; this.rust.leanTo = -5;
      sfx('hug', 1); sfx('lullaby', 0.5);
    }, 1350);
    setTimeout(() => { this.papa.leanTo = this.mama.leanTo = this.blue.leanTo = this.rust.leanTo = 0; this.hugging = false; }, 5200);
  }
  draw() {
    drawCountry(1); // the same road, warmer: late in the day
    ctx.save(); ctx.filter = 'sepia(0.3) saturate(1.15) brightness(0.92)';
    prop(this.opened ? 'cottage-open' : 'cottage', COTTAGE.x, COTTAGE.y, COTTAGE.w);
    ctx.restore();
    // the family inside, seen through the doorway, until they come out
    if (this.opened && !this.out) {
      ctx.save(); ctx.beginPath(); ctx.rect(DOOR[0], DOOR[1], DOOR[2] - DOOR[0], DOOR[3] - DOOR[1]); ctx.clip();
      for (const c of [this.papa, this.blue, this.rust]) c.draw();
      ctx.restore();
    }
    // Papa at the back, then Mama and her suitcase (which she carries in, then puts down), the twins in front
    if (this.out) this.papa.draw();
    this.mama.draw();
    prop('suitcase', this.mama.x + 92, 704, 104);
    if (this.out) { this.blue.draw(); this.rust.draw(); }
    ctx.save(); ctx.filter = 'sepia(0.3) saturate(1.15) brightness(0.92)'; prop('hydrangea', 90, 746, 250); ctx.restore();
    this.finish();
  }
}

// ---------- 8. two little surprises (the living room) ----------
// The presents are part of the living-room painting, which has them wiggle and their ribbons flutter
// (frames 1-3: ribbons, 3-6: a hop with sparkles). They are wrapped in every frame.
const GIFT_BLUE = [296, 314, 643, 641], GIFT_RED = [674, 371, 939, 641];
class FoxGiftsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-gifts', music: 'cover', amb: 'fox-in',
      text: '“I brought something for each of you,” says Mama. “What’s inside?” ask the twins. Mama smiles. “You’ll have to wait and see.”',
      tricks: ['wiggle', 'ribbon', 'mamaHug'], who: ['Presents', 'Ribbons', 'Mama'],
      durs: { wiggle: 1.4, ribbon: 1.0, mamaHug: 3.8 } });
    this.papa = new Fox('papa', 160, 716, { face: 1, h: 470 });
    this.blue = new Fox('blue', 270, 720, { face: 1, h: 290 });
    this.rust = new Fox('rust', 1010, 720, { face: -1, h: 290 });
    this.mama = new Fox('mama', 1170, 716, { face: -1, h: 440 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.home = { papa: 160, blue: 270, rust: 1010 };
  }
  spots() {
    return [
      { name: 'ribbon', box: [GIFT_BLUE[0] + 80, GIFT_BLUE[1] - 20, GIFT_BLUE[2] - 80, GIFT_BLUE[1] + 90] },
      { name: 'ribbon', box: [GIFT_RED[0] + 60, GIFT_RED[1] - 20, GIFT_RED[2] - 60, GIFT_RED[1] + 80] },
      { name: 'wiggle', box: GIFT_BLUE }, { name: 'wiggle', box: GIFT_RED },
      { name: 'mamaHug', box: this.mama.box() },
    ];
  }
  act(a) {
    if (a === 'wiggle') { sfx('tap', 0.6, 1); setTimeout(() => sfx('tap', 0.5, 1.2), 160); this.say('?', 640, 300, 58, FOX.ochre); this.blue.say('excited', 1.2); this.rust.say('excited', 1.2); }
    if (a === 'ribbon') { sfx('flutter', 0.6, 1.2); }
    if (a !== 'mamaHug') return;
    this.blue.moveTo(this.mama.x - 200, 720, 0.9, 16); this.rust.moveTo(this.mama.x - 110, 720, 0.6, 14); this.papa.moveTo(this.mama.x - 300, 716, 1.0, 0);
    setTimeout(() => {
      this.blue.face = 1; this.rust.face = 1; this.papa.face = 1;
      this.blue.say('joy', 1.8); this.rust.say('joy', 1.8); this.papa.say('wide', 1.8);
      this.blue.leanTo = 8; this.rust.leanTo = 6; this.papa.leanTo = 6; this.mama.leanTo = -4;
      sfx('hug', 1);
    }, 1000);
    setTimeout(() => {
      this.blue.leanTo = this.rust.leanTo = this.papa.leanTo = this.mama.leanTo = 0;
      this.blue.moveTo(this.home.blue, 720, 0.9, 12); this.rust.moveTo(this.home.rust, 720, 0.5, 10); this.papa.moveTo(this.home.papa, 716, 1.0, 0);
      setTimeout(() => { this.blue.face = 1; this.rust.face = -1; this.papa.face = 1; }, 1000);
    }, 2900);
    this.hugged = true;
  }
  frame() { // which frame of the painting: still, ribbons fluttering, or a wiggle
    const A = this.acts;
    if (A.on('wiggle')) return [3, 4, 5, 6, 5, 4, 3, 0][Math.min(7, Math.floor(A.t('wiggle') / 1.4 * 8))];
    if (A.on('ribbon')) return [1, 2, 1, 2, 1, 0][Math.min(5, Math.floor(A.t('ribbon') / 1.0 * 6))];
    return 0;
  }
  draw() {
    if (!drawScene('living-gifts', 9, 0, 0, this.frame())) this.paper();
    for (const c of [this.papa, this.blue, this.rust, this.mama]) c.draw();
    if (this.hugged && !this.acts.on('mamaHug')) { ctx.globalAlpha = 0.8 + Math.sin(this.st.t * 2) * 0.2; word('The End', 640, 230, 48, FOX.cream); ctx.globalAlpha = 1; }
    this.finish();
  }
}
