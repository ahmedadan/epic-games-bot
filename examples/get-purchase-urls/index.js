(async () => {
  const puppeteer = require('puppeteer');
  const epicGames = require('epic-games-bot');

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    const client = await page.target().createCDPSession();

    // Get purchase URLs for all promotional free items
    console.debug('Getting purchase URLs...');
    const purchaseUrls = await epicGames.getPurchaseUrls(page, client);

    // Print purchase URLs
    purchaseUrls.forEach(element => console.log(element));
    await browser.close();
  }
  catch (error) {
    console.error(error);

    if (page) {
      await page.screenshot({ path: './error-screenshot.jpg', type: 'jpeg' });
    }

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
})();
