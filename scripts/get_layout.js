const puppeteer = require('puppeteer-core');

async function getLayout() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const layout = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('.section'));
    return sections.map(s => {
      const rect = s.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      return {
        id: s.id,
        className: s.className,
        top: Math.round(top),
        height: Math.round(rect.height),
        bottom: Math.round(top + rect.height)
      };
    });
  });

  console.log('Page layout:', JSON.stringify(layout, null, 2));
  await browser.close();
}

getLayout().catch(console.error);
