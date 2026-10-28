// ---------- start-up, the frame loop and the keys ----------
(function () {
  const canvas = document.getElementById('page');
  const main = canvas.getContext('2d');
  const offA = document.createElement('canvas'), offB = document.createElement('canvas');
  let scale = 1;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(320, Math.min(2200, Math.round(r.width * dpr)));
    canvas.width = bw; canvas.height = Math.round(bw * H / W);
    offA.width = offB.width = canvas.width; offA.height = offB.height = canvas.height;
    scale = canvas.width / W;
  }
  window.addEventListener('resize', resize);
  resize();

  Book.init();
  Book.reduce = reduce; for (const p of Book.pages) if (reduce) p.reduce = true;

  function prep(g) {
    ctx = g;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (!window.__freeze) Book.update(dt); // (the button-picture tool holds the book still while it takes a picture)
    if (Book.turn) {
      const tr = Book.turn, lo = Math.min(tr.from, tr.to), hi = Math.max(tr.from, tr.to);
      const k = ease(tr.t / tr.dur), e = tr.dir > 0 ? k : 1 - k;
      prep(offA.getContext('2d')); drawPage(Book.pages[lo]);
      prep(offB.getContext('2d')); drawPage(Book.pages[hi]);
      prep(main); main.fillStyle = '#3a2430'; main.fillRect(0, 0, W, H);
      drawTurn(main, offA, offB, e);
    } else {
      prep(main);
      main.save(); main.translate((Book.nudge || 0) * -40, 0);
      drawPage(Book.page());
      main.restore();
      drawOverlay();
    }
    requestAnimationFrame(frame);
  }

  // page corners and dots, drawn over the page while it rests
  function drawOverlay() {
    const p = Book.page(), t = p.st.t, n = Book.pages.length;
    for (let i = 0; i < n; i++) circ(640 - (n - 1) * 11 + i * 22, 700, i === Book.cur ? 6 : 4, i === Book.cur ? '#fffaf0' : 'rgba(255,250,240,0.5)', i === Book.cur ? 2 : 0);
    const ready = !p.text || p.shown > TEXT_DELAY + 0.5 + p.text.split(' ').length / TEXT_WPS;
    if (Book.cur < n - 1) {
      // a folded-up corner bottom right that wiggles once the text has been read
      const k = ready ? 1 + Math.sin(t * 4) * 0.25 : 0.6, s = 46 * k;
      ctx.save(); ctx.shadowColor = 'rgba(40,20,30,0.35)'; ctx.shadowBlur = 8;
      poly([W, H - s, W - s, H, W - s, H - s], '#f6eedd', 2);
      ctx.restore();
      if (ready) chevron(W - 26, 360, 1, t);
    }
    if (Book.cur > 0) chevron(26, 360, -1, t);
    if (Book.cur === 0) {
      const a = 0.75 + 0.25 * Math.sin(t * 3);
      ctx.globalAlpha = a;
      word('Press  →  to open the book', 640, 398, 30, 0, '#fff3a0');
      ctx.globalAlpha = 1;
    }
  }
  function chevron(x, y, dir, t) {
    const o = Math.sin(t * 3) * 4 * dir;
    ctx.globalAlpha = 0.55;
    line(x + o - dir * 8, y - 16, x + o + dir * 6, y, 6, '#fffaf0', 2);
    line(x + o + dir * 6, y, x + o - dir * 8, y + 16, 6, '#fffaf0', 2);
    ctx.globalAlpha = 1;
  }

  // ---- input ----
  function act(k) {
    audioStart();
    if (k === 'next') Book.go(1);
    else if (k === 'prev') Book.go(-1);
    else if (typeof k === 'number') Book.pressButton(k);
    else Book.pressButton({ space: 0, enter: 1, ctrl: 2 }[k]);
  }
  window.addEventListener('keydown', e => {
    if (document.getElementById('menu').open) return; // the page menu has the keys
    let k = null;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') k = 'next';
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') k = 'prev';
    else if (e.key === ' ' || e.code === 'Space') k = 'space';
    else if (e.key === 'Enter') k = 'enter';
    else if (e.key === 'Control') k = 'ctrl';
    else if (/^Digit[1-6]$|^Numpad[1-6]$/.test(e.code)) k = +e.code.slice(-1) - 1;
    if (!k) { if (!AU.ctx) audioStart(); return; }
    e.preventDefault();
    if (e.repeat) return;
    act(k);
    flash(k);
  });
  canvas.addEventListener('pointerdown', e => {
    canvas.focus();
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (x < 0.12) act('prev'); else if (x > 0.88) act('next'); else if (!AU.ctx) audioStart();
  });
  let tapN = 0;
  // the buttons go the moment a finger lands on them, so long presses, slides and squashes all count;
  // a click with no pointer (keyboard Enter or Space on a focused button) works too
  function onPress(b, f) {
    b.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); f(); canvas.focus(); });
    b.addEventListener('click', e => { if (e.detail === 0) f(); });
  }
  document.querySelectorAll('[data-slot]').forEach(b => onPress(b, () => act(+b.dataset.slot)));
  document.querySelectorAll('[data-key]').forEach(b => onPress(b, () => act(b.dataset.key)));
  // nothing a small hand does should select, copy, zoom or open a menu
  for (const ev of ['contextmenu', 'selectstart', 'dragstart', 'gesturestart', 'dblclick']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false }); // no pinch zoom
  function flash() {}
  // the page-turn buttons grey out at the ends of the book
  setInterval(() => {
    document.querySelector('[data-key="prev"]').disabled = Book.cur === 0;
    document.querySelector('[data-key="next"]').disabled = Book.cur === Book.pages.length - 1;
    // only as many colour buttons as this page has tricks
    const n = Book.buttons().length;
    document.querySelectorAll('[data-slot]').forEach(b => { b.hidden = +b.dataset.slot >= n; });
    // a picture of what the button does, where the page has them (page 1 for now)
    const names = Book.buttons(), pg = Book.page().name;
    document.querySelectorAll('[data-slot]').forEach(b => {
      const src = typeof ART !== 'undefined' && ART[`btn-${pg}-${names[+b.dataset.slot]}`];
      b.classList.toggle('pic', !!src);
      b.style.backgroundImage = src ? `url(${src})` : '';
      b.setAttribute('aria-label', LABEL[names[+b.dataset.slot]] || `Button ${+b.dataset.slot + 1}`);
    });
  }, 200);
  const mute = document.getElementById('mute');
  onPress(mute, () => {
    audioStart(); setMuted(!AU.muted);
    mute.setAttribute('aria-pressed', AU.muted ? 'true' : 'false');
    mute.setAttribute('aria-label', AU.muted ? 'Sound off' : 'Sound on');
  });
  // the page menu: a little picture of every page; pick one to turn straight to it
  const TITLES = ['Mama Comes Home', 'Breakfast', 'Bye-bye at the station', 'The tall tower', 'The robot office', 'Papa on rollerblades', 'Daycare', 'The meeting', 'Home with Papa', 'Dinner', 'We want Mama!', 'The rainy station', 'The train home', 'Mama is home', 'Goodnight'];
  const menu = document.getElementById('menu'), grid = menu.querySelector('.menu-grid'), pagesBtn = document.getElementById('pages');
  const tiles = Book.pages.map((pg, i) => {
    const b = document.createElement('button'); b.type = 'button';
    const c = document.createElement('canvas'); c.width = 320; c.height = 180;
    const cap = document.createElement('span'); cap.innerHTML = `<b>${i + 1}</b>`; cap.append(TITLES[i] || pg.name);
    b.append(c, cap); grid.append(b);
    b.addEventListener('click', () => { menu.close(); audioStart(); Book.goTo(i); canvas.focus(); });
    return { b, c };
  });
  function snapshots() { // a picture of each page as it is right now, without its story text
    const keep = ctx;
    tiles.forEach(({ c }, i) => {
      const g = c.getContext('2d'); ctx = g; g.setTransform(c.width / W, 0, 0, c.width / W, 0, 0); g.lineJoin = g.lineCap = 'round';
      try { ctx.save(); Book.pages[i].draw(); ctx.restore(); } catch (e) {}
    });
    ctx = keep;
  }
  function openMenu() {
    if (menu.open) return;
    snapshots(); setTimeout(() => menu.open && snapshots(), 500); // again once any pictures have finished loading
    tiles.forEach(({ b }, i) => { b.removeAttribute('aria-current'); if (i === Book.cur) b.setAttribute('aria-current', 'page'); });
    menu.showModal(); tiles[Book.cur].b.focus();
  }
  // start decoding all the paintings early, so pages (and the menu) never show the stand-in drawings
  setTimeout(() => { if (typeof ART !== 'undefined') Object.keys(ART).forEach(n => art(n)); }, 1200);
  onPress(pagesBtn, openMenu);
  menu.querySelector('.menu-close').addEventListener('click', () => menu.close());
  menu.addEventListener('click', e => { if (e.target === menu) menu.close(); }); // click outside the box
  window.addEventListener('keydown', e => { if ((e.key === 'p' || e.key === 'P') && !menu.open) { e.preventDefault(); openMenu(); } });
  // the magnifying glass: drag it out of its corner over the page; it stays where it is put
  // (and keeps showing the page moving) until it is dragged back into the corner
  const loupe = document.getElementById('loupe'), lens = document.getElementById('lens'), lg = lens.getContext('2d');
  const ZOOM = 3.6;
  let glass = null, drag = null, dropped = 0; // glass: where the lens is; drag: the finger or mouse moving it
  function lensAt(x, y) { // x, y: the lens centre, in screen pixels
    const size = lens.offsetWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (lens.width !== size * dpr) lens.width = lens.height = size * dpr;
    lens.style.left = (x - size / 2) + 'px'; lens.style.top = (y - size / 2) + 'px';
    const r = canvas.getBoundingClientRect();
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.fillStyle = '#2a1a22'; lg.fillRect(0, 0, lens.width, lens.height);
    if (Book.turn) { // mid page-turn: just enlarge what is on screen
      const k = canvas.width / r.width, sw = size / ZOOM * k;
      lg.drawImage(canvas, (x - r.left) * k - sw / 2, (y - r.top) * k - sw / 2, sw, sw, 0, 0, lens.width, lens.height);
      return;
    }
    // otherwise paint the page again, enlarged, so the paintings stay sharp
    const px = (x - r.left) / r.width * W, py = (y - r.top) / r.height * H, s = lens.width / (size / ZOOM / r.width * W);
    const keep = ctx; ctx = lg;
    lg.setTransform(s, 0, 0, s, lens.width / 2 - px * s, lens.height / 2 - py * s); lg.lineJoin = lg.lineCap = 'round';
    try { drawPage(Book.page()); } catch (e) {}
    ctx = keep;
  }
  function lensFrame() {
    if (!glass) return;
    lensAt(glass.x, glass.y);
    requestAnimationFrame(lensFrame);
  }
  function home() { const r = loupe.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function startDrag(e, el, fromCorner) {
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    // out of the corner on a touch screen, the lens floats above the finger so the finger doesn't hide it
    const off = fromCorner ? [0, e.pointerType === 'touch' ? -lens.offsetWidth * 0.7 : 0] : [glass.x - e.clientX, glass.y - e.clientY];
    drag = { id: e.pointerId, off };
    if (!glass) { glass = { x: e.clientX + off[0], y: e.clientY + off[1] }; document.body.classList.add('loupe-on'); lensFrame(); }
    document.body.classList.add('loupe-drag');
  }
  function moveDrag(e) { if (drag && e.pointerId === drag.id) { glass.x = e.clientX + drag.off[0]; glass.y = e.clientY + drag.off[1]; } }
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null; document.body.classList.remove('loupe-drag'); dropped = performance.now();
    const [hx, hy] = home();
    if (Math.hypot(glass.x - hx, glass.y - hy) < lens.offsetWidth * 0.6) { glass = null; document.body.classList.remove('loupe-on'); } // back in its corner
  }
  for (const [el, fromCorner] of [[loupe, true], [lens, false]]) {
    el.addEventListener('pointerdown', e => { if (fromCorner && glass) return; startDrag(e, el, fromCorner); });
    el.addEventListener('pointermove', moveDrag);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }
  loupe.addEventListener('click', () => { if (glass && !drag && performance.now() - dropped > 300) { glass = null; document.body.classList.remove('loupe-on'); } }); // a tap on the corner also puts it away
  requestAnimationFrame(frame);
})();
