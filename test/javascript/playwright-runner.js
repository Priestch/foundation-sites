#!/usr/bin/env node

/**
 * Playwright-based runner for the mocha browser test pages (7.0 line A, S15).
 * Replaces mocha-headless-chrome: serves the repository root over a local
 * HTTP server, opens each given test page, waits for the mocha `end` event
 * (reported by the page through `window.__mochaDone`), prints the results
 * and exits non-zero when a page has failing tests.
 *
 * Browser selection: the bundled Playwright chromium is used when installed
 * (CI: `npx playwright install chromium`); otherwise the runner falls back to
 * the system Google Chrome ("chrome" channel). Override with
 * `--channel <name>` or the `PW_CHROME_CHANNEL` environment variable.
 *
 * Usage: node test/javascript/playwright-runner.js <page.html> [<page.html> ...]
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const ROOT = path.resolve(__dirname, '../..')
const DEFAULT_TIMEOUT = 240000

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.md': 'text/plain',
  '.txt': 'text/plain'
}

function parseArgs(argv) {
  const pages = []
  let timeout = DEFAULT_TIMEOUT
  let channel = process.env.PW_CHROME_CHANNEL || null

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--timeout') {
      timeout = parseInt(argv[++i], 10)
    } else if (argv[i] === '--channel') {
      channel = argv[++i]
    } else {
      pages.push(argv[i])
    }
  }

  if (!pages.length) {
    console.error('Usage: node playwright-runner.js [--timeout ms] [--channel name] <page.html> [...]')
    process.exit(2)
  }

  return { pages, timeout, channel }
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0])
      let filePath = path.join(ROOT, urlPath)

      // Keep every resolved path inside the repository root.
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403)
        res.end()
        return
      }

      fs.stat(filePath, (err, stat) => {
        if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html')
        fs.readFile(filePath, (readErr, data) => {
          if (readErr) {
            res.writeHead(404)
            res.end('not found: ' + urlPath)
            return
          }
          res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' })
          res.end(data)
        })
      })
    })

    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

async function launchBrowser(channel, args) {
  if (channel) {
    return chromium.launch({ channel, args })
  }
  try {
    // Bundled chromium, when `npx playwright install chromium` has been run.
    return await chromium.launch({ args })
  } catch (err) {
    // Fallback: the system-installed Google Chrome.
    return chromium.launch({ channel: 'chrome', args })
  }
}

async function runPage(browser, server, relPage, timeout) {
  const url = `http://127.0.0.1:${server.address().port}/${relPage.replace(/\\/g, '/')}`
  // mocha-headless-chrome opened its pages at 800x600; keep that so layout
  // dependent suites (slider, sticky, ...) see the same geometry.
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } })

  // Expected noise from the pins themselves: the interchange silent-failure
  // tests fetch a missing/unreachable resource on purpose, whose unhandled
  // rejection surfaces here. Printed for diagnosis, never fails the run
  // (parity with mocha-headless-chrome "-a ignore-resource-errors").
  page.on('pageerror', (err) => console.log(`  page error: ${err.message.split('\n')[0]}`))

  await page.goto(url, { waitUntil: 'load', timeout })
  await page.waitForFunction('window.__mochaDone === true', null, { timeout, polling: 250 })

  const stats = await page.evaluate(() => ({
    passes: window.__mochaStats.passes,
    failures: window.__mochaStats.failures,
    pending: window.__mochaStats.pending,
    tests: window.__mochaStats.tests,
    duration: window.__mochaStats.duration
  }))

  const failureList = await page.evaluate(() => window.__mochaFailures.slice())

  failureList.forEach((f) => {
    console.log(`  ${f.title}`)
    console.log(`    ${f.message}`)
    if (f.stack) console.log(`    ${String(f.stack).split('\n').slice(0, 9).join('\n    ')}`)
  })

  await page.close()

  return {
    failed: stats.failures > 0,
    stats
  }
}

async function main() {
  const { pages, timeout, channel } = parseArgs(process.argv.slice(2))
  const server = await startServer()
  const args = [
    // Parity with the former mocha-headless-chrome default flags.
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]

  const browser = await launchBrowser(channel, args)
  let failed = false

  for (const relPage of pages) {
    console.log(`\n${relPage}:`)
    try {
      const result = await runPage(browser, server, relPage, timeout)
      const s = result.stats
      console.log(`  ${s.passes} passing (${s.duration}ms)`)
      if (s.pending) console.log(`  ${s.pending} pending`)
      if (s.failures) console.log(`  ${s.failures} failing`)
      if (result.failed) failed = true
    } catch (err) {
      console.log(`  runner error: ${err.message.split('\n')[0]}`)
      failed = true
    }
  }

  await browser.close()
  server.close()

  if (failed) {
    console.log('\nTests fails')
    process.exit(1)
  }
}

main()
