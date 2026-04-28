import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export const SplashScreen = ({ duration = 3000, onDone }: { duration?: number; onDone?: () => void }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leave = setTimeout(() => setLeaving(true), Math.max(0, duration - 400));
    const done = setTimeout(() => onDone?.(), duration);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-soft transition-opacity duration-500 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="status"
      aria-label="Loading Smart Credit"
    >
      <div className="flex flex-col items-center gap-5 animate-float-up">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-warm blur-2xl opacity-60 rounded-full animate-pulse" />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-warm flex items-center justify-center shadow-warm">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Smart Credit</h1>
          <p className="text-sm text-muted-foreground mt-1">Your credit score, explained kindly.</p>
        </div>
        <div className="h-1 w-40 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-warm rounded-full"
            style={{ animation: `splash-bar ${duration}ms ease-out forwards` }}
          />
        </div>
      </div>
      <style>{`
        @keyframes splash-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
