const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--use-gl=angle', '--use-angle=d3d11']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 15000));

  const base = 9288;
  const offsets = [47200, 47400, 47600, 47800, 48000];

  for (const off of offsets) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px);
    }, base + off);

    await new Promise(r => setTimeout(r, 3500));

    const state = await page.evaluate(() => {
      const g = window.goalTunnels;
      const ga = window.goalTunnelAstronauts;
      return {
        px: window.scrollManager.scrollPixel,
        isBlackTunnel: g ? g.isBlackTunnelActive : null,
        isWhiteTunnel: g ? g.isWhiteTunnelActive : null,
        whiteRatio: g ? g.whiteTunnelRatio : null,
        meshVisible: ga && ga.customAvatar ? ga.customAvatar.visible : null
      };
    });
    console.log('Offset ' + off + ':', JSON.stringify(state));
    await page.screenshot({ path: 'tunnel_offset_' + off + '.png' });
  }

  await browser.close();
})();
