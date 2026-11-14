const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  console.log('Navigating to data URL...');
  await page.goto('data:text/html,<h1>Hello World</h1>', { timeout: 10000 });
  console.log('DATA URL SUCCESS! H1:', await page.$eval('h1', el => el.innerText));
  await browser.close();
})().catch(console.error);
