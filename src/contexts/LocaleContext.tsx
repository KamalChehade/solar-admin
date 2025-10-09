import React, { createContext, useContext, useEffect, useState } from 'react';

type Lang = 'en' | 'ar';

// Lazy-load JSON translation files
const loadTranslations = async (lang: Lang) => {
  try {
    if (lang === 'ar') {
      const mod = await import('../locales/ar.json');
      return mod as any;
    }
    const mod = await import('../locales/en.json');
    return mod as any;
  } catch (e) {
    return {};
  }
};

interface LocaleContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem('solar_lang');
      return (v === 'ar' ? 'ar' : 'en') as Lang;
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('solar_lang', lang);
    } catch (e) {}
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const [dict, setDict] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadTranslations(lang).then((m) => {
      if (!mounted) return;
      setDict((m && m.default) || m || {});
    });
    return () => {
      mounted = false;
    };
  }, [lang]);

  const t = (key: string) => {
    if (dict && key in dict) return (dict as any)[key];
    // fallback to key
    return key;
  };

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  return <LocaleContext.Provider value={{ lang, setLang, t, dir }}>{children}</LocaleContext.Provider>;
};

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Don't crash the whole app if a component accidentally calls useLocale outside the provider.
    // Emit a warning and return safe defaults so the UI can continue to render.
    // This helps avoid a hard error during initial render order issues while we investigate.
    // eslint-disable-next-line no-console
    console.warn('useLocale called outside LocaleProvider — returning defaults');
    return {
      lang: 'en',
      setLang: () => {},
      t: (k: string) => k,
      dir: 'ltr',
    } as any;
  }
  return ctx;
}

export default LocaleContext;
