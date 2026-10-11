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

  const domInfo = await page.evaluate(() => {
    const el = document.querySelector('#home-goal');
    return {
      hasEl: !!el,
      rect: el ? el.getBoundingClientRect() : null,
      top: el ? el.offsetTop : null
    };
  });
  console.log('DOM info:', JSON.stringify(domInfo, null, 2));

  if (domInfo.hasEl) {
    // Scroll directly to home-goal top
    await page.evaluate(() => {
      const el = document.querySelector('#home-goal');
      window.scrollTo(0, el.offsetTop);
      window.dispatchEvent(new Event('scroll'));
    });
    await new Promise(r => setTimeout(r, 3000));

    // Wheel down slightly to engage virtual scroller inside goal
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel({ deltaY: 600 });
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 3000));

    const status = await page.evaluate(() => {
      const g = window.goalTunnels;
      const ga = window.goalTunnelAstronauts;
      return {
        scrollY: window.scrollY,
        isBlackTitle: g ? g.isBlackTitleActive : null,
        isBlackTunnel: g ? g.isBlackTunnelActive : null,
        isWhiteTunnel: g ? g.isWhiteTunnelActive : null,
        whiteTunnelRatio: g ? g.whiteTunnelRatio : null,
        avatarVisible: ga && ga.customAvatar ? ga.customAvatar.visible : null
      };
    });
    console.log('Status inside goal:', JSON.stringify(status, null, 2));
    await page.screenshot({ path: 'home_goal_entered.png' });
    console.log('Saved home_goal_entered.png');
  }

  await browser.close();
})();
