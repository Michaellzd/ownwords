import { rewrite, validateSettings, STYLES } from './rewrite.js';
import { UserError } from './errors.js';
import { LANGUAGES, DEFAULT_OUTPUT_LANGUAGE, isLanguage, resolveUiLanguage } from './languages.js';
import { translate, localizeDocument } from './i18n.js';

const $ = (id) => document.getElementById(id);
const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';
const PRESETS = [DEFAULT_MODEL, 'openai/gpt-6-luna'];
const generateKeys = { natural: 'generateNatural', concise: 'generateConcise', grammar: 'generateGrammar' };
let settings = { apiKey: '', model: DEFAULT_MODEL };
let uiLanguage = resolveUiLanguage(navigator.languages);
let outputLanguage = DEFAULT_OUTPUT_LANGUAGE;
let resultLanguage = DEFAULT_OUTPUT_LANGUAGE;
let controller = null;
let resultSource = '';
let sessionWrites = Promise.resolve();
let preferenceWrites = Promise.resolve();
let copyTimer;
let copied = false;
let ready = false;
let currentStatus = { key: '', kind: 'info', params: {} };

const t = (key, params) => translate(uiLanguage, key, params);
function style() { return document.querySelector('input[name="style"]:checked').value; }
function signature() { return JSON.stringify([$('draft').value, $('context').value, style(), outputLanguage]); }
function renderStatus() {
  $('status').textContent = currentStatus.key ? t(currentStatus.key, currentStatus.params) : '';
  $('status').dataset.kind = currentStatus.kind;
  $('status').hidden = !currentStatus.key;
}
function status(key = '', kind = 'info', params = {}) {
  currentStatus = { key, kind, params };
  renderStatus();
}
function reportError(error, fallback) {
  if (error instanceof UserError) status(error.code, 'error', error.params);
  else status(fallback, 'error');
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
function renderKeyVisibility() {
  const visible = $('api-key').type === 'text';
  $('key-toggle').textContent = t(visible ? 'hide' : 'show');
  $('key-toggle').setAttribute('aria-label', t(visible ? 'hideKey' : 'showKey'));
}
function renderSettings() {
  $('api-key').value = settings.apiKey;
  $('model-preset').value = PRESETS.includes(settings.model) ? settings.model : 'custom';
  $('model').value = settings.model;
  $('forget-key').disabled = !settings.apiKey;
  updateCustomModel();
  renderKeyVisibility();
}
function update() {
  const hasResult = Boolean($('result').value.trim());
  const format = new Intl.NumberFormat(uiLanguage);
  $('draft-count').textContent = `${format.format($('draft').value.length)} / ${format.format(8000)}`;
  // Plain character count only; individual websites may count text differently.
  $('result-count').textContent = t('count', { count: format.format(Array.from($('result').value).length) });
  $('result').hidden = !hasResult;
  $('result').lang = resultLanguage;
  $('empty-result').hidden = hasResult || Boolean(controller);
  $('result-meta').hidden = !hasResult;
  $('copy').disabled = !hasResult;
  $('copy').textContent = t(copied ? 'copied' : 'copy');
  $('stale-note').hidden = !hasResult || resultSource === signature();
  $('generate').disabled = !ready || Boolean(controller) || !$('draft').value.trim();
  $('generate-label').textContent = t(controller ? 'generating' : generateKeys[style()]);
  $('cancel').hidden = !controller;
  $('result-section').setAttribute('aria-busy', String(Boolean(controller)));
  const name = settings.model === DEFAULT_MODEL ? 'Haiku 5.5' : settings.model === PRESETS[1] ? 'GPT-6 Luna' : settings.model;
  $('model-status').textContent = settings.apiKey ? name : t('notConnected');
  $('model-status').title = settings.model;
  renderKeyVisibility();
  renderStatus();
}
function applyLanguage() {
  localizeDocument(document, uiLanguage);
  $('ui-language').value = uiLanguage;
  $('output-language').value = outputLanguage;
  update();
}
function persistSession() {
  if (!ready) return;
  const state = { draft: $('draft').value, context: $('context').value, style: style(), result: $('result').value, resultSource, resultLanguage };
  sessionWrites = sessionWrites.then(() => chrome.storage.session.set({ editor: state })).catch(() => status('sessionSaveError', 'error'));
}
function persistPreferences() {
  if (!ready) return;
  const preferences = { uiLanguage, outputLanguage };
  // A separate record avoids changing or accidentally deleting API credentials.
  preferenceWrites = preferenceWrites.then(() => chrome.storage.local.set({ preferences })).catch(() => status('preferencesError', 'error'));
}
function onEdit() {
  clearTimeout(copyTimer);
  copied = false;
  update();
  persistSession();
}
function fillLanguages(id) {
  for (const language of LANGUAGES) {
    const option = document.createElement('option');
    option.value = language.code;
    option.textContent = language.nativeName;
    option.lang = language.code;
    $(id).append(option);
  }
}
fillLanguages('ui-language');
fillLanguages('output-language');
applyLanguage();

$('ui-language').addEventListener('change', () => {
  if (!ready) return;
  uiLanguage = $('ui-language').value;
  applyLanguage();
  persistPreferences();
});
$('output-language').addEventListener('change', () => {
  if (!ready) return;
  outputLanguage = $('output-language').value;
  onEdit();
  persistPreferences();
});
$('settings-toggle').addEventListener('click', () => settingsOpen($('settings').hidden));
$('model-preset').addEventListener('change', updateCustomModel);
$('key-toggle').addEventListener('click', () => {
  $('api-key').type = $('api-key').type === 'password' ? 'text' : 'password';
  renderKeyVisibility();
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
    renderSettings();
    settingsOpen(false);
    status('settingsSaved', 'success');
    update();
    $('draft').focus();
  } catch (error) { reportError(error, 'settingsSaveError'); }
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
    status('keyRemoved', 'success');
    update();
  } catch { status('keyRemoveError', 'error'); }
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
    status('keyNeeded');
    $('api-key').focus();
    return;
  }
  const requestController = new AbortController();
  const source = signature();
  const requestedLanguage = outputLanguage;
  controller = requestController;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; requestController.abort(); }, 90000);
  update();
  status('generatingStatus');
  try {
    const text = await rewrite({ ...settings, draft: $('draft').value, context: $('context').value, style: style(), outputLanguage: requestedLanguage, signal: requestController.signal });
    if (requestController.signal.aborted || controller !== requestController) return;
    $('result').value = text;
    resultLanguage = requestedLanguage;
    resultSource = source;
    copied = false;
    clearTimeout(copyTimer);
    status('generated', 'success');
    persistSession();
  } catch (error) {
    if (controller !== requestController) return;
    if (requestController.signal.aborted) status(timedOut ? 'timeout' : 'cancelled', timedOut ? 'error' : 'info');
    else reportError(error, 'unexpectedError');
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
    copied = true;
    status('copiedStatus', 'success');
    update();
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copied = false; update(); }, 2000);
  } catch {
    $('result').focus();
    $('result').select();
    status('copyFailed', 'error');
  }
});

