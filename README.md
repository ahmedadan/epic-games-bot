# Epic Games Bot

<!-- [START badges] -->
[![npm](https://img.shields.io/npm/v/epic-games-bot)](https://www.npmjs.com/package/epic-games-bot)
[![Node.js](https://img.shields.io/badge/environment-Node.js-brightgreen)](#)
[![Puppeteer](https://img.shields.io/badge/API-Puppeteer-brightgreen)](#)
[![license](https://img.shields.io/github/license/george-lim/epic-games-bot)](https://github.com/george-lim/epic-games-bot/blob/master/LICENSE)
<!-- [END badges] -->

> Epic Games Bot is a Node library that finds and purchases all promotional free items on Epic Games. All communication is handled through the [Puppeteer API](https://github.com/puppeteer/puppeteer/blob/v2.1.1/docs/api.md).

<!-- [START getstarted] -->
## Getting Started

### Installation

To use Epic Games Bot in your project, run:

```bash
npm install epic-games-bot puppeteer
# or "yarn add epic-games-bot puppeteer"
```

### Usage

[Example projects](https://github.com/george-lim/epic-games-bot/blob/master/examples) are provided to demonstrate how Epic Games Bot can be used alongside Puppeteer to find and purchase all promotional free items.

Note: SSO login is currently unsupported. 2FA support is limited to the authenticator app method.

Execute script on the command line:
```bash
cd examples/get-purchase-urls
# or "cd examples/purchase-items"
npm install
# or "yarn install"
node .
```
<!-- [END getstarted] -->
