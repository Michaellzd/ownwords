import { rewrite, validateSettings } from './rewrite.js';

const $ = (id) => document.getElementById(id);
const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';
const PRESETS = [DEFAULT_MODEL, 'openai/gpt-6-luna'];
const labels = { natural: '改成自然英文', concise: '改得更简短', grammar: '修正英文语法' };
let settings = { apiKey: '', model: DEFAULT_MODEL };
let controller = null;
let resultSource = '';
let sessionWrites = Promise.resolve();
let copyTimer;
let ready = false;

function style() { return document.querySelector('input[name="style"]:checked').value; }
function signature() { return JSON.stringify([$('draft').value, $('context').value, style()]); }
function status(message = '', kind = 'info') {
  $('status').textContent = message;
  $('status').dataset.kind = kind;
  $('status').hidden = !message;
}
function settingsOpen(open) {
  $('settings').hidden = !open;
  $('settings-toggle').setAttribute('aria-expanded', String(open));
}
function updateCustomModel() {
  const custom = $('model-preset').value === 'custom';
  $('model').hidden = !custom;
  $('model-label').hidden = !custom;
  $('model').required = custom;
}
function renderSettings() {
  $('api-key').value = settings.apiKey;
  $('model-preset').value = PRESETS.includes(settings.model) ? settings.model : 'custom';
  $('model').value = settings.model;
  updateCustomModel();
  $('forget-key').disabled = !settings.apiKey;
  const name = settings.model === DEFAULT_MODEL ? 'Haiku 5.5' : settings.model === PRESETS[1] ? 'GPT-6 Luna' : settings.model;
  $('model-status').textContent = settings.apiKey ? name : '尚未连接';
  $('model-status').title = settings.model;
}
function update() {
  const hasResult = Boolean($('result').value.trim());
  $('draft-count').textContent = `${$('draft').value.length.toLocaleString('en-US')} / 8,000`;
  // Plain character count only; X uses its own weighted length rules.
  $('result-count').textContent = `${Array.from($('result').value).length.toLocaleString('en-US')} 字符`;
  $('result').hidden = !hasResult;
  $('empty-result').hidden = hasResult || Boolean(controller);
  $('result-meta').hidden = !hasResult;
  $('copy').disabled = !hasResult;
  $('stale-note').hidden = !hasResult || resultSource === signature();
  $('generate').disabled = !ready || Boolean(controller) || !$('draft').value.trim();
  $('generate-label').textContent = controller ? '正在斟酌你的表达…' : labels[style()];
  $('cancel').hidden = !controller;
  $('result-section').setAttribute('aria-busy', String(Boolean(controller)));
}
function persistSession() {
  if (!ready) return;
  const state = { draft: $('draft').value, context: $('context').value, style: style(), result: $('result').value, resultSource };
  sessionWrites = sessionWrites.then(() => chrome.storage.session.set({ editor: state })).catch(() => {
    status('临时保存失败。关闭侧边栏前，请复制需要保留的文字。', 'error');
  });
}
function onEdit() {
  clearTimeout(copyTimer);
  $('copy').textContent = '复制';
  update();
  persistSession();
}

$('settings-toggle').addEventListener('click', () => settingsOpen($('settings').hidden));
$('model-preset').addEventListener('change', updateCustomModel);
$('key-toggle').addEventListener('click', () => {
  const show = $('api-key').type === 'password';
  $('api-key').type = show ? 'text' : 'password';
  $('key-toggle').textContent = show ? '隐藏' : '显示';
  $('key-toggle').setAttribute('aria-label', `${show ? '隐藏' : '显示'} API Key`);
});
$('settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!ready) return;
  const save = event.submitter;
  try {
    const next = validateSettings({ apiKey: $('api-key').value, model: $('model-preset').value === 'custom' ? $('model').value : $('model-preset').value });
    if (save) save.disabled = true;
    await chrome.storage.local.set({ settings: next });
    settings = next;
    $('api-key').type = 'password';
    $('key-toggle').textContent = '显示';
    $('key-toggle').setAttribute('aria-label', '显示 API Key');
    renderSettings();
    settingsOpen(false);
    status('设置已保存。可以开始改稿了。', 'success');
    $('draft').focus();
  } catch (error) { status(error.message || '设置保存失败，请重试。', 'error'); }
  finally { if (save) save.disabled = false; }
});
$('forget-key').addEventListener('click', async () => {
  if (!ready) return;
  try {
    controller?.abort();
    const next = { ...settings, apiKey: '' };
    await chrome.storage.local.set({ settings: next });
    settings = next;
    renderSettings();
    status('已从此浏览器移除 Key。', 'success');
  } catch { status('Key 移除失败，请重试。', 'error'); }
});

