(async () => {
  const puppeteer = require('puppeteer');
  const epicGames = require('epic-games-bot');
  let totp = require('totp-generator');
  require('dotenv').config();
  const fs = require('fs').promises;

  let browser = null;
  let page = null;

  // Account credentials
  const username = process.env.USER;
  const password = process.env.PASS;
  let code = totp(process.env.CODE);

  try {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
    const client = await page.target().createCDPSession();
    let cookies = null;

    // Import cookies from file
    try {
      console.debug('Importing existing cookies...');
      const cookiesJSON = await fs.readFile('./cookies.json');
      cookies = JSON.parse(cookiesJSON);
    }
    catch (error) {
      console.debug('Failed to import existing cookies.');
    }

    // Log into Epic Games and get cookies
    try {
      console.debug('Logging in with existing cookies...');
      await page.setCookie(...cookies);
      cookies = await epicGames.logIn(page, client);
    }
    catch (error) {
      console.debug('Failed to log in with existing cookies.');
      console.debug('Logging in with account credentials...');
      code = totp(process.env.CODE);
      cookies = await epicGames.logIn(page, client, username, password, code);
    }

    // Save cookies to file
    console.debug('Successfully logged into Epic Games!');
    await fs.writeFile('./cookies.json', JSON.stringify(cookies));

    // Get purchase URLs for all promotional free items
    console.debug('Getting purchase URLs...');
    const purchaseUrls = await epicGames.getPurchaseUrls(page, client);

    // Purchase items with purchase URLs
    console.debug('Purchasing items...');
    const successfulPurchaseUrls = await epicGames.purchaseItems(page, purchaseUrls);

    // Print successful purchase URLs
    successfulPurchaseUrls.forEach(element => console.log(element));
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
