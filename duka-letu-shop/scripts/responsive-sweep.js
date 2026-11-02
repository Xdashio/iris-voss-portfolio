// Screens every page at 1440px and 390px; reports horizontal overflow, h1 count and JS errors.
const { chromium } = require('playwright');
const SH = (process.env.SHOTS_DIR || '/tmp') + '/';
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const pages = ['/', '/products', '/category/audio', '/product/jc-7125-rechargeable-torch', '/cart', '/checkout', '/track', '/staff/login',
  '/staff', '/staff/orders', '/staff/products', '/staff/inventory', '/staff/pos', '/staff/team', '/staff/settings'];
(async () => {
  const b = await chromium.launch();
  for (const w of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/');
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('duka.cart', JSON.stringify([{ productId: 'torch-jc7125', variantId: 'torch-jc7125-v1', qty: 2 }, { productId: 'kettle-ailyons', variantId: 'kettle-ailyons-v1', qty: 1 }])); });
    for (const path of pages) {
      if (path === '/staff') await p.evaluate(() => localStorage.setItem('duka.session', 'staff_owner'));
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ ox: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length }));
      const name = (path === '/' ? 'home' : path.slice(1).replace(/\//g, '_')) + '-' + w;
      await p.screenshot({ path: SH + 'sw-' + name + '.png', fullPage: true });
      console.log(`${w} ${path.padEnd(42)} overflowX=${r.ox} h1=${r.h1}`);
    }
    console.log('errors:', errs.length ? errs : 'none');
    await ctx.close();
  }
  await b.close();
})();
