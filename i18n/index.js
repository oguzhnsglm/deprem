import React, { createContext, useCallback, useContext, useState } from 'react';
import tr from './tr';
import en from './en';
import ja from './ja';

const TRANSLATIONS = { tr, en, ja };

export const SUPPORTED_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

const I18nContext = createContext({
  t: (key) => key,
  lang: 'tr',
  setLang: () => {},
});

export const I18nProvider = ({ children, initialLang = 'tr' }) => {
  const [lang, setLangState] = useState(
    TRANSLATIONS[initialLang] ? initialLang : 'tr'
  );

  const setLang = useCallback((code) => {
    if (TRANSLATIONS[code]) {
      setLangState(code);
    }
  }, []);

  const t = useCallback(
    (key, params) => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.tr;
      let str = dict[key] ?? TRANSLATIONS.tr[key] ?? key;
      if (params) {
        str = str.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''));
      }
      return str;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
