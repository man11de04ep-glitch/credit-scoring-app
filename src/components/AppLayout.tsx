import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Sliders, Target, History, LogOut, Info, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/i18n/LanguageProvider";
import logo from "@/assets/smart-credit-logo.png";

const nav = [
  { to: "/app", icon: LayoutDashboard, key: "nav.dashboard", end: true },
  { to: "/app/chat", icon: MessageCircle, key: "nav.chat" },
  { to: "/app/simulator", icon: Sliders, key: "nav.simulator" },
  { to: "/app/goals", icon: Target, key: "nav.goals" },
  { to: "/app/history", icon: History, key: "nav.history" },
];

export const AppLayout = () => {
  const navigate = useNavigate();
  const user = storage.getUser();
  const { t } = useT();

  const signOut = () => {
    storage.clearUser();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground -ml-2"
              aria-label={t("common.back")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> {t("common.back")}
            </Button>
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="Smart Credit logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-warm object-cover"
              />
              <div>
                <p className="font-display text-lg font-semibold leading-tight">{t("app.name")}</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user ? t("nav.greeting", { name: user.name.split(" ")[0] }) : t("nav.greetingNew")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-1.5" /> {t("common.signOut")}
            </Button>
          </div>
        </header>

        <div
          role="note"
          className="mb-6 flex gap-2.5 rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <p className="leading-relaxed">
            <span className="font-medium text-foreground">{t("banner.localDemo")}</span>{" "}
            {t("banner.localDemoDesc")}
          </p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          <nav className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)] lg:self-start">
            <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ease-soft transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-card shadow-card text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
