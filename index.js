const AGE_GATE_COOKIE = JSON.parse('[{"name":"HAS_ACCEPTED_AGE_GATE_ONCE","value":"true","domain":"www.epicgames.com","path":"/","expires":-1,"size":30,"httpOnly":false,"secure":false,"session":true}]')

module.exports = {
  /**
   * Get all free item URLs on Epic Games
   * @param  {object}         page   Puppeteer browser page
   * @param  {object}         client Puppeteer CDPSession
   * @return {array.<string>}        Array of purchase URLs
   */
  getURLs: async (page, client) => {
    console.info('Getting purchase URL(s)...')

    await Promise.all([
      page.goto('https://www.epicgames.com/store/en-US'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ])

    await page.waitFor(3000)

    const hyperlinks = await page.$x("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'free')]")
    const itemURLs = []

    console.info('Item URL(s):')

    for (const hyperlink of hyperlinks) {
      let url = await page.evaluate(element => element.href, hyperlink)

      if (!itemURLs.includes(url)) {
        console.info(url)
        itemURLs.push(url)
      }
      else {
        console.info(url + ' (duplicate)')
      }
    }

    const cookies = (await client.send('Network.getAllCookies')).cookies

    await client.send('Network.clearBrowserCookies')
    await client.send('Network.clearBrowserCache')

    await page.setCookie(...AGE_GATE_COOKIE)

    const purchaseURLs = []

    for (const url of itemURLs) {
      await Promise.all([
        page.goto(url),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ])

      await page.waitFor(3000)

      let getItemButtons = await page.$x("//button[contains(., 'Get')]")

      console.info(`Found ${getItemButtons.length} purchase URL(s) for: ${url}`)

      for (let i = 0; i < getItemButtons.length; ++i) {
        await Promise.all([
          getItemButtons[i].click(),
          page.waitForNavigation()
        ])

        await page.waitFor(3000)

        const urlParams = new URLSearchParams(page.url())
        const redirectURL = urlParams.get('redirectUrl')

        if (!purchaseURLs.includes(redirectURL)) {
          console.info(redirectURL)
          purchaseURLs.push(redirectURL)
        }
        else {
          console.info(redirectURL + ' (duplicate)')
        }

        if (i + 1 == getItemButtons.length) {
          break
        }

        await Promise.all([
          page.goBack(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])

        await page.waitFor(3000)

        getItemButtons = await page.$x("//button[contains(., 'Get')]")
      }
    }

    await page.setCookie(...cookies)
    return purchaseURLs
  },

  /**
   * Log into Epic Games and renew cookies
   * @param  {object} page            Puppeteer browser page
   * @param  {object} client          Puppeteer CDPSession
   * @param  {string} email           Optional account credential
   * @param  {string} password        Optional account credential
   * @param  {string} code            Optional 2FA code
   * @return {object}                 Updated login cookies
   */
  login: async (page, client, email, password, code) => {
    if (email && password) {
      console.info('Logging in with account credentials...')

      await Promise.all([
        page.goto('https://www.epicgames.com/id/login'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ])

      await page.waitFor(3000)

      await page.click('#login-with-epic')

      await page.waitFor(1000)

      await page.type('#email', email)
      await page.type('#password', password)

      const loginButton = await page.waitForSelector('#login')

      await page.waitFor(1000)

      try {
        await Promise.all([
          loginButton.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])
      }
      catch (error) {
        throw new Error('Detected CAPTCHA challenge from Epic Games')
      }

      await page.waitFor(3000)

      const is2FAEnabled = page.url().includes('/mfa')

      if (!is2FAEnabled) {
        const cookies = (await client.send('Network.getAllCookies')).cookies
        return cookies
      }

      const codeInput = await page.waitForSelector('#code')
      await codeInput.click()
      await page.evaluate((element, value) => element.value = value, codeInput, code);

      const continueButton = await page.waitForSelector('#continue')
      await continueButton.click()

      await page.waitFor(1000)

      try {
        await Promise.all([
          continueButton.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])
      }
      catch (error) {
        throw new Error('Invalid 2FA code')
      }

      await page.waitFor(3000)

      const cookies = (await client.send('Network.getAllCookies')).cookies
      return cookies
    }

    console.info('Logging in with existing cookies...')

    await Promise.all([
      page.goto('https://www.epicgames.com/site/en-US/error-404'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ])

    await page.waitFor(3000)

    const isLoggedInMenuItem = await page.$('.is-logged-in')

    if (!isLoggedInMenuItem) {
      throw new Error('Existing cookies are invalid / expired')
    }

    const cookies = (await client.send('Network.getAllCookies')).cookies
    return cookies
  },

  /**
   * Purchase item(s) on Epic Games
   * @param {object}         page Puppeteer browser page
   * @param {array.<string>} urls Array of purchase URLs
   */
  purchaseAll: async (page, urls) => {
    console.info('Purchasing items...')
    await page.setCookie(...AGE_GATE_COOKIE)

    for (const url of urls) {
      await Promise.all([
        page.goto(url),
        page.waitForNavigation()
      ])

      await page.waitFor(5000)

      const isItemAvailable = page.url().includes('/purchase/verify')

      if (isItemAvailable) {
        console.info(`Available purchase: ${page.url()}`)
      }
      else {
        console.info(`Already purchased: ${page.url()}`)
        continue
      }

      const purchaseButton = await page.waitForSelector('.btn-primary')

      await page.waitFor(1000)

      await Promise.all([
        purchaseButton.click(),
        page.waitForNavigation()
      ])

      await page.waitFor(3000)
    }
  }
}