$('draft').addEventListener('input', onEdit);
$('context').addEventListener('input', onEdit);
$('result').addEventListener('input', onEdit);
document.querySelectorAll('input[name="style"]').forEach((input) => input.addEventListener('change', onEdit));
$('clear').addEventListener('click', () => {
  controller?.abort();
  controller = null;
  $('draft').value = '';
  $('context').value = '';
  $('result').value = '';
  resultSource = '';
  status();
  onEdit();
  $('draft').focus();
});
$('cancel').addEventListener('click', () => controller?.abort());
$('rewrite-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!ready || controller) return;
  if (!settings.apiKey) {
    settingsOpen(true);
    status('先保存你的 OpenRouter Key，然后就能开始。');
    $('api-key').focus();
    return;
  }
  const requestController = new AbortController();
  const source = signature();
  controller = requestController;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; requestController.abort(); }, 90000);
  update();
  status('正在改写，可以继续查看原帖。');
  try {
    const text = await rewrite({ ...settings, draft: $('draft').value, context: $('context').value, style: style(), signal: requestController.signal });
    if (requestController.signal.aborted || controller !== requestController) return;
    $('result').value = text;
    resultSource = source;
    $('copy').textContent = '复制';
    clearTimeout(copyTimer);
    status('已生成。读一遍，确认它表达了你的意思。', 'success');
    persistSession();
  } catch (error) {
    if (controller !== requestController) return;
    if (requestController.signal.aborted) status(timedOut ? '模型响应超过 90 秒，请重试或更换模型。' : '已取消。', timedOut ? 'error' : 'info');
    else status(error.message, 'error');
  } finally {
    clearTimeout(timeout);
    if (controller === requestController) { controller = null; update(); }
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && $('settings').hidden) {
    event.preventDefault();
    if (!$('generate').disabled) $('rewrite-form').requestSubmit();
  }
});
$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('result').value);
    $('copy').textContent = '已复制';
    status('英文已复制。', 'success');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { $('copy').textContent = '复制'; }, 2000);
  } catch {
    $('result').focus();
    $('result').select();
    status('自动复制失败，已选中结果。请按 Ctrl/Cmd + C 复制。', 'error');
  }
});

async function init() {
  update();
  if (!navigator.platform.includes('Mac')) $('shortcut-modifier').textContent = 'Ctrl';
  try {
    if (!globalThis.chrome?.storage?.local) throw new Error('extension context required');
    await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    const [saved, session] = await Promise.all([chrome.storage.local.get('settings'), chrome.storage.session.get('editor')]);
    settings = { ...settings, ...saved.settings };
    const editor = session.editor || {};
    $('draft').value = typeof editor.draft === 'string' ? editor.draft.slice(0, 8000) : '';
    $('context').value = typeof editor.context === 'string' ? editor.context.slice(0, 4000) : '';
    $('result').value = typeof editor.result === 'string' ? editor.result : '';
    if (Object.hasOwn(labels, editor.style)) document.querySelector(`input[value="${editor.style}"]`).checked = true;
    resultSource = typeof editor.resultSource === 'string' ? editor.resultSource : '';
    $('context-details').open = Boolean($('context').value);
    ready = true;
    renderSettings();
    settingsOpen(!settings.apiKey);
    update();
  } catch {
    status('无法读取扩展存储。请在 Chrome 中加载此扩展后打开侧边栏；若已加载，请重新打开。', 'error');
  }
}
await init();
