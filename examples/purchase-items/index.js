const puppeteer = require('puppeteer')
const bot = require('epic-games-bot')
const fs = require('fs').promises

const fallbackLogin = async (usernameOrEmail, password, code) => {
  let browser = null
  let page = null

  try {
    // Use new browser without headless to allow captcha completion
    browser = await puppeteer.launch({ headless: false })
    page = await browser.newPage()

    const client = await page.target().createCDPSession()
    return await bot.login(page, client, usernameOrEmail, password, code)
  }
  catch (error) {
    await page.screenshot({ path: './error-fallback-login.jpg', type: 'jpeg' })
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
  let page = null

  try {
    browser = await puppeteer.launch({ headless: true })
    page = await browser.newPage()

    const client = await page.target().createCDPSession()
    let cookies = null

    // Provide existing saved cookies from file
    try {
      const cookiesJSON = await fs.readFile('./cookies.json')
      cookies = JSON.parse(cookiesJSON)

      // Log in and get updated cookies
      await page.setCookie(...cookies)
      cookies = await bot.login(page, client)
    }
    catch (error) {
      console.info('Unable to log in using existing cookies...')

      // Provide account credentials for fallback login
      const usernameOrEmail = ''
      const password = ''
      const code = ''

      cookies = await fallbackLogin(usernameOrEmail, password, code)
      await page.setCookie(...cookies)
    }

    // Save cookies to local file
    await fs.writeFile('./cookies.json', JSON.stringify(cookies))

    // Get all purchase URLs
    const urls = await bot.getURLs(page, client)

    // Purchase all items
    await bot.purchaseAll(page, urls)
  }
  catch (error) {
    await page.screenshot({ path: './error-main.jpg', type: 'jpeg' })
    console.error(error)
    process.exit(1)
  }
  finally {
    if (browser !== null) {
      await browser.close()
    }
  }
})()
