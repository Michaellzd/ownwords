import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '../src/languages.js';
import { translate } from '../src/i18n.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const profile = await mkdtemp(path.join(tmpdir(), 'ownwords-test-'));
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
  viewport: { width: 400, height: 900 },
  locale: 'zh-CN',
});
const errors = [];
const requests = [];
let mode = 'success';
const result = 'I’m not sure this is what people need.';
const outputs = { English: result, 'Simplified Chinese': '我不确定这是不是大家需要的。', Japanese: 'これが本当に必要とされているのか、まだわかりません。', Korean: '사람들이 정말 필요로 하는 건지 잘 모르겠어요.', Spanish: 'No estoy seguro de que esto sea lo que la gente necesita.' };
let releaseSlow;
async function waitForSlowRequest() {
  const deadline = Date.now() + 5000;
  while (!releaseSlow && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(typeof releaseSlow, 'function', 'The delayed API request must arrive within five seconds');
}
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
    const body = route.request().postDataJSON();
    const requestMode = mode;
    requests.push({ headers: route.request().headers(), body });
    const target = /^Output language: (.+)\.$/m.exec(body.messages[0].content)?.[1];
    assert(Object.hasOwn(outputs, target), 'An explicit supported output language is required');
    if (requestMode === 'slow') await new Promise((resolve) => { releaseSlow = resolve; });
    if (requestMode === 'error') return route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ error: { message: 'SENSITIVE_SERVER_MESSAGE' } }) });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: outputs[target] }, finish_reason: 'stop' }] }) }).catch(() => {});
  });
  let page = await context.newPage();
  const observe = (p) => { p.on('pageerror', (error) => errors.push(error.message)); };
  observe(page);
  await page.goto(panelUrl);
  await page.locator('#settings:not([hidden])').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
  assert.equal(await page.locator('#output-language').inputValue(), 'en');
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
  releaseSlow = undefined;
  await page.locator('#generate').click();
  await page.locator('#cancel:not([hidden])').waitFor();
  await waitForSlowRequest();
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

  const beforeLanguageSwitch = requests.length;
  const previousDraft = await page.locator('#draft').inputValue();
  const previousResult = await page.locator('#result').inputValue();
  await page.locator('#settings-toggle').click();
  await page.locator('#api-key').fill('unsaved-test-only-key');
  for (const { code } of LANGUAGES) {
    await page.locator('#ui-language').selectOption(code);
    assert.equal(await page.locator('html').getAttribute('lang'), code);
    assert.equal(await page.locator('#output-language').inputValue(), 'en');
    assert.equal(await page.locator('#draft').inputValue(), previousDraft);
    assert.equal(await page.locator('#result').inputValue(), previousResult);
    assert.equal(await page.locator('#api-key').inputValue(), 'unsaved-test-only-key');
    assert.equal(await page.locator('#key-toggle').getAttribute('aria-label'), translate(code, 'showKey'));
    assert.equal(await page.locator('#stale-note').isVisible(), false);
    for (const width of [320, 400]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${code} fits at ${width}px`);
    }
  }
  assert.equal(requests.length, beforeLanguageSwitch);
  await page.locator('#api-key').fill('test-only-key');
  await page.locator('#settings-toggle').click();
  console.log('PASS: all five interfaces switch without network calls, text loss, or overwritten unsaved credentials');

  await page.locator('#ui-language').selectOption('es');
  await page.locator('#output-language').selectOption('ja');
  assert.equal(await page.locator('#stale-note').isVisible(), true);
  assert.equal(await page.locator('#result').getAttribute('lang'), 'en');
  await page.locator('input[value="grammar"]').check();
  await page.locator('#generate').click();
  await page.waitForFunction((expected) => document.getElementById('result').value === expected, outputs.Japanese);
  assert.match(requests.at(-1).body.messages[0].content, /Output language: Japanese\./);
  assert.match(requests.at(-1).body.messages[0].content, /including in Grammar only mode/);
  assert.equal(await page.locator('html').getAttribute('lang'), 'es');
  assert.equal(await page.locator('#result').getAttribute('lang'), 'ja');
  assert.equal(await page.locator('#stale-note').isVisible(), false);
  await page.locator('#copy').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), outputs.Japanese);
  mode = 'error';
  await page.locator('#generate').click();
  await page.waitForFunction((expected) => document.getElementById('status').textContent === expected, translate('es', 'apiCredits'));
  await page.locator('#ui-language').selectOption('ko');
  assert.equal(await page.locator('#status').innerText(), translate('ko', 'apiCredits'));
  assert.equal(await page.locator('#result').inputValue(), outputs.Japanese);
  console.log('PASS: Spanish interface requests Japanese output; localized errors retranslate without changing the result');

  await page.locator('#output-language').selectOption('es');
  await page.waitForFunction(() => chrome.storage.local.get('preferences').then(({ preferences }) => preferences?.uiLanguage === 'ko' && preferences?.outputLanguage === 'es'));
  await page.close();
  page = await context.newPage();
  observe(page);
  await page.goto(panelUrl);
  await page.waitForFunction(() => document.getElementById('ui-language').value === 'ko' && !document.getElementById('ui-language').disabled);
  assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
  assert.equal(await page.locator('#output-language').inputValue(), 'es');
  assert.equal(await page.locator('#result').inputValue(), outputs.Japanese);
  assert.equal(await page.locator('#result').getAttribute('lang'), 'ja');
  assert.equal(await page.locator('#stale-note').isVisible(), true);
  assert.equal((await page.evaluate(() => chrome.storage.local.get('settings'))).settings.apiKey, 'test-only-key');
  console.log('PASS: independent language preferences persist across reopening without changing credentials');

  mode = 'slow';
  await page.locator('#output-language').selectOption('ja');
  const beforeSlowRequest = requests.length;
  releaseSlow = undefined;
  await page.locator('#generate').click();
  await waitForSlowRequest();
  assert.equal(requests.length, beforeSlowRequest + 1);
  await page.locator('#output-language').selectOption('es');
  releaseSlow();
  await page.waitForFunction((expected) => document.getElementById('status').textContent === expected, translate('ko', 'generated'));
  assert.equal(await page.locator('#result').getAttribute('lang'), 'ja');
  assert.equal(await page.locator('#stale-note').isVisible(), true);
  mode = 'success';
  console.log('PASS: changing output language during a request marks the returned result stale');

  for (const { code } of LANGUAGES) {
    await page.locator('#ui-language').selectOption(code);
    await page.locator('#output-language').selectOption(code);
    await page.locator('#generate').click();
    await page.waitForFunction((expected) => document.getElementById('status').textContent === expected && !document.getElementById('generate').disabled, translate(code, 'generated'));
    assert.equal(await page.locator('#result').getAttribute('lang'), code);
    assert.equal(await page.locator('#result').inputValue(), outputs[LANGUAGES.find((item) => item.code === code).promptName]);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(root, `artifacts/ownwords-${code}-320.png`), fullPage: true, animations: 'disabled' });
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 520, height: 900 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: path.join(root, 'artifacts/ownwords-es-dark-520.png'), fullPage: true, animations: 'disabled' });
  console.log('PASS: all five output language prompts and translated UI layouts');

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
