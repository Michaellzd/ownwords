import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
await mkdir('icons', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const size of [16, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#2f5943;color:#fff;font-family:Arial,sans-serif;font-weight:700;font-size:${size * .58}px;letter-spacing:${size * -.045}px;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;padding-right:${size * .04}px;padding-bottom:${size * .045}px}</style>ow.`);
    await page.screenshot({ path: `icons/${size}.png`, scale: 'css' });
  }
} finally { await browser.close(); }
