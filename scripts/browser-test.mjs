import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const profile = await mkdtemp(path.join(tmpdir(), 'x-draft-test-'));
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
  viewport: { width: 400, height: 900 },
});
const errors = [];
const requests = [];
let mode = 'success';
const result = 'I’m not sure this is what people need.';
let releaseSlow;
try {
  // Test-only permission lets assertions inspect the clipboard. The shipped
  // extension requests write access only and never reads the clipboard.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const panelUrl = `chrome-extension://${extensionId}/panel.html`;
  const behavior = await worker.evaluate(() => chrome.sidePanel.getPanelBehavior());
  assert.equal(behavior.openPanelOnActionClick, true);
  await context.route('https://openrouter.ai/api/v1/chat/completions', async (route) => {
    requests.push({ headers: route.request().headers(), body: route.request().postDataJSON() });
    if (mode === 'slow') await new Promise((resolve) => { releaseSlow = resolve; });
    if (mode === 'error') return route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ error: { message: 'SENSITIVE_SERVER_MESSAGE' } }) });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: result }, finish_reason: 'stop' }] }) }).catch(() => {});
  });
  let page = await context.newPage();
  const observe = (p) => { p.on('pageerror', (error) => errors.push(error.message)); };
  observe(page);
  await page.goto(panelUrl);
  await page.locator('#settings:not([hidden])').waitFor();
  assert.equal(await page.locator('#model-preset').inputValue(), 'anthropic/claude-haiku-5.5');
  assert.equal(await page.locator('#generate').isDisabled(), true);
  await page.locator('#api-key').fill('test-only-key');
  await page.locator('#model-preset').selectOption('custom');
  await page.locator('#model').fill('custom/my-text-model:free');
  await page.getByRole('button', { name: '保存设置', exact: true }).click();
  await page.locator('#settings[hidden]').waitFor({ state: 'attached' });
  const settings = await page.evaluate(() => chrome.storage.local.get('settings'));
  assert.equal(settings.settings.apiKey, 'test-only-key');
  assert.equal(settings.settings.model, 'custom/my-text-model:free');
  console.log('PASS: real extension loads, toolbar is configured, custom key/model save locally');

  // Capture the shipped editor at narrow/light and wider/dark sizes in one pass.
  await page.screenshot({ path: path.join(root, 'artifacts/editor-light-400.png'), fullPage: true });
  await page.locator('#draft').fill('I not sure this is what people need.');
  await page.locator('#context-details summary').click();
  await page.locator('#context').fill('Someone asked whether I validated my idea.');
  await page.getByText('更简短', { exact: true }).click();
  await page.locator('#generate').click();
  await page.waitForFunction(() => document.getElementById('result').value.length > 0);
  assert.equal(await page.locator('#result').inputValue(), result);
  assert.equal(requests[0].body.model, 'custom/my-text-model:free');
  assert.equal(requests[0].headers.authorization, 'Bearer test-only-key');
  assert.match(requests[0].body.messages[0].content, /more concise/);
  assert.equal(JSON.parse(requests[0].body.messages[1].content).context, 'Someone asked whether I validated my idea.');
  assert.equal(await page.locator('#stale-note').isVisible(), false);
  await page.locator('#copy').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), result);
  await page.locator('#result').fill(`${result} Still figuring it out.`);
  await page.locator('#copy').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${result} Still figuring it out.`);
  console.log('PASS: draft, context, style, chosen model, editable output, and clipboard');

  await page.locator('#draft').fill('I have changed my mind.');
  assert.equal(await page.locator('#stale-note').isVisible(), true);
  await page.waitForFunction(() => chrome.storage.session.get('editor').then(({ editor }) => editor?.draft === 'I have changed my mind.'));
  await page.close();
  page = await context.newPage();
  observe(page);
  await page.goto(panelUrl);
  await page.waitForFunction(() => document.getElementById('draft').value === 'I have changed my mind.');
  assert.match(await page.locator('#result').inputValue(), /Still figuring/);
  assert.equal(await page.locator('#stale-note').isVisible(), true);
  console.log('PASS: editor and stale-result warning survive closing and reopening the panel');

  await page.locator('#settings-toggle').click();
  await page.locator('#model-preset').selectOption('openai/gpt-6-luna');
  await page.getByRole('button', { name: '保存设置', exact: true }).click();
  await page.locator('#settings[hidden]').waitFor({ state: 'attached' });
  mode = 'error';
  await page.locator('#generate').click();
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('余额不足'));
  assert.equal(await page.locator('#draft').inputValue(), 'I have changed my mind.');
  assert.match(await page.locator('#result').inputValue(), /Still figuring/);
  assert.equal((await page.locator('body').innerText()).includes('SENSITIVE_SERVER_MESSAGE'), false);
  assert.equal(requests.at(-1).body.model, 'openai/gpt-6-luna');
  console.log('PASS: preset switching and sanitized API errors preserve text');

  mode = 'slow';
  await page.locator('#generate').click();
  await page.locator('#cancel:not([hidden])').waitFor();
  await page.waitForFunction(() => document.getElementById('generate').disabled);
  await page.locator('#cancel').click();
  await page.waitForFunction(() => document.getElementById('status').textContent === '已取消。');
  releaseSlow?.();
  assert.equal(await page.locator('#generate').isDisabled(), false);
  console.log('PASS: loading, duplicate-submit prevention, and cancellation');

  mode = 'success';
  await page.locator('#generate').click();
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('已生成'));
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 520, height: 900 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.header').count(), 1);
  await page.screenshot({ path: path.join(root, 'artifacts/result-dark-520.png'), fullPage: true, animations: 'disabled' });
  for (const width of [320, 400, 660]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
  }
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({ path: path.join(root, 'artifacts/result-light-320.png'), fullPage: true });
  console.log('PASS: 320/400/660px layouts, light/dark modes, reduced motion');

  await page.locator('#clear').click();
  assert.equal(await page.locator('#draft').inputValue(), '');
  assert.equal(await page.locator('#context').inputValue(), '');
  assert.equal(await page.locator('#result').inputValue(), '');
  await page.waitForFunction(() => chrome.storage.session.get('editor').then(({ editor }) => editor?.draft === '' && editor?.result === '' && editor?.context === ''));
  await page.locator('#settings-toggle').click();
  await page.locator('#forget-key').click();
  await page.waitForFunction(() => chrome.storage.local.get('settings').then(({ settings }) => settings.apiKey === ''));
  assert.equal(await page.locator('#api-key').inputValue(), '');
  assert.equal(await page.locator('#model-preset').inputValue(), 'openai/gpt-6-luna');
  assert.deepEqual(errors, []);
  console.log('PASS: clear removes session text, Remove key deletes credentials, no page errors');
} finally {
  releaseSlow?.();
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
