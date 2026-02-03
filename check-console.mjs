#!/usr/bin/env node
/**
 * Load index.html in headless browser and print console logs/errors.
 * Run: node check-console.mjs
 * Requires: npx playwright install chromium (one-time)
 */
import { chromium } from 'playwright';

const url = process.env.URL || 'http://localhost:8765/';
const logs = [];
const errors = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text });
    if (type === 'error') errors.push(text);
  });

  page.on('pageerror', (err) => errors.push('PageError: ' + err.message));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('--- CONSOLE OUTPUT ---');
  logs.forEach(({ type, text }) => console.log(`[${type}] ${text}`));
  console.log('--- ERRORS ---');
  if (errors.length) errors.forEach((e) => console.error(e));
  else console.log('(none)');

  await browser.close();
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => {
  console.error('Run failed:', e.message);
  process.exit(1);
});
