const puppeteer = require('puppeteer')
const bot = require('epic-games-bot')
const fs = require('fs').promises

const fallbackLogin = async (usernameOrEmail, password) => {
  let browser = null

  try {
    // Use new browser without headless to allow captcha completion
    browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    return await bot.login(page, usernameOrEmail, password)
  }
  catch (error) {
    throw error
  }
  finally {
    if (browser !== null) {
      await browser.close()
    }
  }
}

(async () => {
  let browser = null

  try {
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    // Get all purchase URLs
    const urls = await bot.getURLs(page)

    console.info('Purchase URLs:')
    urls.forEach(url => console.info(url))

    let cookies = null

    // Provide existing saved cookies from file
    try {
      const cookiesJSON = await fs.readFile('./cookies.json')
      cookies = JSON.parse(cookiesJSON)

      // Log in and get updated cookies
      await page.setCookie(...cookies)
      cookies = await bot.login(page)
    }
    catch (error) {
      console.info('Unable to log in using existing cookies')
    }

    if (!cookies) {
      // Provide account credentials for fallback login
      const usernameOrEmail = ''
      const password = ''
      cookies = await fallbackLogin(usernameOrEmail, password)
      await page.setCookie(...cookies)
    }

    // Save cookies to local file
    await fs.writeFile('./cookies.json', JSON.stringify(cookies))

    // Purchase all items
    await bot.purchaseAll(page, urls)
  }
  catch (error) {
    console.error(error)
    process.exit(1)
  }
  finally {
    if (browser !== null) {
      await browser.close()
    }
  }
})()

