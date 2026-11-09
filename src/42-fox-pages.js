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

// ---------- 2. packing trouble (the bedroom) ----------
class FoxPackPage extends FoxPage {
  constructor() {
    super({ name: 'fox-pack', music: 'daycare', amb: 'fox-in',
      text: 'Mama needs clothes, her toothbrush, and her work things. But the twins think she needs a rubber duck and a pine cone too!',
      tricks: ['clothes', 'socks', 'pocket'], who: ['Clothes', 'Socks', 'Suitcase pocket'],
      missing: ['pine cone'],
      durs: { clothes: 1.2, socks: 1.6, pocket: 1.4 } });
    this.mama = new Fox('mama', 1065, 708, { face: -1 });
    this.blue = new Fox('blue', 175, 716, { face: 1 });
    this.rust = new Fox('rust', 830, 716, { face: -1 });
    this.cast = [this.mama, this.blue, this.rust];
    this.packed = false;             // the clothes are in the case
    this.duckOut = false;            // the duck has popped out of the pocket
    this.fly = [];                   // things in the air: {n, x0,y0,x1,y1, t, dur, arc, w0, w1, then}
    this.CASE = [330, 500];          // the case on the bed, bottom centre
  }
  spots() {
    return [
      { name: 'clothes', box: this.packed ? this.caseInBox : this.clothesBox },
      { name: 'socks', box: this.socksBox },
      { name: 'pocket', box: this.pocketBox },
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
        sfx('swoosh', 0.6, 1.3);
      } else {
        this.packed = false; sfx('swoosh', 0.6, 1.1);
        this.toss('pack-sweaters', cx - 20, cy - 70, 610, 660, 0.7, 150, 110, 150, null);
        this.toss('pack-shirt', cx + 40, cy - 70, 720, 668, 0.75, 130, 90, 120, null);
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
      const [px, py] = boxMid(this.pocketBox);
      if (this.duckOut) { // back into the pocket it goes, ready to pop again
        this.duckOut = false; this.toss('pack-duck', 520, 470, px, py, 0.5, 90, 76, 30, null); sfx('pop', 0.6, 0.8); return;
      }
      this.toss('pack-duck', px, py, 520, 470, 0.75, 170, 30, 76, () => { this.duckOut = true; });
      sfx('rubberduck', 0.9, 1.1);
      this.say('SQUEAK!', px, py - 210, 42, FOX.ochre);
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
    const bg = art('bg-fox-bedroom'); if (bg) drawArt(bg); else this.paper();
    // the case on the bed, and the work things beside it
    const caseB = prop(this.packed ? 'case-full' : 'case-open', cx, cy, 330);
    this.caseInBox = [caseB[0] + 30, caseB[1] + 90, caseB[2] - 30, caseB[3] - 60];
    this.pocketBox = [cx - 70, cy - 70, cx + 70, cy - 4];
    prop('pack-notebook', 95, 470, 92, false, -0.1);
    prop('pack-toothbrush', 905, 632, 74);
    prop('pack-thermos', 960, 640, 46);
    if (this.duckOut && !this.flying('pack-duck')) prop('pack-duck', 520, 470, 76);
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
      prop(f.n, x, y, lerp(f.w0, f.w1, k), false, Math.sin(k * Math.PI) * 0.5);
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
      tricks: ['hugMama', 'waveBye'], who: ['Mama', 'The twins'],
      missing: ['sky and road behind the cottage', 'the car that takes Mama away'],
      durs: { hugMama: 2.6, waveBye: 1.8 } });
    this.papa = new Fox('papa', 470, 700, { face: 1, h: 330 });
    this.blue = new Fox('blue', 610, 706, { face: 1, h: 190 });
    this.rust = new Fox('rust', 705, 708, { face: 1, h: 190 });
    this.mama = new Fox('mama', 845, 696, { face: -1, h: 307 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.hugs = 0;
  }
  // the cubs come first: one may be standing in front of Mama, hugging her
  spots() { return [{ name: 'waveBye', box: this.blue.box() }, { name: 'waveBye', box: this.rust.box() }, { name: 'hugMama', box: this.mama.box() }]; }
  act(a) {
    if (a === 'hugMama') {
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
  }
  draw() {
    this.paper();
    prop('cottage', COTTAGE.x, COTTAGE.y, COTTAGE.w);
    prop('robin', 1170, 250, 250, true);
    for (const c of [this.papa, this.blue, this.rust, this.mama]) c.draw();
    prop('suitcase', 932, 694, 104);
    prop('hydrangea', 100, 742, 260);
    this.finish();
  }
}

// ---------- 4. Mama's adventure (the city) ----------
class FoxCityPage extends FoxPage {
  constructor() {
    super({ name: 'fox-city', music: 'office', amb: 'fox-city',
      text: 'Far away, Mama visits a busy city. There are tall buildings, important meetings, and a very serious bear wearing a tiny tie.',
      tricks: [], who: [],
      missing: ['the city', 'a train on its track', 'animals at the windows', 'the bear and his tiny tie'] });
    this.mama = new Fox('mama', 250, 714, { face: 1, h: 360 });
    this.cast = [this.mama];
  }
  draw() {
    this.paper();
    this.mama.draw();
    prop('suitcase', 380, 712, 110);
    this.finish();
  }
}

// ---------- 5. adventures with Papa (the kitchen) ----------
class FoxPancakePage extends FoxPage {
  constructor() {
    super({ name: 'fox-pancakes', music: 'dinner', amb: 'fox-in',
      text: 'Back home, Papa and the twins make pancakes. One lands on a plate. Another lands somewhere rather surprising!',
      tricks: [], who: [],
      missing: ['frying pan', 'pancakes (flat, flipping, on a plate, on Papa’s head)', 'mixing bowl and spoon'] });
    this.papa = new Fox('papa', 780, 704, { face: -1, pose: 'happy' });
    this.blue = new Fox('blue', 250, 646, { face: 1 });
    this.rust = new Fox('rust', 420, 650, { face: 1 });
    this.cast = [this.papa, this.blue, this.rust];
  }
  draw() {
    const bg = art('bg-fox-kitchen'); if (bg) drawArt(bg); else this.paper();
    // the twins stand behind the little table, Papa at the stove
    this.blue.draw(); this.rust.draw();
    prop('table', 360, 704, 330);
    this.papa.draw();
    this.finish();
  }
}

// ---------- 6. three sleeps (the bedroom at night) ----------
class FoxSleepsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-sleeps', music: 'tuck', amb: 'fox-night',
      text: 'At night, the twins look at the moon. “Mama can see that moon too,” says Papa. One sleep, two sleeps, three sleeps...',
      tricks: ['sleepNight'], who: ['Calendar'],
      missing: ['night window with moon and stars', 'curtains', 'twins asleep in bed', 'Mama looking at the moon'],
      durs: { sleepNight: 6.4 } });
    this.blue = new Fox('blue', 600, 712, { face: 1 });
    this.rust = new Fox('rust', 740, 714, { face: -1 });
    this.papa = new Fox('papa', 960, 712, { face: -1 });
    this.cast = [this.papa, this.blue, this.rust];
    this.nights = 0;
  }
  spots() { return [{ name: 'sleepNight', box: this.calBox }]; }
  // a night, once begun, always finishes (a second tap mid-night would otherwise start it over, and
  // little hands tap twice): the countdown only ever moves forward
  press(k) { if (this.tricks[k][0] === 'sleepNight' && this.acts.on('sleepNight')) return; super.press(k); }
  act(a) {
    if (a === 'sleepNight') {
      if (this.nights >= 3) this.nights = 0; // start the countdown again
      this.night = this.nights + 1;
      this.papa.say('talk', 1.6); this.say('Mama can see that moon too.', 640, 330, 32, FOX.cream);
    }
  }
  // one night: Papa says goodnight (0 - 1.8), the twins sleep (1.8 - 4.6),
  // morning comes and a moon on the calendar lights up (4.6 - 6.4)
  tick(dt, t, A) {
    if (A.on('sleepNight')) {
      const k = A.t('sleepNight'), asleep = k > 1.8 && k < 4.6;
      for (const c of [this.blue, this.rust]) c.base = asleep ? 'joy' : 'idle';
      if (this.at('sleepNight', 1.9)) { sfx('yawn', 0.5); this.say('Zzz', 670, 420, 40, FOX.cream); }
      if (this.at('sleepNight', 4.6)) {
        this.nights = this.night; sfx('chime', 0.8, 1 + this.nights * 0.12);
        this.say(['', 'One sleep!', 'Two sleeps!', 'Three sleeps! Mama comes home today!'][this.nights], 640, 330, this.nights === 3 ? 36 : 44, FOX.ochre);
        if (this.nights === 3) { this.blue.wave = 2; this.rust.wave = 2; sfx('giggle', 0.8, 1.2); }
      }
    } else this.blue.base = this.rust.base = 'idle';
  }
  day() { // night (0) to morning (1): the painting is darkened at night, not drawn over
    const A = this.acts; if (!A.on('sleepNight')) return 0;
    const k = A.t('sleepNight'); return k < 4.2 ? 0 : k < 4.8 ? (k - 4.2) / 0.6 : k < 5.9 ? 1 : 1 - (k - 5.9) / 0.5;
  }
  draw() {
    const day = clamp(this.day(), 0, 1), dark = `brightness(${lerp(0.55, 1, day)}) saturate(${lerp(0.7, 1, day)})`;
    ctx.save(); ctx.filter = dark;
    const bg = art('bg-fox-bedroom'); if (bg) drawArt(bg); else this.paper();
    this.calBox = prop('calendar-' + this.nights, 348, 290, 150);
    for (const c of [this.blue, this.rust, this.papa]) c.draw();
    ctx.restore();
    this.finish();
  }
}

