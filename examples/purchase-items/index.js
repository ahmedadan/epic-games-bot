(async () => {
  const puppeteer = require('puppeteer')
  const bot = require('epic-games-bot')
  let browser = null

  try {
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    const urls = await bot.getURLs(page)
    urls.forEach(url => console.log(url))

    // Optional: Provide existing saved cookies
    let cookies = null

    if (cookies) {
      // Log in and get updated cookies
      await page.setCookie(...cookies)
      cookies = await bot.login(page)
    }
    else {
      // Provide account credentials to login
      const usernameOrEmail = ''
      const password = ''
      cookies = await bot.login(page, usernameOrEmail, password)
    }

    console.log(JSON.stringify(cookies, null, 2))

    // Purchase items if user successfully logged in
    if (cookies) {
      await bot.purchaseAll(page, urls)
    }
  }
  catch (error) {
    console.error(error)
  }
  finally {
    if (browser !== null) {
      await browser.close()
    }
  }
})()