async function init() {
  if (!navigator.platform.includes('Mac')) $('shortcut-modifier').textContent = 'Ctrl';
  try {
    if (!globalThis.chrome?.storage?.local) throw new Error('extension context required');
    await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    const [saved, session] = await Promise.all([chrome.storage.local.get(['settings', 'preferences']), chrome.storage.session.get('editor')]);
    if (typeof saved.settings?.apiKey === 'string') settings.apiKey = saved.settings.apiKey;
    if (typeof saved.settings?.model === 'string' && saved.settings.model) settings.model = saved.settings.model;
    if (isLanguage(saved.preferences?.uiLanguage)) uiLanguage = saved.preferences.uiLanguage;
    if (isLanguage(saved.preferences?.outputLanguage)) outputLanguage = saved.preferences.outputLanguage;
    const editor = session.editor || {};
    $('draft').value = typeof editor.draft === 'string' ? editor.draft.slice(0, 8000) : '';
    $('context').value = typeof editor.context === 'string' ? editor.context.slice(0, 4000) : '';
    $('result').value = typeof editor.result === 'string' ? editor.result : '';
    if (Object.hasOwn(STYLES, editor.style)) document.querySelector(`input[value="${editor.style}"]`).checked = true;
    resultSource = typeof editor.resultSource === 'string' ? editor.resultSource : '';
    // Older editor sessions always produced English and used a three-part signature.
    try {
      const source = JSON.parse(resultSource);
      if (Array.isArray(source) && source.length === 3) resultSource = JSON.stringify([...source, DEFAULT_OUTPUT_LANGUAGE]);
    } catch { /* No prior result or an invalid signature is treated as stale. */ }
    resultLanguage = isLanguage(editor.resultLanguage) ? editor.resultLanguage : DEFAULT_OUTPUT_LANGUAGE;
    $('context-details').open = Boolean($('context').value);
    ready = true;
    $('ui-language').disabled = false;
    $('output-language').disabled = false;
    renderSettings();
    settingsOpen(!settings.apiKey);
    applyLanguage();
  } catch { status('storageError', 'error'); }
}
await init();
