import { Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT, LANGUAGES, type LangCode } from "@/i18n/LanguageProvider";

export const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const { lang, setLang, t } = useT();
  return (
    <div className="flex items-center gap-2">
      {!compact && <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />}
      <Select value={lang} onValueChange={(v) => setLang(v as LangCode)}>
        <SelectTrigger
          aria-label={t("common.language")}
          className="h-9 w-[140px] bg-card/70 border-border/70 text-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.native}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
