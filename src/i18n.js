import en from './locales/en.js';
import zh from './locales/zh-CN.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import es from './locales/es.js';

export const translations = { en, 'zh-CN': zh, ja, ko, es };

export function translate(locale, key, params = {}) {
  const dictionary = Object.hasOwn(translations, locale) ? translations[locale] : en;
  const message = Object.hasOwn(dictionary, key) ? dictionary[key] : Object.hasOwn(en, key) ? en[key] : key;
  return message.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
}

export function localizeDocument(document, locale) {
  document.documentElement.lang = locale;
  for (const [attribute, target] of [['data-i18n', null], ['data-i18n-placeholder', 'placeholder'], ['data-i18n-aria-label', 'aria-label']]) {
    for (const element of document.querySelectorAll(`[${attribute}]`)) {
      const value = translate(locale, element.getAttribute(attribute));
      if (target) element.setAttribute(target, value);
      else element.textContent = value;
    }
  }
}
