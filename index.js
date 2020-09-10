/**
 * Cookie used to bypass mature content warnings on Epic Games
 */
const AGE_GATE_COOKIE = JSON.parse('[{"name":"HAS_ACCEPTED_AGE_GATE_ONCE","value":"true","domain":"www.epicgames.com","path":"/","expires":-1,"size":30,"httpOnly":false,"secure":false,"session":true}]')

/**
 * Get purchase URLs for all promotional free items
 * @param  {object}         page   Puppeteer browser page
 * @param  {object}         client Puppeteer CDPSession
 * @return {array.<string>}        Array of purchase URLs
 */
module.exports.getPurchaseUrls = async (page, client) => {
  const cookies = (await client.send('Network.getAllCookies')).cookies;
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');

  await Promise.all([
    page.goto('https://www.epicgames.com/store/en-US'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  await page.waitFor(3000);
  await page.setCookie(...AGE_GATE_COOKIE);

  const hyperlinks = await page.$x("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'free')]");
  const itemUrls = [];
  console.debug('Item URLs:');

  for (const hyperlink of hyperlinks) {
    let url = await page.evaluate(element => element.href, hyperlink);

    if (!itemUrls.includes(url)) {
      console.debug(url);
      itemUrls.push(url);
    }
    else {
      console.debug(url + ' (duplicate)');
    }
  }

  const purchaseUrls = [];

  for (const url of itemUrls) {
    await Promise.all([
      page.goto(url),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    await page.waitFor(3000);

    let getItemButtons = await page.$x("//button[contains(., 'Get')]");
    console.debug(`Found ${getItemButtons.length} purchase URLs for: ${url}`);

    for (let i = 0; i < getItemButtons.length; ++i) {
      await Promise.all([
        getItemButtons[i].click(),
        page.waitForNavigation()
      ]);
      await page.waitFor(3000);

      const urlParams = new URLSearchParams(page.url());
      const redirectUrl = urlParams.get('redirectUrl');

      if (!purchaseUrls.includes(redirectUrl)) {
        console.debug(redirectUrl);
        purchaseUrls.push(redirectUrl);
      }
      else {
        console.debug(redirectUrl + ' (duplicate)');
      }

      if (i + 1 == getItemButtons.length) {
        break;
      }

      await Promise.all([
        page.goBack(),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      await page.waitFor(3000);

      getItemButtons = await page.$x("//button[contains(., 'Get')]");
    }
  }

  await page.setCookie(...cookies);
  return purchaseUrls;
}

/**
 * Log into Epic Games and get cookies
 * @param  {object} page     Puppeteer browser page
 * @param  {object} client   Puppeteer CDPSession
 * @param  {string} email    Optional account credential
 * @param  {string} password Optional account credential
 * @param  {string} code     Optional 2FA code
 * @return {object}          Updated login cookies
 */
module.exports.logIn = async (page, client, email, password, code) => {
  await Promise.all([
    page.goto('https://www.epicgames.com/id/login'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  await page.waitFor(3000);

  if (email && password) {
    await page.click('#login-with-epic');
    await page.waitFor(1000);

    await page.type('#email', email);
    await page.type('#password', password);

    const logInButton = await page.waitForSelector('#login');
    await page.waitFor(1000);

    try {
      await Promise.all([
        logInButton.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      await page.waitFor(3000);
    }
    catch (error) {
      throw new Error('Detected CAPTCHA challenge');
    }

    const isCodeRequired = page.url().includes('/mfa');

    if (isCodeRequired) {
      const codeInput = await page.waitForSelector('#code');
      await codeInput.click();
      await page.evaluate((element, value) => element.value = value, codeInput, code);

      const continueButton = await page.waitForSelector('#continue');
      await continueButton.click();
      await page.waitFor(1000);

      try {
        await Promise.all([
          continueButton.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        await page.waitFor(3000);
      }
      catch (error) {
        throw new Error('Detected invalid 2FA code');
      }
    }

    const cookies = (await client.send('Network.getAllCookies')).cookies;
    return cookies;
  }

  const isLoggedIn = page.url().includes('/account/personal');

  if (!isLoggedIn) {
    throw new Error('Detected invalid or expired cookies');
  }

  const cookies = (await client.send('Network.getAllCookies')).cookies;
  return cookies;
}

/**
 * Purchase items with purchase URLs
 * @param {object}         page Puppeteer browser page
 * @param {array.<string>} urls Array of purchase URLs
 * @return {array.<string>}     Array of successful purchase URLs
 */
module.exports.purchaseItems = async (page, urls) => {
  await page.setCookie(...AGE_GATE_COOKIE);

  const successfulPurchaseUrls = [];

  for (const url of urls) {
    await Promise.all([
      page.goto(url),
      page.waitForNavigation()
    ]);
    await page.waitFor(5000);

    const isItemAvailable = page.url().includes('/purchase/verify');

    if (isItemAvailable) {
      console.debug(`Available purchase: ${page.url()}`);
    }
    else {
      console.debug(`Already purchased: ${page.url()}`);
      continue;
    }

    const purchaseButton = await page.waitForSelector('.btn-primary');
    await page.waitFor(1000);
    await Promise.all([
      purchaseButton.click(),
      page.waitForNavigation()
    ]);
    await page.waitFor(3000);

    successfulPurchaseUrls.push(url);
  }

  return successfulPurchaseUrls;
}
