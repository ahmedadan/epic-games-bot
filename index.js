const AGE_GATE_COOKIE = JSON.parse('[{"name":"HAS_ACCEPTED_AGE_GATE_ONCE","value":"true","domain":"www.epicgames.com","path":"/","expires":-1,"size":30,"httpOnly":false,"secure":false,"session":true}]')

module.exports = {
  /**
   * Get all free item URLs on Epic Games
   * @param  {object}         page   Puppeteer browser page
   * @param  {object}         client Puppeteer CDPSession
   * @return {array.<string>}        Array of purchase URLs
   */
  getURLs: async (page, client) => {
    await Promise.all([
      page.goto('https://www.epicgames.com/store/en-US'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ])

    await page.waitFor(3000)

    const hyperlinks = await page.$x("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'free')]")
    const hrefs = []

    for (const hyperlink of hyperlinks) {
      const href = await page.evaluate(element => element.href, hyperlink)

      if (!hrefs.includes(href)) {
        hrefs.push(href)
      }
    }

    const cookies = (await client.send('Network.getAllCookies')).cookies

    await client.send('Network.clearBrowserCookies')
    await client.send('Network.clearBrowserCache')

    await page.setCookie(...AGE_GATE_COOKIE)

    const urls = []

    for (const href of hrefs) {
      await Promise.all([
        page.goto(href),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ])

      await page.waitFor(3000)

      let getItemButtons = await page.$x("//button[contains(., 'Get')]")

      for (let i = 0; i < getItemButtons.length; ++i) {
        await Promise.all([
          getItemButtons[i].click(),
          page.waitForNavigation()
        ])

        await page.waitFor(3000)

        const urlParams = new URLSearchParams(page.url())
        const redirectURL = urlParams.get('redirectUrl')
        urls.push(redirectURL)

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
    return urls
  },

  /**
   * Log into Epic Games and renew cookies
   * @param  {object} page            Puppeteer browser page
   * @param  {object} client          Puppeteer CDPSession
   * @param  {string} usernameOrEmail Optional account credential
   * @param  {string} password        Optional account credential
   * @param  {string} code            Optional 2FA code
   * @return {object}                 Updated login cookies or null if login unsuccessful
   */
  login: async (page, client, usernameOrEmail, password, code) => {
    if (usernameOrEmail && password) {
      await Promise.all([
        page.goto('https://www.epicgames.com/id/login'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ])

      await page.waitFor(3000)

      await page.type('#usernameOrEmail', usernameOrEmail)
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

      await page.type('#code', code)

      const continueButton = await page.waitForSelector('#continue')

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

    await Promise.all([
      page.goto('https://www.epicgames.com/site/en-US/error-404'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ])

    await page.waitFor(3000)

    const isLoggedInMenuItem = await page.$('.is-logged-in')
    const cookies = (await client.send('Network.getAllCookies')).cookies
    return isLoggedInMenuItem ? cookies : null
  },

  /**
   * Purchase item(s) on Epic Games
   * @param {object}         page Puppeteer browser page
   * @param {array.<string>} urls Array of purchase URLs
   */
  purchaseAll: async (page, urls) => {
    await page.setCookie(...AGE_GATE_COOKIE)

    for (const url of urls) {
      await Promise.all([
        page.goto(url),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ])

      await page.waitFor(3000)

      const isItemAvailable = page.url().includes('/purchase/verify')

      if (!isItemAvailable) {
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
