// Captures what every button does, for the button pictures.
// For each page and each of its buttons: wait until the page is quiet, take a
// "before" frame, press the button, take a few frames while the trick plays.
// Writes PNGs to the output folder; crop.py turns them into button pictures.
//   node tools/capture.js <out-dir> [page-name ...]
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || 'thumbs-raw';
const only = process.argv.slice(3);
const FRAMES = [0.35, 0.7, 1.1, 1.6, 2.3]; // seconds after the press
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.waitForTimeout(1500);
  await p.keyboard.press('a');
  const pages = await p.evaluate(() => Book.pages.map(pg => pg.name));
  const canvas = p.locator('#page');
  for (let i = 0; i < pages.length; i++) {
    if (only.length && !only.includes(pages[i])) continue;
    await p.evaluate(i => { Book.turn = null; Book.cur = i; Book.pages[i].shown = 99; Book.pages[i].text = null; }, i);
    const names = await p.evaluate(() => Book.buttons());
    for (let j = 0; j < names.length; j++) {
      // every button starts from the page as it is when you first arrive (the book resets pages on each visit too)
      await p.evaluate(i => { const pg = Book.fresh(Book.pages[i].constructor); pg.shown = 99; pg.text = null; Book.pages[i] = pg; }, i);
      await p.waitForTimeout(600);
      // wait for the page to settle: no trick running, nobody walking
      for (let k = 0; k < 100; k++) {
        // (characters that wander on their own, like the daycare kids, are only waited for briefly)
        const quiet = await p.evaluate(k => { const pg = Book.page(); return Object.keys(pg.acts ? pg.acts.a : {}).length === 0 && !pg.kiss && (k > 25 || (pg.cast || []).every(c => c.tx === null || c.tx === undefined)); }, k);
        if (quiet) break;
        await p.waitForTimeout(100);
      }
      await p.waitForTimeout(300);
      const base = `${out}/${pages[i]}__${names[j]}`;
      await canvas.screenshot({ path: `${base}__0.png` });
      // remember what was there, so we can ask afterwards what the trick added
      await p.evaluate(() => { const pg = Book.page(); window.__seen = new Set(pg.st.bits); window.__seenW = new Set(pg.st.words);
        window.__pos = (pg.cast || []).map(c => [c.x, c.y, c.jy]); });
      await p.evaluate(j => Book.pressButton(j), j);
      let last = 0;
      // a page that knows its trick's best moment gets one picture, taken right then
      const hasPeak = await p.evaluate(() => !!Book.page().peak);
      if (hasPeak) for (let w = 0; w < 120 && !(await p.evaluate(() => Book.page().peak())); w++) await p.waitForTimeout(40);
      for (let f = 0; f < (hasPeak ? 1 : FRAMES.length); f++) {
        if (!hasPeak) { await p.waitForTimeout((FRAMES[f] - last) * 1000); last = FRAMES[f]; }
        await p.evaluate(() => { window.__freeze = true; });
        await p.waitForTimeout(50);
        await canvas.screenshot({ path: `${base}__${f + 1}.png` });
        // where the action is, in page units: new bits and words, and anyone acting or moving
        const focus = await p.evaluate(() => {
          const pg = Book.page(), pts = [];
          pg.st.bits.forEach(b => { if (!window.__seen.has(b)) pts.push([b.x, b.y]); });
          const words = [];
          pg.st.words.forEach(w => { if (!window.__seenW.has(w)) words.push([w.x, w.y]); });
          (pg.cast || []).forEach((c, i) => {
            const [x0, y0, j0] = window.__pos[i] || [];
            if (c.a || c.tx != null || c.jy !== j0 || Math.abs(c.x - x0) > 2) {
              const h = 160 * c.scale; pts.push([c.x - 60 * c.scale, c.y + c.jy - h], [c.x + 60 * c.scale, c.y + c.jy + 6]);
            }
          });
          if (pg.focus) pts.push(...pg.focus());
          if (pg.kiss) { pts.push([pg.mama.x, pg.mama.y - 200]); const [hx, hy] = pg.kiss.target.head(); pts.push([hx, hy]); }
          return { pts, words, peak: !!(pg.peak && pg.peak()) };
        });
        require('fs').writeFileSync(`${base}__${f + 1}.json`, JSON.stringify(focus));
        await p.evaluate(() => { window.__freeze = false; });
      }
      console.log('captured', pages[i], names[j]);
    }
  }
  if (errs.length) console.log('page errors:', errs);
  await b.close();
})();
