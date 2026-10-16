// Fixed identifiers are shared by UI preferences and the trusted system prompt.
export const LANGUAGES = [
  { code: 'en', nativeName: 'English', promptName: 'English', chromeLocale: 'en' },
  { code: 'zh-CN', nativeName: '简体中文', promptName: 'Simplified Chinese', chromeLocale: 'zh_CN' },
  { code: 'ja', nativeName: '日本語', promptName: 'Japanese', chromeLocale: 'ja' },
  { code: 'ko', nativeName: '한국어', promptName: 'Korean', chromeLocale: 'ko' },
  { code: 'es', nativeName: 'Español', promptName: 'Spanish', chromeLocale: 'es' },
];
export const DEFAULT_OUTPUT_LANGUAGE = 'en';
export function isLanguage(code) { return LANGUAGES.some((language) => language.code === code); }
export function resolveUiLanguage(preferred = []) {
  for (const candidate of preferred) {
    if (typeof candidate !== 'string') continue;
    const base = candidate.replaceAll('_', '-').split('-')[0].toLowerCase();
    const match = LANGUAGES.find((language) => language.code.split('-')[0] === base);
    if (match) return match.code;
  }
  return 'en';
}
