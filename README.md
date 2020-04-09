# Epic Games Bot

<!-- [START badges] -->
[![npm](https://img.shields.io/npm/v/epic-games-bot)](https://www.npmjs.com/package/epic-games-bot)
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
npm install epic-games-bot puppeteer
# or "yarn add epic-games-bot puppeteer"
```

### Usage

The provided [example project](https://github.com/george-lim/epic-games-bot/blob/master/examples/purchase-items) demonstrates how Epic Games Bot can be used alongside Puppeteer to purchase all promotional free items on Epic Games.

Note: SSO login is currently unsupported.

Execute script on the command line:
```bash
cd examples/purchase-items
npm install
# or "yarn install"
node .
```
<!-- [END getstarted] -->
