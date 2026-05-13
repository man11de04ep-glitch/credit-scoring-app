import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { storage, type ScoreAttempt } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CompareAttempts } from "@/components/CompareAttempts";
import { SnapshotDetail } from "@/components/SnapshotDetail";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/i18n/LanguageProvider";

const History = () => {
  const { t } = useT();
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<ScoreAttempt[]>(() => storage.getAttempts());
  const profile = storage.getProfile();
  const [selected, setSelected] = useState<ScoreAttempt | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  if (!profile) return <Navigate to="/app/onboarding" replace />;

  if (attempts.length === 0) {
    return (
      <div className="warm-card p-10 text-center">
        <p className="text-muted-foreground">No score attempts yet.</p>
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === attempts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attempts.map((a) => a.id)));
    }
  };

  const handleDelete = () => {
    const ids = Array.from(selectedIds);
    storage.deleteAttempts(ids);
    setAttempts((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelectedIds(new Set());
    setShowDeleteDialog(false);
    setSelected(null);
    toast({ description: `${ids.length} record(s) deleted.` });
  };

  // Build chart data — oldest to newest
  const chronological = [...attempts].reverse();
  const min = Math.min(...chronological.map((a) => a.score), 300);
  const max = Math.max(...chronological.map((a) => a.score), 900);
  const range = Math.max(50, max - min);

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Score history</p>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold mt-1">Your progress over time</h1>
        <p className="text-muted-foreground mt-2">Every check is logged so you can see trends.</p>
      </div>

      <div className="warm-card p-6">
        <div className="relative h-56 w-full">
          <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="hist-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chronological.length > 1 ? (
              (() => {
                const pts = chronological.map((a, i) => {
                  const x = (i / (chronological.length - 1)) * 580 + 10;
                  const y = 180 - ((a.score - min) / range) * 160;
                  return { x, y, a };
                });
                const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                const fill = `${path} L${pts[pts.length - 1].x},190 L${pts[0].x},190 Z`;
                return (
                  <>
                    <path d={fill} fill="url(#hist-fill)" />
                    <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((p) => (
                      <circle key={p.a.id} cx={p.x} cy={p.y} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </>
                );
              })()
            ) : (
              <text x={300} y={100} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={12}>
                Add another check to see a trend line
              </text>
            )}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{new Date(chronological[0].createdAt).toLocaleDateString()}</span>
          <span>{new Date(chronological[chronological.length - 1].createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <CompareAttempts attempts={attempts} />

      <div className="warm-card overflow-hidden">
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-secondary/40 border-b border-border/60">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  {t("history.deleteSelected")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("history.deleteSelected")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("history.deleteConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium w-10">
                <Checkbox
                  checked={selectedIds.size === attempts.length && attempts.length > 0}
                  onCheckedChange={selectAll}
                />
              </th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Score</th>
              <th className="px-5 py-3 font-medium">Risk</th>
              <th className="px-5 py-3 font-medium hidden sm:table-cell">Income / Expenses</th>
              <th className="px-5 py-3 font-medium hidden md:table-cell">Bills on time</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
                className="border-t border-border/60 cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(a.id)}
                    onCheckedChange={() => toggleSelect(a.id)}
                  />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-5 py-3 font-display text-lg font-semibold">{a.score}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                      a.band === "low" && "bg-accent/15 text-accent",
                      a.band === "medium" && "bg-warning/15 text-warning-foreground",
                      a.band === "high" && "bg-destructive/15 text-destructive"
                    )}
                  >
                    {a.band}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                  ₹{a.profile.monthlyIncome.toLocaleString()} / ₹{a.profile.monthlyExpenses.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                  Util {Math.round(a.profile.utilityOnTimeRate * 100)}% · Mob {Math.round(a.profile.mobileOnTimeRate * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SnapshotDetail
        attempt={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
};

export default History;
