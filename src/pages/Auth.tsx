import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const existing = storage.getUser();
  const [mode, setMode] = useState<"signin" | "signup">(existing ? "signin" : "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(existing?.email ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Please enter your email");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    const finalName =
      mode === "signup" ? name.trim() : existing?.name ?? trimmedEmail.split("@")[0];
    storage.saveUser({
      name: finalName,
      email: trimmedEmail,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    toast.success(mode === "signup" ? "Welcome to Smart Credit!" : "Welcome back!");
    navigate(storage.getProfile() ? "/app" : "/app/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold">Smart Credit</span>
        </div>

        <div className="warm-card p-7">
          <h1 className="font-display text-2xl font-semibold">
            {mode === "signup" ? "Create your local profile" : "Continue on this device"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup"
              ? "We'll save your score history on this device so you can track progress."
              : "Pick up where you left off on this browser."}
          </p>

          <div
            role="note"
            className="mt-5 flex gap-3 rounded-xl border border-border/70 bg-secondary/40 p-3.5 text-xs text-muted-foreground"
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
            <p className="leading-relaxed">
              <span className="font-medium text-foreground">Local-only profile.</span>{" "}
              Smart Credit does not have user accounts or passwords yet. Your data is stored only
              in this browser — anyone with access to this device can view it. Don't enter real
              banking or sensitive financial details.
            </p>
          </div>

          <form className="space-y-4 mt-6" onSubmit={submit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aisha Khan"
                  maxLength={80}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (used as a label only)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                maxLength={120}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-warm border-0 shadow-warm hover:opacity-95 h-11"
            >
              {mode === "signup" ? "Create local profile" : "Continue"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
            className="text-sm text-muted-foreground hover:text-foreground mt-5 w-full text-center"
          >
            {mode === "signup"
              ? "Already set up on this device? Continue"
              : "New here? Create a local profile"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Demo app · data stored locally on your device · no password protection
        </p>
      </div>
    </div>
  );
};

export default Auth;
