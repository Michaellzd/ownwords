import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGUAGES, resolveUiLanguage } from '../src/languages.js';
import { translations, translate } from '../src/i18n.js';

test('browser language detection handles regional codes and falls back to English', () => {
  for (const [languages, expected] of [[['es-MX'], 'es'], [['zh_CN'], 'zh-CN'], [['ja-JP'], 'ja'], [['ko-KR'], 'ko'], [['en-GB'], 'en'], [['fr-FR', 'ja'], 'ja'], [['fr-FR'], 'en'], [[], 'en'], [[null], 'en']]) {
    assert.equal(resolveUiLanguage(languages), expected);
  }
});
test('every locale has complete messages and consistent interpolation placeholders', () => {
  const keys = Object.keys(translations.en).sort();
  const placeholders = (message) => [...message.matchAll(/\{\w+\}/g)].map(([value]) => value).sort();
  for (const { code } of LANGUAGES) {
    assert.deepEqual(Object.keys(translations[code]).sort(), keys, code);
    for (const key of keys) {
      assert.equal(typeof translations[code][key], 'string');
      assert(translations[code][key].trim().length > 0, `${code}.${key}`);
      assert.deepEqual(placeholders(translations[code][key]), placeholders(translations.en[key]), `${code}.${key}`);
    }
  }
});
test('translation fallback and parameter substitution are plain text', () => {
  assert.equal(translate('unsupported', 'copy'), 'Copy');
  assert.equal(translate('en', 'apiUnknown', { status: 418 }), 'Request failed (418). Check your settings and try again.');
  assert.equal(translate('en', 'draftTooLong', { limit: '<8000>' }), 'The draft limit is <8000> characters. Shorten it and try again.');
  assert.equal(translate('en', 'unknownKey'), 'unknownKey');
});
test('all localized HTML text and accessibility keys exist', async () => {
  const html = await readFile(new URL('../panel.html', import.meta.url), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="([^"]+)"/g)) assert(Object.hasOwn(translations.en, key), key);
});
