const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('data:text/html,<h1>Test Fetch</h1>');
  console.log('Testing fetch from inside page...');
  const res = await page.evaluate(async () => {
    try {
      const r = await fetch('http://127.0.0.1:3000/', { method: 'GET' });
      return { ok: r.ok, status: r.status, type: r.type };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Fetch result:', res);
  await browser.close();
})().catch(console.error);
