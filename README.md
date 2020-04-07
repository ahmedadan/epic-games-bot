# Epic Games Bot

<!-- [START badges] -->
[![npm](https://img.shields.io/npm/v/epic-games-bot)](https://www.npmjs.com/package/epic-games-bot)
[![GitHub Packages](https://img.shields.io/github/package-json/v/george-lim/epic-games-bot)](https://github.com/george-lim/epic-games-bot/packages)
[![Node.js](https://img.shields.io/badge/Environment-Node.js-brightgreen)](#)
[![Puppeteer](https://img.shields.io/badge/API-Puppeteer-brightgreen)](#)
[![License](https://img.shields.io/github/license/george-lim/epic-games-bot)](https://github.com/george-lim/epic-games-bot/blob/master/LICENSE)
<!-- [END badges] -->

> Epic Games Bot is a Node library that finds and purchases all promotional free games + add-ons on Epic Games. All communication is handled through the [Puppeteer API](https://github.com/puppeteer/puppeteer/blob/v2.1.1/docs/api.md).

<!-- [START getstarted] -->
## Getting Started

### Installation

To use Epic Games Bot in your project, run:

```bash
npm i @george-lim/epic-games-bot puppeteer
# or "yarn add @george-lim/epic-games-bot puppeteer"
```

### Usage

**Example** - Purchase all promotional free items on Epic Games:

Note: SSO login is currently unsupported.

Save file as **purchaseItems.js**

```js
(async () => {
  const puppeteer = require('puppeteer')
  const bot = require('@george-lim/epic-games-bot')
  let browser = null

  try {
    browser = await puppeteer.launch({ headless: true })
    const page1 = await browser.newPage()
    const page2 = await browser.newPage()

    const urls = await bot.getURLs(page1, page2)
    urls.forEach(url => console.log(url))

    // Optional: Provide existing saved cookies
    let cookies = null

    if (cookies) {
      // Log in and get updated cookies
      await page1.setCookie(...cookies)
      cookies = await bot.login(page1)
    }
    else {
      // Provide account credentials to login
      const usernameOrEmail = ''
      const password = ''
      cookies = await bot.login(page1, usernameOrEmail, password)
    }

    console.log(JSON.stringify(cookies, null, 2))

    // Purchase items if user successfully logged in
    if (cookies) {
      // Optional: Provide maximum purchase attempts
      const purchaseAttempts = 3
      await bot.purchaseAll(page1, urls, purchaseAttempts)
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
```

Execute script on the command line

```bash
node purchaseItems.js
```
<!-- [END getstarted] -->
