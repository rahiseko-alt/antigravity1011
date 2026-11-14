const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-insecure-localhost',
      '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessRespectPreflightResults,PrivateNetworkAccessSendPreflights'
    ]
  });
  const page = await browser.newPage();
  console.log('Navigating to http://localhost:3000 with disabled web security...');
  const t0 = Date.now();
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log(`SUCCESS IN ${Date.now() - t0}ms! Title:`, await page.title());
  await browser.close();
})().catch(console.error);
