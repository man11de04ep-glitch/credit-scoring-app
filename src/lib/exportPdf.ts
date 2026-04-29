import jsPDF from "jspdf";
import type { EngineAssessment } from "./engine";

type T = (key: string, params?: Record<string, string | number>) => string;

/**
 * Generate a Smart Credit PDF report.
 * Pass a translator `t` to localise headings & FOIR strings; falls back to English.
 */
export function exportAssessmentPdf(a: EngineAssessment, userName?: string, t?: T) {
  const tr = (key: string, fallback: string, params?: Record<string, string | number>) =>
    t ? t(key, params) : fallback;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  // Header band
  doc.setFillColor(255, 237, 224);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(40, 30, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Smart Credit Report", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 90, 70);
  doc.text(
    `Generated ${new Date(a.computedAt).toLocaleString()}${userName ? ` · ${userName}` : ""}`,
    40,
    70,
  );

  y = 120;
  doc.setTextColor(30, 25, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(tr("dash.label", "Smart Credit Score"), 40, y);
  y += 24;
  doc.setFontSize(36);
  doc.setTextColor(220, 90, 60);
  doc.text(String(a.score), 40, y);
  doc.setFontSize(11);
  doc.setTextColor(80, 70, 65);
  doc.text(`${a.riskLabel}  ·  ${tr("dash.approval", "Approval likelihood")} ${a.approvalLikelihood}%`, 110, y - 8);
  doc.text(a.summary, 110, y + 8, { maxWidth: W - 150 });

  y += 40;
  doc.setDrawColor(230, 210, 195);
  doc.line(40, y, W - 40, y);
  y += 24;

  // Loan verdict
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 25, 20);
  doc.text("Loan Verdict", 40, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(a.loanVerdict.headline, 40, y);
  y += 16;
  doc.setTextColor(100, 90, 85);
  const reasonLines = doc.splitTextToSize(a.loanVerdict.reason, W - 80);
  doc.text(reasonLines, 40, y);
  y += reasonLines.length * 14 + 10;

  // FOIR analysis (localised)
  if (y > 720) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 25, 20);
  doc.text(tr("foir.title", "Loan eligibility & FOIR analysis"), 40, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const headline = tr(a.foir.headlineKey, a.foir.verdict);
  doc.text(headline, 40, y);
  y += 16;
  const reason = tr(a.foir.reasonKey, "", {
    pct: Math.round(a.foir.foirCap * 100),
    cap: Math.round(a.foir.foirCap * 100),
    req: Math.round(a.foir.requestedFoir * 100),
  });
  if (reason) {
    doc.setTextColor(100, 90, 85);
    const lines = doc.splitTextToSize(reason, W - 80);
    doc.text(lines, 40, y);
    y += lines.length * 14 + 4;
  }
  doc.setTextColor(60, 50, 45);
  doc.setFontSize(10);
  doc.text(
    `${tr("foir.cap", "FOIR cap")}: ${Math.round(a.foir.foirCap * 100)}%  ·  ` +
      `${tr("foir.maxEmi", "Max safe EMI")}: ₹${a.foir.maxEmi.toLocaleString("en-IN")}  ·  ` +
      `${tr("foir.maxLoan", "Max safe loan")}: ₹${a.foir.maxPrincipal.toLocaleString("en-IN")}`,
    40,
    y,
  );
  y += 14;
  doc.text(
    `${tr("foir.alt.amount", "Suggested amount")}: ₹${a.foir.alternativeAmount.toLocaleString("en-IN")}  ·  ` +
      `${tr("foir.alt.emi", "Comfortable EMI")}: ₹${a.foir.alternativeEmi.toLocaleString("en-IN")}`,
    40,
    y,
  );
  y += 22;

  // Factor breakdown
  if (y > 720) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 25, 20);
  doc.text(tr("dash.shaping", "Factor Breakdown"), 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  a.contributions.forEach((c) => {
    if (y > 760) {
      doc.addPage();
      y = 60;
    }
    doc.setTextColor(30, 25, 20);
    doc.text(`${c.label}`, 40, y);
    doc.setTextColor(120, 100, 90);
    doc.text(
      `${Math.round(c.rawSubScore * 100)}/100  ·  weight ${Math.round(c.weight * 100)}%  ·  ${c.status}`,
      W - 200,
      y,
    );
    y += 12;
    const insight = doc.splitTextToSize(c.insight, W - 80);
    doc.setTextColor(140, 120, 110);
    doc.text(insight, 40, y);
    y += insight.length * 12 + 6;
  });

  // Suggestions
  if (y > 700) {
    doc.addPage();
    y = 60;
  }
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 25, 20);
  doc.text(tr("dash.suggestions", "Personalized Suggestions"), 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  a.suggestions.forEach((s, i) => {
    if (y > 780) {
      doc.addPage();
      y = 60;
    }
    const lines = doc.splitTextToSize(`${i + 1}. ${s}`, W - 80);
    doc.setTextColor(70, 60, 55);
    doc.text(lines, 40, y);
    y += lines.length * 13 + 4;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(160, 140, 130);
    doc.text(
      `Smart Credit · Page ${i} of ${pages}`,
      W / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  doc.save(`smart-credit-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
