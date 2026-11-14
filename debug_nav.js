const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug_nav.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(logFile, line);
}

async function main() {
  fs.writeFileSync(logFile, 'Starting debug_nav...\n');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => log(`[CONSOLE ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => log(`[PAGEERROR]: ${err.message}`));
  page.on('requestfailed', req => log(`[REQFAIL]: ${req.url()} - ${req.failure()?.errorText}`));
  page.on('response', res => {
    if (res.status() >= 400) {
      log(`[HTTP ${res.status()}]: ${res.url()}`);
    }
  });

  log('Navigating with domcontentloaded to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  log('domcontentloaded reached! Waiting 5s...');
  await new Promise(r => setTimeout(r, 5000));

  const info = await page.evaluate(() => {
    return {
      readyState: document.readyState,
      title: document.title,
      hasCanvas: !!document.querySelector('canvas'),
      hasMembers: !!document.querySelector('#home-members'),
      hasGoal: !!document.querySelector('#home-goal'),
      membersTop: document.querySelector('#home-members')?.offsetTop,
      goalTop: document.querySelector('#home-goal')?.offsetTop,
      goalContextTop: document.querySelector('#home-goal-context')?.offsetTop
    };
  });
  log(`Evaluated state: ${JSON.stringify(info)}`);

  await page.screenshot({ path: path.join(__dirname, 'debug_nav_shot.png') });
  log('Saved debug_nav_shot.png');

  await browser.close();
  log('Done successfully!');
}

main().catch(err => {
  log(`Error: ${err.stack || err}`);
  process.exit(1);
});
