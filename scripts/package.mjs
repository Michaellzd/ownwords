import { mkdir, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
execFileSync(process.execPath, ['scripts/check.mjs'], { stdio: 'inherit' });
const { version } = JSON.parse(await readFile('manifest.json', 'utf8'));
const archive = `dist/x-draft-${version}.zip`;
await mkdir('dist', { recursive: true });
await rm(archive, { force: true });
// Explicit allowlist: no .git, credentials, tests, dependencies, or developer files.
const files = ['manifest.json', 'panel.html', 'src/background.js', 'src/panel.js', 'src/panel.css', 'src/rewrite.js', 'icons/16.png', 'icons/48.png', 'icons/128.png', 'LICENSE'];
execFileSync('zip', ['-q', archive, ...files]);
console.log(`Created ${archive}`);
