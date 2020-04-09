const AGE_GATE_COOKIE = JSON.parse('[{"name":"HAS_ACCEPTED_AGE_GATE_ONCE","value":"true","domain":"www.epicgames.com","path":"/","expires":-1,"size":30,"httpOnly":false,"secure":false,"session":true}]')
const DEFAULT_OPTIONS = {
  waitUntil: 'networkidle2'
}

module.exports = {
  /**
   * Get all free item URLs on Epic Games
   * @param  {object}         page Puppeteer browser page
   * @return {array.<string>}      Array of purchase URLs
   */
  getURLs: async page => {
    await Promise.all([
      page.goto('https://www.epicgames.com/store/en-US'),
      page.waitForNavigation(DEFAULT_OPTIONS)
    ])

    await page.setCookie(...AGE_GATE_COOKIE)

    const hyperlinks = await page.$x("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'free')]")
    const hrefs = []

    for (const hyperlink of hyperlinks) {
      const href = await page.evaluate(element => element.href, hyperlink)

      if (!hrefs.includes(href)) {
        hrefs.push(href)
      }
    }

    const urls = []

    for (const href of hrefs) {
      await Promise.all([
        page.goto(href),
        page.waitForNavigation(DEFAULT_OPTIONS)
      ])

      let getItemButtons = await page.$x("//button[contains(., 'Get')]")

      for (let i = 0; i < getItemButtons.length; ++i) {
        await Promise.all([
          getItemButtons[i].click(),
          page.waitForNavigation()
        ])

        const urlParams = new URLSearchParams(page.url())
        const redirectURL = urlParams.get('redirectUrl')
        urls.push(redirectURL)

        if (i + 1 == getItemButtons.length) {
          break
        }

        await Promise.all([
          page.goBack(),
          page.waitForNavigation(DEFAULT_OPTIONS)
        ])

        getItemButtons = await page.$x("//button[contains(., 'Get')]")
      }
    }

    return urls
  },

  /**
   * Log into Epic Games and renew cookies
   * @param  {object} page            Puppeteer browser page
   * @param  {string} usernameOrEmail Optional account credential
   * @param  {string} password        Optional account credential
   * @return {object}                 Updated login cookies or null if login unsuccessful
   */
  login: async (page, usernameOrEmail, password) => {
    if (usernameOrEmail && password) {
      await Promise.all([
        page.goto('https://www.epicgames.com/id/login'),
        page.waitForNavigation(DEFAULT_OPTIONS)
      ])

      await page.type('#usernameOrEmail', usernameOrEmail)
      await page.type('#password', password)

      const loginButton = await page.waitForSelector('#login')
      await page.waitFor(1000) // Give loginButton time to load

      try {
        await Promise.all([
          loginButton.click(),
          page.waitForNavigation()
        ])
      }
      catch (error) {
        throw new Error('Detected CAPTCHA challenge from Epic Games')
      }

      return page.cookies()
    }

    await Promise.all([
      page.goto('https://www.epicgames.com/site/en-US/error-404'),
      page.waitForNavigation(DEFAULT_OPTIONS)
    ])

    const isLoggedInMenuItem = await page.$('.is-logged-in')
    return isLoggedInMenuItem ? page.cookies() : null
  },

  /**
   * Purchase item(s) on Epic Games
   * @param {object}         page             Puppeteer browser page
   * @param {array.<string>} urls             Array of purchase URLs
   */
  purchaseAll: async (page, urls) => {
    for (const url of urls) {
      await Promise.all([
        page.goto(url),
        page.waitForNavigation(DEFAULT_OPTIONS),
        page.waitFor(3000) // Give URL time to resolve
      ])

      const isItemAvailable = page.url().includes('purchase')

      if (!isItemAvailable) {
        continue
      }

      const purchaseButton = await page.waitForSelector('.btn-primary')

      await Promise.all([
        purchaseButton.click(),
        page.waitForNavigation()
      ])
    }
  }
}
