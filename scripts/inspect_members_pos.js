const puppeteer = require('puppeteer-core');

async function check() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const info = await page.evaluate(() => {
    const mem = document.getElementById('home-members');
    const cards = Array.from(document.querySelectorAll('.member-card'));
    return {
      membersRect: mem ? {
        top: mem.offsetTop,
        height: mem.offsetHeight
      } : null,
      cardsCount: cards.length,
      cards: cards.map(c => ({
        id: c.getAttribute('data-id'),
        top: c.offsetTop,
        height: c.offsetHeight
      })),
      bodyHeight: document.body.scrollHeight
    };
  });

  console.log('Page info:', JSON.stringify(info, null, 2));
  await browser.close();
}

check().catch(console.error);
