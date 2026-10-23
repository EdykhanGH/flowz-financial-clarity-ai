import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import clsx from "clsx";
import iconUrl from "@/assets/icon.svg";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <img src={iconUrl} alt="" className="h-8 w-8" />
      <span className="text-xl">flowz</span>
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-current border-r-transparent", className)}
      aria-label="Loading"
    />
  );
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center text-brand">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close" />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper p-5 pb-safe shadow-card sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button className="rounded-full p-2 hover:bg-line/50" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = value > max ? "bg-coral" : pct >= 80 ? "bg-sun" : "bg-brand";
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-line/60" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-semibold text-coral">{children}</p>;
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="card px-6 py-10 text-center">
      <div className="mb-3 text-5xl">{emoji}</div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

/** A password box with an eye button to show or hide what's typed. */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={clsx("field pr-12", className)} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute inset-y-0 right-1 my-auto grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-line/50 hover:text-ink"
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
      >
        {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
