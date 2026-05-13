import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bot, Send, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { storage } from "@/lib/storage";
import { assess, getCurrentAssessment, type EngineAssessment } from "@/lib/engine";
import { exportAssessmentPdf } from "@/lib/exportPdf";
import { cn } from "@/lib/utils";
import { useT, type LangCode } from "@/i18n/LanguageProvider";

type Msg = { id: string; role: "user" | "bot"; content: string; time: string };

const HISTORY_KEY = "smart-credit:chat-history";

const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Msg[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveHistory(messages: Msg[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-200)));
  } catch {
    /* ignore */
  }
}

/** Multi-language intent matcher — works across EN/HI/PA/Hinglish/Pinglish. */
function detectIntent(q: string): "whyLow" | "improve" | "foir" | "whatIf" | "history" | "pdf" | "language" | "greet" | "fallback" {
  const s = q.toLowerCase();
  // PDF / export
 // PDF / export
  if (/(pdf|download|export|report|ਰਿਪੋਰਟ|डाउनलोड|रिपोर्ट|ਰਸੀਦ|file|receipt)/.test(s)) return "pdf";
  // History
  if (/(history|past|previous|attempt|ਇਤਿਹਾਸ|ਪਿਛਲਾ|पुराना|ਪਹਿਲਾਂ ਵਾਲਾ|pichla|purana)/.test(s)) return "history";
  // What-if
  if (/(what\.?if|simulate|agar|je|अगर|ਜੇ|badh|vadh|ਕਿਵੇਂ ਵਧੇਗਾ|calculator)/.test(s)) return "whatIf";
  // FOIR / loan eligibility / EMI
  if (/(foir|loan|emi|eligib|ਕਿਸ਼ਤ|ਕਰਜ਼|लोन|ऋण|लेਣਾ|ਕਿੰਨਾ ਮਿਲੇਗਾ)/.test(s)) return "foir";
  // why low
  if (/(why|kyu|kyun|kyo|ਕਿਉਂ|ਘੱਟ|low|kam|ਕਮ|reason|ਕਾਰਣ|ਵਜ੍ਹਾ)/.test(s)) return "whyLow";
  // Improve
  if (/(improve|raise|increase|better|tip|suggest|kaise|ਕਿਵੇਂ|ਵਧਾਓ|vadhao|vadhau)/.test(s)) return "improve";
  // Language
  if (/(language|भाषा|ਭਾਸ਼ਾ|hindi|english|punjabi|hinglish|pinglish)/.test(s)) return "language";
  // Greet
  if (/(hi|hello|hey|namaste|sat sri|नमस्ते|ਸਤ ਸ੍ਰੀ)/.test(s)) return "greet";
  return "fallback";
}

