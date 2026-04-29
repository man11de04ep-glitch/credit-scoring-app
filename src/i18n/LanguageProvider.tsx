import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS, LANGUAGES, format, type LangCode } from "./translations";

const STORAGE_KEY = "smart-credit:lang";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    return stored && stored in TRANSLATIONS ? stored : "en";
  });

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : lang === "hi" ? "hi" : lang === "pa" ? "pa" : "en";
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = TRANSLATIONS[lang];
      const fallback = TRANSLATIONS.en;
      const tpl = dict[key] ?? fallback[key] ?? key;
      return format(tpl, params);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useT = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
};

export { LANGUAGES };
export type { LangCode };
