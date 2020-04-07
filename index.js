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
      await page.waitFor(3000) // Wait for login button to finish loading

      await Promise.all([
        page.click('#login'),
        page.waitForNavigation()
      ])

      return page.cookies()
    }

    await page.goto('https://www.epicgames.com/site/en-US/error-404')
    const isLoggedInMenuItem = await page.$('.is-logged-in')
    return isLoggedInMenuItem ? page.cookies() : null
  },

  /**
   * Purchase item(s) on Epic Games
   * @param {object}         page Puppeteer browser page
   * @param {array.<string>} urls Array of purchase URLs
   */
  purchaseAll: async (page, urls) => {
    for (const url of urls) {
      // Retry request up to 3 times
      for (let i = 0; i < 3; ++i) {
        try {
          await Promise.all([
            page.goto(url, { waitUntil: 'networkidle2' }),
            page.waitForNavigation()
          ])
          break
        }
        catch (e) {}
      }

      const isItemAvailable = page.url().includes('purchase')
      if (!isItemAvailable) {
        continue
      }

      await page.waitForSelector('.btn-primary')
      await page.waitFor(3000) // Wait for purchase button to finish loading

      await Promise.all([
        page.click('.btn-primary'),
        page.waitForNavigation()
      ])
    }
  }
}
