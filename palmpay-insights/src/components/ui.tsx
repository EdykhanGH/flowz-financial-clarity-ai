import {
  AlertTriangle, CheckCircle2, Dice5, Hourglass, PiggyBank, Receipt, Repeat, ShieldAlert, TrendingUp, Users, Lightbulb,
} from "lucide-react";
import type { Insight, Severity } from "../lib/types";

const ICONS: Record<string, typeof AlertTriangle> = {
  shield: ShieldAlert, hourglass: Hourglass, trending: TrendingUp, dice: Dice5, repeat: Repeat, receipt: Receipt,
  users: Users, piggy: PiggyBank, check: CheckCircle2,
};

const TONE: Record<Severity, { bg: string; fg: string; label: string }> = {
  alert: { bg: "bg-bad-soft", fg: "text-bad", label: "Needs attention" },
  warn: { bg: "bg-warn-soft", fg: "text-warn", label: "Heads up" },
  tip: { bg: "bg-tip-soft", fg: "text-tip", label: "Tip" },
  good: { bg: "bg-ok-soft", fg: "text-ok", label: "Well done" },
};

export function InsightCard({ insight, onAction }: { insight: Insight; onAction?: (i: Insight) => void }) {
  const Icon = ICONS[insight.icon] ?? Lightbulb;
  const tone = TONE[insight.severity];
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.bg} ${tone.fg}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wide ${tone.fg}`}>{tone.label}</div>
          <div className="mt-0.5 font-bold leading-snug">{insight.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{insight.body}</p>
          {insight.action && (
            <button
              onClick={() => onAction?.(insight)}
              className="mt-3 rounded-full bg-pp-soft px-3 py-1.5 text-sm font-semibold text-pp hover:bg-pp hover:text-white"
            >
              {insight.action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? "#16A34A" : score >= 45 ? "#F59E0B" : "#F87171";
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Money health score ${score} out of 100`}>
      <circle cx="38" cy="38" r={r} stroke="rgba(255,255,255,.25)" strokeWidth="7" fill="none" />
      <circle
        cx="38" cy="38" r={r} stroke={color} strokeWidth="7" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="20" fontWeight="800" fill="white">{score}</text>
    </svg>
  );
}

export function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base font-extrabold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