function answer(
  intent: ReturnType<typeof detectIntent>,
  question: string,
  a: EngineAssessment,
  t: (k: string, p?: Record<string, string | number>) => string,
  userName: string,
  lang: LangCode,
): string {
  switch (intent) {
    case "greet":
      return t("chat.greeting", {
        name: userName.split(" ")[0],
        score: a.score,
        band: t(`risk.${a.band}`),
        amount: fmtINR(a.foir.requestedAmount),
        emi: fmtINR(a.foir.requestedEmi),
      });

    case "whyLow": {
      const w = a.topWeaknesses;
      if (w.length === 0) {
        return `${t("dash.status.strong")} — ${a.summary}`;
      }
      return (
        a.summary +
        "\n\n" +
        w.map((c, i) => `${i + 1}. **${c.label}** — ${c.insight}`).join("\n")
      );
    }

    case "improve":
      return a.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n");

    case "foir": {
      const verdict = t(a.foir.headlineKey);
      return (
        t("chat.foir.summary", {
          band: t(`risk.${a.band}`),
          cap: Math.round(a.foir.foirCap * 100),
          maxEmi: fmtINR(a.foir.maxEmi),
          req: fmtINR(a.foir.requestedAmount),
          reqEmi: fmtINR(a.foir.requestedEmi),
          verdict,
        }) +
        "\n\n" +
        t(a.foir.reasonKey, {
          pct: Math.round(a.foir.foirCap * 100),
          cap: Math.round(a.foir.foirCap * 100),
          req: Math.round(a.foir.requestedFoir * 100),
        })
      );
    }

    case "whatIf": {
      // Default scenario: +20% income.
      const m = question.match(/(\d{1,3})\s?%/);
      const pct = m ? Math.min(200, parseInt(m[1], 10)) : 20;
      const newIncome = Math.round(a.profile.monthlyIncome * (1 + pct / 100));
      const next = assess({
        ...a.profile,
        monthlyIncome: newIncome,
        monthlySavings: Math.max(0, newIncome - a.profile.monthlyExpenses),
      });
      const delta = next.score - a.score;
      return t("chat.whatif.line", {
        field: t("sim.slider.income"),
        n: pct,
        newScore: next.score,
        delta: fmtSigned(delta),
      });
    }

    case "history": {
      const attempts = storage.getAttempts();
      if (attempts.length === 0) return t("chat.history.empty");
      const locale =
        lang === "hi" ? "hi-IN" : lang === "pa" ? "pa-IN" : "en-IN";
      return attempts
        .slice(0, 5)
        .map((at) =>
          t("chat.history.line", {
            date: new Date(at.createdAt).toLocaleDateString(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            score: at.score,
            band: t(`risk.${at.band}`),
          }),
        )
        .join("\n");
    }

    case "pdf": {
      exportAssessmentPdf(a, userName, t);
      return t("chat.pdf.done");
    }

    case "language":
      return t("common.language") + ": " + t("chat.subtitle");

    default:
      return t("chat.fallback");
  }
}

const Chat = () => {
  const profile = storage.getProfile();
  const user = storage.getUser();
  const { t, lang } = useT();
  const assessment = useMemo(() => (profile ? getCurrentAssessment() : null), [profile]);

  const buildGreeting = (a: EngineAssessment): Msg[] => [
    {
      id: "g1",
      role: "bot",
      content: t("chat.greeting", {
        name: (user?.name ?? "").split(" ")[0] || "there",
        score: a.score,
        band: t(`risk.${a.band}`),
        amount: fmtINR(a.foir.requestedAmount),
        emi: fmtINR(a.foir.requestedEmi),
      }),
      time: new Date().toISOString(),
    },
    {
      id: "g2",
      role: "bot",
      content:
        t("chat.suggest") +
        " " +
        [t("chat.q.whyLow"), t("chat.q.foir"), t("chat.q.whatIf")].join(" · "),
      time: new Date().toISOString(),
    },
  ];

  const [messages, setMessages] = useState<Msg[]>(() => {
    const stored = loadHistory();
    if (stored.length > 0) return stored;
    return assessment ? buildGreeting(assessment) : [];
  });

  // Re-greet (without wiping user history) if language changes.
  const lastLang = useRef<LangCode>(lang);
  useEffect(() => {
    if (lastLang.current !== lang && assessment) {
      lastLang.current = lang;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: t("chat.greeting", {
            name: (user?.name ?? "").split(" ")[0] || "there",
            score: assessment.score,
            band: t(`risk.${assessment.band}`),
            amount: fmtINR(assessment.foir.requestedAmount),
            emi: fmtINR(assessment.foir.requestedEmi),
          }),
          time: new Date().toISOString(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  if (!profile || !assessment) return <Navigate to="/app/onboarding" replace />;

  const send = (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      time: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    const intent = detectIntent(text);
    const reply = answer(intent, text, assessment, t, user?.name ?? "", lang);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "bot", content: reply, time: new Date().toISOString() },
      ]);
      setTyping(false);
    }, 450 + Math.random() * 350);
  };

  const quick = [
    t("chat.q.whyLow"),
    t("chat.q.improve"),
    t("chat.q.foir"),
    t("chat.q.whatIf"),
    t("chat.q.history"),
    t("chat.q.pdf"),
  ];

  return (
    <div className="animate-float-up">
      <div className="warm-card flex flex-col h-[calc(100vh-10rem)] min-h-[520px]">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="h-10 w-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{t("chat.title")}</p>
            <p className="text-xs text-muted-foreground">{t("chat.subtitle")}</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}
          {typing && <Bubble role="bot" content="" typing />}
        </div>

        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-secondary ease-soft transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-4 border-t border-border/60 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            className="bg-background"
          />
          <Button type="submit" className="bg-gradient-warm border-0 shadow-warm hover:opacity-95">
            <Send className="h-4 w-4" />
            <span className="sr-only">{t("chat.send")}</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

const Bubble = ({ role, content, typing = false }: { role: Msg["role"]; content: string; typing?: boolean }) => {
  const isBot = role === "bot";
  return (
    <div className={cn("flex gap-2.5 items-end", isBot ? "" : "flex-row-reverse")}>
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isBot ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
        )}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 text-sm whitespace-pre-wrap",
          isBot
            ? "rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground"
            : "rounded-2xl rounded-br-md bg-gradient-warm text-primary-foreground"
        )}
      >
        {typing ? (
          <span className="inline-flex gap-1">
            <Dot />
            <Dot delay={0.15} />
            <Dot delay={0.3} />
          </span>
        ) : (
          renderMarkdownLite(content)
        )}
      </div>
    </div>
  );
};

const Dot = ({ delay = 0 }: { delay?: number }) => (
  <span
    className="h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-pulse-ring"
    style={{ animationDelay: `${delay}s` }}
  />
);

// Tiny markdown: **bold** + line breaks
function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default Chat;
