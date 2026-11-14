const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 700));
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 600));

  const session = await page.target().createCDPSession();
  await session.send('Profiler.enable');
  await session.send('Profiler.start');

  for (let i = 0; i < 25; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }

  const { profile } = await session.send('Profiler.stop');
  await session.send('Profiler.disable');

  const nodes = profile.nodes;
  const timeDeltas = profile.timeDeltas;
  const sampleMap = {};
  for (let i = 0; i < profile.samples.length; i++) {
    const id = profile.samples[i];
    sampleMap[id] = (sampleMap[id] || 0) + (timeDeltas[i] || 0);
  }

  const sorted = Object.entries(sampleMap).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('Top heavy functions during scroll (ms):');
  for (const [id, time] of sorted) {
    const node = nodes.find(n => n.id === Number(id));
    if (node) {
      const fn = node.callFrame.functionName || '(anonymous)';
      const file = node.callFrame.url.split('/').pop();
      const line = node.callFrame.lineNumber;
      const col = node.callFrame.columnNumber;
      console.log((time / 1000).toFixed(1) + 'ms - ' + fn + ' (' + file + ':' + line + ':' + col + ')');
    }
  }

  await browser.close();
})();