// ---------- 7. Mama comes home! (the cottage) ----------
class FoxHomePage extends FoxPage {
  constructor() {
    super({ name: 'fox-home', music: 'home', amb: 'fox-out',
      text: 'And then, at last, the door opens. “MAMAAAA!” Two little foxes run into Mama’s arms.',
      tricks: ['door', 'run', 'together'], who: ['The door', 'The twins', 'Everyone'],
      missing: ['evening sky and road behind the cottage'],
      durs: { door: 1.4, run: 2.2, together: 6 } });
    // inside, small in the doorway until they come out
    this.papa = new Fox('papa', 450, 556, { face: 1, h: 190 });
    this.blue = new Fox('blue', 438, 558, { face: 1, h: 110 });
    this.rust = new Fox('rust', 492, 558, { face: 1, h: 110 });
    this.mama = new Fox('mama', 1340, 698, { face: -1, h: 307 });
    this.cast = [this.papa, this.blue, this.rust, this.mama];
    this.opened = false; this.out = false; this.hugging = false;
    this.mama.moveTo(990, 698, 2.2, 7); // she walks up to the house
  }
  spots() {
    // the door opens on the first tap; once the family is standing in it, a tap there sends them out
    const s = [{ name: this.opened && !this.out ? 'run' : 'door', box: DOOR }, { name: 'together', box: this.mama.box() }];
    if (this.out) s.push({ name: 'run', box: this.blue.box() }, { name: 'run', box: this.rust.box() });
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
      sfx('hug', 1); sfx('smooch', 0.6, 1.1);
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
    setTimeout(() => { this.papa.leanTo = this.mama.leanTo = this.blue.leanTo = this.rust.leanTo = 0; this.hugging = false; }, 5200);
  }
  draw() {
    this.paper();
    prop(this.opened ? 'cottage-open' : 'cottage', COTTAGE.x, COTTAGE.y, COTTAGE.w);
    // the family inside, seen through the doorway, until they come out
    if (this.opened && !this.out) {
      ctx.save(); ctx.beginPath(); ctx.rect(DOOR[0], DOOR[1], DOOR[2] - DOOR[0], DOOR[3] - DOOR[1]); ctx.clip();
      for (const c of [this.papa, this.blue, this.rust]) c.draw();
      ctx.restore();
    }
    // Papa at the back, then Mama and her suitcase (which she carries in, then puts down), the twins in front
    if (this.out) this.papa.draw();
    this.mama.draw();
    prop('suitcase', Math.max(1080, this.mama.x + 90), 698, 110);
    if (this.out) { this.blue.draw(); this.rust.draw(); }
    prop('hydrangea', 100, 742, 260);
    this.finish();
  }
}

