import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

page.on('console', msg => console.log('[BROWSER]', msg.text()));
page.on('pageerror', err => console.error('[PAGE ERROR]', err));

console.log('Opening http://localhost:3000/...');
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

console.log('Waiting 8 seconds for initial render and custom avatar load...');
await new Promise(r => setTimeout(r, 8000));

const status = await page.evaluate(() => {
  const gta = window.goalTunnelAstronauts;
  return {
    hasGta: !!gta,
    hasCustomAvatar: !!gta?.customAvatar,
    useCustomAvatar: gta?.useCustomAvatar,
    customAvatarVisible: gta?.customAvatar?.visible,
    customAvatarPosition: gta?.customAvatar?.position,
  };
});

console.log('Avatar Status in Engine:', status);

await browser.close();
