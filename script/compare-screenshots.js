#!/usr/bin/env node
// @ts-check

const usage = `Generate before/after screenshots for two URLs using Playwright.

Usage:
  node script/compare-screenshots.js [--dark|--light] <before-url> <after-url>

Options:
  --dark    Emulate dark mode (prefers-color-scheme: dark)
  --light   Emulate light mode (default)

Examples:
  node script/compare-screenshots.js https://git-scm.com http://localhost:5000
  node script/compare-screenshots.js --dark https://git-scm.com http://localhost:5000
  node script/compare-screenshots.js https://git-scm.com https://myuser.github.io/git-scm.com/`;

const { chromium } = require('@playwright/test');

async function main() {
  const args = process.argv.slice(2);
  const options = {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    colorScheme: 'light',
  };

  const urls = args.filter(arg => {
    if (!arg.startsWith('--')) return true;

    if (arg === '--dark') {
      options.colorScheme = 'dark';
    } else if (arg === '--light') {
      options.colorScheme = 'light';
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
    return false;
  });

  if (urls.length !== 2) {
    console.error(usage);
    process.exit(1);
  }

  const beforeUrl = urls[0];
  const afterUrl = urls[1];

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext(options);

    const page = await context.newPage();

    if (options.colorScheme === 'dark') {
      console.error('Using dark mode (prefers-color-scheme: dark)');
    }

    async function takeScreenshot(url, outputPath) {
      console.error(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: outputPath, fullPage: true });
      console.error(`Saved: ${outputPath}`);
    }

    await takeScreenshot(beforeUrl, '.before.png');
    await takeScreenshot(afterUrl, '.after.png');

    console.error(`\nScreenshots saved:`);
    console.error('  - .before.png');
    console.error('  - .after.png');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