// ---------- 8. two little surprises (the living room) ----------
class FoxGiftsPage extends FoxPage {
  constructor() {
    super({ name: 'fox-gifts', music: 'cover', amb: 'fox-in',
      text: '“I brought something for each of you,” says Mama. “What’s inside?” ask the twins. Mama smiles. “You’ll have to wait and see.”',
      tricks: ['mamaHug'], who: ['Mama'],
      missing: ['two wrapped presents with ribbons', 'living-room walls and floor'],
      durs: { mamaHug: 3.8 } });
    this.blue = new Fox('blue', 520, 714, { face: 1 });
    this.rust = new Fox('rust', 760, 716, { face: -1 });
    this.mama = new Fox('mama', 960, 706, { face: -1 });
    this.papa = new Fox('papa', 1110, 708, { face: -1 });
    this.cast = [this.blue, this.rust, this.mama, this.papa];
  }
  spots() { return [{ name: 'mamaHug', box: this.mama.box() }]; }
  act(a) {
    if (a !== 'mamaHug') return;
    this.blue.moveTo(this.mama.x - 140, 714, 0.8, 16); this.rust.moveTo(this.mama.x - 70, 716, 0.6, 14); this.papa.moveTo(this.mama.x + 90, 708, 0.6, 0);
    setTimeout(() => {
      this.blue.face = 1; this.rust.face = 1; this.papa.face = -1;
      this.blue.say('joy', 1.8); this.rust.say('joy', 1.8); this.papa.say('wide', 1.8);
      this.blue.leanTo = 8; this.rust.leanTo = 6; this.papa.leanTo = -6; this.mama.leanTo = -4;
      sfx('hug', 1);
    }, 850);
    setTimeout(() => {
      this.blue.leanTo = this.rust.leanTo = this.papa.leanTo = this.mama.leanTo = 0;
      this.blue.moveTo(520, 714, 0.8, 12); this.rust.moveTo(760, 716, 0.5, 10); this.papa.moveTo(1110, 708, 0.6, 0);
      setTimeout(() => { this.blue.face = 1; this.rust.face = -1; this.papa.face = -1; }, 850);
    }, 2900);
    this.hugged = true;
  }
  draw() {
    this.paper();
    // the living-room furniture from the sheet
    prop('shelf', 120, 600, 230);
    prop('fireplace', 640, 560, 300);
    prop('lamp', 1225, 640, 90);
    prop('rug', 640, 772, 560);
    prop('sofa', 300, 690, 340);
    for (const c of [this.blue, this.rust, this.mama, this.papa]) c.draw();
    if (this.hugged && !this.acts.on('mamaHug')) { ctx.globalAlpha = 0.8 + Math.sin(this.st.t * 2) * 0.2; word('The End', 640, 300, 48, FOX.cream); ctx.globalAlpha = 1; }
    this.finish();
  }
}
