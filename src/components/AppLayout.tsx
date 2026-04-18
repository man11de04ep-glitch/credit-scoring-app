import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Sliders, Target, History, LogOut, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/chat", icon: MessageCircle, label: "Chat" },
  { to: "/app/simulator", icon: Sliders, label: "What-if" },
  { to: "/app/goals", icon: Target, label: "Goals" },
  { to: "/app/history", icon: History, label: "History" },
];

export const AppLayout = () => {
  const navigate = useNavigate();
  const user = storage.getUser();

  const signOut = () => {
    storage.clearUser();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-warm flex items-center justify-center shadow-warm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-tight">Smart Credit</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user ? `Hi ${user.name.split(" ")[0]}` : "Build your credit story"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-1.5" /> Sign out
          </Button>
        </header>

        <div
          role="note"
          className="mb-6 flex gap-2.5 rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <p className="leading-relaxed">
            <span className="font-medium text-foreground">Local-only demo.</span> No accounts or
            passwords — your data is stored only in this browser and is visible to anyone using
            this device. Avoid entering real banking details.
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
                    {item.label}
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
