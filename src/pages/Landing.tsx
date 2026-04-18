import { useNavigate, Link } from "react-router-dom";
import { Sparkles, ShieldCheck, TrendingUp, ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import heroIllustration from "@/assets/hero-illustration.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const user = storage.getUser();

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Smart Credit</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate(user ? "/app" : "/auth")}
          className="text-foreground"
        >
          {user ? "Open app" : "Sign in"}
        </Button>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-float-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-ring" />
            Built for first-time borrowers
          </span>
          <h1 className="font-display text-5xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mt-6">
            Your credit score,{" "}
            <span className="gradient-text">explained kindly.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-lg">
            No credit history? No problem. Smart Credit looks at how you actually live —
            your bills, savings, and habits — and tells you exactly how to grow your score.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button
              size="lg"
              onClick={() => navigate(user ? "/app" : "/auth")}
              className="bg-gradient-warm border-0 shadow-warm hover:opacity-95 h-12 px-6"
            >
              Check my score <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/app/chat")}
              className="h-12 px-6"
            >
              Talk to the chatbot
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-md">
            <Stat value="300–900" label="Score range" />
            <Stat value="7" label="Smart signals" />
            <Stat value="0" label="Credit history needed" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-gradient-warm opacity-25 blur-3xl rounded-full" />
          <div className="relative warm-card p-3 sm:p-4 overflow-hidden">
            <img
              src={heroIllustration}
              alt="Illustration of a glowing credit score gauge surrounded by leaves, growth bars and a friendly chat bubble"
              width={1280}
              height={1280}
              className="w-full h-auto rounded-2xl"
            />
            <div className="absolute left-6 bottom-6 right-6 sm:left-8 sm:bottom-8 sm:right-auto sm:max-w-xs rounded-2xl bg-card/90 backdrop-blur-md border border-border/60 shadow-card p-4">
              <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wide">
                <TrendingUp className="h-3.5 w-3.5" /> Live preview
              </div>
              <div className="font-display text-3xl font-semibold mt-1 gradient-text">642 → 710</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Setting bill autopay alone can lift your score by ~70 points.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 grid md:grid-cols-3 gap-5">
        <Feature
          icon={ShieldCheck}
          title="Transparent scoring"
          desc="See exactly which 7 factors shape your score and how much each one matters."
        />
        <Feature
          icon={Bot}
          title="Friendly explanations"
          desc="Plain-language reasons for your score — no jargon, no judgement."
        />
        <Feature
          icon={TrendingUp}
          title="What-if simulator"
          desc="Drag a slider to see how saving more or paying on time changes your score."
        />
      </section>

      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>Smart Credit · A FinTech demo</span>
          <Link to="/auth" className="hover:text-foreground">Get started →</Link>
        </div>
      </footer>
    </div>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="font-display text-2xl font-semibold">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </div>
);



const Feature = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="warm-card p-6">
    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="font-display text-xl font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground mt-2">{desc}</p>
  </div>
);

export default Landing;
