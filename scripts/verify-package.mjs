import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '../src/languages.js';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
execFileSync(process.execPath, ['scripts/package.mjs'], { stdio: 'inherit' });
const archive = path.join(root, 'dist/ownwords-chrome.zip');
const { version } = JSON.parse(await readFile('manifest.json', 'utf8'));
assert((await readFile(archive)).equals(await readFile(`dist/ownwords-${version}.zip`)), 'Stable download must match the versioned package');
const files = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
assert(files.includes('manifest.json') && files.includes('START-HERE.txt'));
for (const file of files) {
  assert(!file.startsWith('/') && !file.split('/').includes('..'), 'Archive paths must be relative');
  assert(!/(^|\/)(\.git|node_modules|tests|artifacts|\.env[^/]*)(\/|$)/.test(file), `Unexpected packaged file: ${file}`);
}
for (const { code, chromeLocale } of LANGUAGES) {
  assert(files.includes(`src/locales/${code}.js`));
  assert(files.includes(`_locales/${chromeLocale}/messages.json`));
}
const extracted = await mkdtemp(path.join(tmpdir(), 'ownwords-package-'));
try {
  execFileSync('unzip', ['-q', archive, '-d', extracted]);
  for (const file of files) {
    const content = await readFile(path.join(extracted, file), 'utf8');
    assert(!/sk-or-v1-[a-f0-9]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/i.test(content), `Potential credential in ${file}`);
  }
  console.log('Package structure, translations, install guide, and credential checks passed. Testing the extracted download…');
  execFileSync(process.execPath, ['scripts/browser-test.mjs', extracted], { stdio: 'inherit' });
} finally {
  await rm(extracted, { recursive: true, force: true });
}
