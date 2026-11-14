import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://rahiseko-alt.github.io/antigravity1011/';

async function runTrace() {
  console.log('Launching browser for CDP trace...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--ignore-gpu-blocklist',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable Profiler via CDP
  const cdp = await page.target().createCDPSession();
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); // 100 microseconds for high resolution
  await cdp.send('Profiler.start');

  console.log('CDP Profiler started. Navigating...');
  await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 30000 });
  
  // Wait 10 seconds total from navigation
  console.log('Waiting 8 seconds while profiling...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('Stopping CDP Profiler...');
  const { profile } = await cdp.send('Profiler.stop');
  fs.writeFileSync('cpu_profile.json', JSON.stringify(profile, null, 2));
  console.log('CPU Profile saved to cpu_profile.json');

  await browser.close();
}

runTrace().catch(err => {
  console.error(err);
  process.exit(1);
});
