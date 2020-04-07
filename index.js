const DEFAULT_PURCHASE_ATTEMPTS = 2 // Default maximum purchase attempts

module.exports = {
  /**
   * Get all free item URLs on Epic Games
   * @param  {object}         page1 First puppeteer browser page
   * @param  {object}         page2 Second puppeteer browser page
   * @return {array.<string>}       Array of purchase URLs
   */
  getURLs: async (page1, page2) => {
    let urls = []

    await page1.goto('https://www.epicgames.com/store/en-US')
    const hyperlinks = await page1.$x("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'free')]")

    for (const hyperlink of hyperlinks) {
      const href = await page1.evaluate(element => element.href, hyperlink)

      const urlMatches = urls.filter(url => url.includes(href))
      if (urlMatches.length > 0) {
        continue
      }

      await page2.goto(href)
      let getItemButtons = await page2.$x("//button[contains(., 'Get')]")

      for (let i = 0; i < getItemButtons.length; ++i) {
        await Promise.all([
          getItemButtons[i].click(),
          page2.waitForNavigation()
        ])

        const urlParams = new URLSearchParams(page2.url())
        const redirectURL = urlParams.get('redirectUrl')
        urls.push(redirectURL)

        if (i + 1 == getItemButtons.length) {
          break
        }

        await page2.goBack()
        getItemButtons = await page2.$x("//button[contains(., 'Get')]")
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
      await page.goto('https://www.epicgames.com/id/login', { waitUntil: 'networkidle2' })

      await page.type('#usernameOrEmail', usernameOrEmail)
      await page.type('#password', password)
      const loginButton = await page.waitForSelector('#login')
      await page.waitFor(2000) // Give loginButton time to load

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

    await page.goto('https://www.epicgames.com/site/en-US/error-404')
    const isLoggedInMenuItem = await page.$('.is-logged-in')
    return isLoggedInMenuItem ? page.cookies() : null
  },

  /**
   * Purchase item(s) on Epic Games
   * @param {object}         page             Puppeteer browser page
   * @param {array.<string>} urls             Array of purchase URLs
   * @param {number}         purchaseAttempts Optional maximum purchase attempts
   */
  purchaseAll: async (page, urls, purchaseAttempts) => {
    purchaseAttempts = purchaseAttempts || DEFAULT_PURCHASE_ATTEMPTS

    for (const url of urls) {
      for (let i = 0; i < purchaseAttempts; ++i) {
        try {
          await Promise.all([
            page.goto(url, { waitUntil: 'networkidle2' }),
            page.waitForNavigation()
          ])

          const isItemAvailable = page.url().includes('purchase')
          if (!isItemAvailable) {
            break
          }

          const purchaseButton = await page.waitForSelector('.btn-primary')
          await page.waitFor(2000) // Give purchaseButton time to load

          await Promise.all([
            purchaseButton.click(),
            page.waitForNavigation()
          ])

          break
        }
        catch (error) {
          if (i + 1 == purchaseAttempts) {
            throw error
          }
        }
      }
    }
  }
}
