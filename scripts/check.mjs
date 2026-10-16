import { readFile, readdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import path from 'node:path';
import { LANGUAGES } from '../src/languages.js';
import { translations } from '../src/i18n.js';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, pkg.version);
assert.deepEqual(manifest.host_permissions, ['https://openrouter.ai/*']);
assert.equal(manifest.content_scripts, undefined);
assert.equal(manifest.default_locale, 'en');
for (const { code, chromeLocale } of LANGUAGES) {
  const messages = JSON.parse(await readFile(`_locales/${chromeLocale}/messages.json`, 'utf8'));
  for (const message of [manifest.description, manifest.action.default_title]) {
    const key = /^__MSG_(\w+)__$/.exec(message)?.[1];
    assert(key && messages[key]?.message, `Missing Chrome message for ${code}`);
  }
  assert.deepEqual(Object.keys(translations[code]).sort(), Object.keys(translations.en).sort(), `Incomplete UI translations: ${code}`);
}
for (const file of [manifest.side_panel.default_path, manifest.background.service_worker, ...Object.values(manifest.icons)]) await access(file);
const sourceFiles = (await readdir('src', { recursive: true })).filter((file) => /\.(js|css)$/.test(file));
for (const file of sourceFiles) if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', path.join('src', file)]);
const html = await readFile('panel.html', 'utf8');
assert(!/<script(?![^>]*\bsrc=)/i.test(html), 'No inline scripts');
assert(!/\son\w+=/i.test(html), 'No inline event handlers');
for (const file of ['manifest.json', 'panel.html', ...sourceFiles.map((file) => `src/${file}`)]) {
  const text = await readFile(file, 'utf8');
  assert(!/sk-or-v1-[a-f0-9]{20,}/i.test(text), `Credential detected in ${file}`);
  assert(!/\beval\s*\(|\binnerHTML\b/.test(text), `Unsafe code in ${file}`);
}
console.log('Manifest, runtime syntax, package assets, CSP conventions, and credential checks passed.');
