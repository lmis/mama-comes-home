// ---------- 12. the train ride home ----------
// The late train comes at last: it rattles through the night in front of the
// painted city, which slides slowly past behind it.
class RidePage extends StoryPage {
  constructor() {
    super({ name: 'ride', floor: 720,
      text: 'At last, the train comes! Mama hops on, and it rattles through the sleepy city, all the way home.',
      tricks: [['faster', 'shoot', 'birds'], [], ['think']],
      who: ['Night train', '', 'Mama'],
      durs: { faster: 3, shoot: 2.4, birds: 3.4, think: 4.5 } });
    this.scroll = 0;
  }
  act(a) {
    const st = this.st;
    if (a === 'faster') { sfx('chug', 1); st.say('FASTER!', 640, 300, 56, '#ffd25a'); }
    if (a === 'birds') { sfx('flutter', 0.8); sfx('tweet', 0.5); }
    if (a === 'think') { sfx('hug', 0.6); }
    if (a === 'shoot') { sfx('shimmer', 1); st.say('MAKE A WISH!', 640, 200, 44, '#fff3a0'); }
  }
  tick(dt, t, A) {
    const fast = A.on('faster') ? Math.sin(Math.PI * clamp(A.t('faster') / 3, 0, 1)) : 0;
    this.scroll += dt * (90 + fast * 260);
  }
  draw() {
    const st = this.st, t = st.t, A = this.acts;
    const bg = art('bg-12-night-sky');
    if (bg) drawArtScroll(bg, this.scroll); else rect(0, 0, W, H, grad(0, 0, 0, H, ['#0f1440', '#232c6a', '#3a3a7c']));
    if (A.on('shoot')) { const k = A.t('shoot') / 1.4; if (k < 1) { const x = lerp(100, 900, k), y = lerp(140, 280, k); line(x - 150, y - 26, x, y, 3, 'rgba(255,246,200,0.6)', 0); star(x, y, 12, t * 6, 5, '#fff6c8', 0); glow(x, y, 40, '#fff3a0', 0.6); } }
    // birds flying past the other way
    if (A.on('birds')) { const k = A.t('birds') / 3.4; for (let i = 0; i < 4; i++) drawBird(lerp(-120, W + 160, k) - i * 70, 200 + i * 26 + Math.sin(t * 5 + i) * 10, 0.9, t * 22 + i, '#6482d2', 1); }
    st.draw(0);
    // the train, wobbling along, with Mama at a window
    const waving = false, kissing = false, pointing = false, thinking = A.on('think');
    push(0, Math.sin(t * 7) * 3 + Math.sin(t * 2.3) * 2, Math.sin(t * 3.1) * 0.4);
    drawTrainArt(1240, 772, t, { moving: true, cars: 2, window: { car: 0, draw: (x, y) => { // wheels below the page edge, so no tracks
      this.winX = x; this.winY = y; // for the thought bubble
      const head = rigImg(MAMA_RIG, thinking ? 'head-sleepy' : 'head-happy');
      if (!head || !rigReady(MAMA_RIG)) return;
      const arm = rigImg(MAMA_RIG, 'arm');
      if (waving || pointing) { push(x + 14, y - 2, waving ? -60 + Math.sin(t * 14) * 22 : -20, 0.3, 0.3); ctx.drawImage(arm, -arm.naturalWidth * 0.25, -arm.naturalHeight * 0.2); pop(); }
      push(x, y - 26, 0, 0.3, 0.3); ctx.drawImage(head, -head.naturalWidth / 2, -head.naturalHeight * 0.6); pop();
    } } });
    pop();
    // Mama thinks of Papa and the twins: a cloud with their faces, little puffs leading up to it
    if (thinking && this.winX !== undefined) {
      const k = A.t('think'), a = clamp(k / 0.5, 0, 1) * clamp((4.5 - k) / 0.5, 0, 1), puff = art('fx-puff');
      ctx.save(); ctx.globalAlpha = a;
      const cx = this.winX + 140, cy = 190;
      if (puff) {
        [[18, 0.25], [40, 0.4]].forEach(([d, sz], i) => { if (k > 0.2 + i * 0.25) ctx.drawImage(puff, this.winX + d * (i + 1) - 30 * sz, this.winY - 70 - i * 60 - 30 * sz, 90 * sz, 86 * sz); });
        if (k > 0.8) ctx.drawImage(puff, cx - 210, cy - 130, 420, 410 * 0.98);
      }
      if (k > 1) {
        const s = Math.min(1, (k - 1) * 3);
        [[PAPA_RIG, -100, 1.15, 1], [LEO_RIG, 20, 0.95, -1], [LOUIS_RIG, 120, 0.95, -1]].forEach(([rig, dx, sc, f]) => {
          push(cx + dx, cy + 40 + Math.sin(t * 2 + dx) * 4, 0, f * sc * s, sc * s); drawFace(rig, { t, blink: false }); pop(); });
        if (Math.random() < 0.05) st.hearts(cx, cy - 30, 1);
      }
      ctx.restore();
    }
    st.draw(1); st.draw(2); st.drawWords();
  }
}
