import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const existing = storage.getUser();
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
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold">Smart Credit</span>
        </div>

        <div className="warm-card p-7">
          <h1 className="font-display text-2xl font-semibold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup"
              ? "We'll save your score history so you can track progress."
              : "Sign in to see your latest score and goals."}
          </p>

          <form className="space-y-4 mt-6" onSubmit={submit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aisha Khan" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-gradient-warm border-0 shadow-warm hover:opacity-95 h-11">
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
            className="text-sm text-muted-foreground hover:text-foreground mt-5 w-full text-center"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Demo app · data stored locally on your device
        </p>
      </div>
    </div>
  );
};

export default Auth;
