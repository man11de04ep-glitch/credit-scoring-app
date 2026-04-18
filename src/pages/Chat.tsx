import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bot, Send, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storage } from "@/lib/storage";
import { computeScore, type ScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "bot"; content: string; time: string };

const greeting = (name: string, result: ScoreResult): Msg[] => [
  {
    id: "g1",
    role: "bot",
    content: `Hi ${name.split(" ")[0]}! I'm your Smart Credit assistant. Your current score is **${result.score}** (${result.band} risk).`,
    time: new Date().toISOString(),
  },
  {
    id: "g2",
    role: "bot",
    content: `Try asking: "Why is my score low?", "How can I improve?", "Will my loan be approved?", or "What if I save more?"`,
    time: new Date().toISOString(),
  },
];

function answer(question: string, result: ScoreResult): string {
  const q = question.toLowerCase();
  if (/why|low|reason|explain/.test(q)) {
    const w = result.topWeaknesses;
    if (w.length === 0) return `Good news — there's no major drag on your score. Your strongest signals are ${result.topStrengths.map((s) => s.label.toLowerCase()).join(" and ")}.`;
    return `Here's what's pulling your score down most:\n\n${w
      .map((c, i) => `${i + 1}. **${c.label}** — ${c.insight}`)
      .join("\n")}`;
  }
  if (/improve|raise|increase|grow|boost|better|tip|suggest/.test(q)) {
    return `Top things you can do right now:\n\n${result.suggestions
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n")}`;
  }
  if (/loan|approve|reject|qualify|borrow/.test(q)) {
    const v = result.loanVerdict;
    const fixes = v.fixes.length ? `\n\nFocus areas:\n${v.fixes.map((f) => `• ${f}`).join("\n")}` : "";
    return `**${v.headline}**\n\n${v.reason}${fixes}`;
  }
  if (/score|number|rating/.test(q)) {
    return `Your score is **${result.score} / 900** — that's ${result.band} risk. Approval likelihood is around **${result.approvalLikelihood}%**.`;
  }
  if (/save|saving/.test(q)) {
    const c = result.contributions.find((x) => x.key === "savingsRate")!;
    return `Savings rate carries about ${Math.round(c.weight * 100)}% of your score. ${c.insight} Aim for 20–30% of income going to savings.`;
  }
  if (/bill|utility|mobile|payment/.test(q)) {
    const c = result.contributions.find((x) => x.key === "billPayments")!;
    return `Bill payment behavior is the single biggest lever (~${Math.round(c.weight * 100)}% of your score). ${c.insight} Setting autopay is the easiest win.`;
  }
  if (/what if|simulate/.test(q)) {
    return `Open the **What-if simulator** from the menu — you can drag sliders to see exactly how each habit changes your score in real time.`;
  }
  if (/goal|target/.test(q)) {
    return `Head to **Goals** to set a target score and a date — I'll help you track progress with each new check.`;
  }
  if (/hello|hi|hey/.test(q)) {
    return `Hey there! Ask me anything about your score — for example "why is my score low" or "how do I improve".`;
  }
  return `I can help with: why your score is what it is, how to improve, loan approval chances, and what-if simulations. Try one of those!`;
}

const Chat = () => {
  const profile = storage.getProfile();
  const user = storage.getUser();
  const result = useMemo(() => (profile ? computeScore(profile) : null), [profile]);
  const [messages, setMessages] = useState<Msg[]>(() =>
    result ? greeting(user?.name ?? "there", result) : []
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  if (!profile || !result) return <Navigate to="/app/onboarding" replace />;

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text, time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    const reply = answer(text, result);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "bot", content: reply, time: new Date().toISOString() },
      ]);
      setTyping(false);
    }, 550 + Math.random() * 350);
  };

  const quick = ["Why is my score low?", "How can I improve?", "Will my loan be approved?"];

  return (
    <div className="animate-float-up">
      <div className="warm-card flex flex-col h-[calc(100vh-10rem)] min-h-[520px]">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="h-10 w-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Smart Credit assistant</p>
            <p className="text-xs text-muted-foreground">Knows your latest score · personalized answers</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}
          {typing && (
            <Bubble role="bot" content="" typing />
          )}
        </div>

        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); window.setTimeout(send, 0); }}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-secondary ease-soft transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-4 border-t border-border/60 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your score…"
            className="bg-background"
          />
          <Button type="submit" className="bg-gradient-warm border-0 shadow-warm hover:opacity-95">
            <Send className="h-4 w-4" />
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
            <Dot /><Dot delay={0.15} /><Dot delay={0.3} />
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
