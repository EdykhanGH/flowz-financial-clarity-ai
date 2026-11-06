import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileSpreadsheet, HandCoins, Mic, Package, Sparkles, Wallet } from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/ui";
import { CATEGORY_BY_ID, KINDS, kindLabel } from "@/lib/kinds";
import { formatMoney } from "@/lib/money";
import { parseLine } from "@/lib/parse";

// The landing page people see at www.flowz.ng before signing in.

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function Welcome() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-paper text-ink">
      <Nav />
      <main>
        <Hero />
        <Solves />
        <TryIt />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

// ---------- layout helpers ----------

function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={clsx("scroll-mt-20 px-5 py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

// ---------- top bar ----------

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 px-5 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/signin" className="rounded-2xl px-3 py-2 text-sm font-bold hover:bg-line/40">Sign in</Link>
          <Link to="/signup" className="btn-primary px-4 py-2 text-sm">Start free</Link>
        </div>
      </div>
    </header>
  );
}

// ---------- hero ----------

const DEMO_LINES = [
  { text: "Sold 3 bags of rice 45,000", chip: "💰 +₦45k", cls: "bg-brand-soft text-brand-dark", in: 45000, out: 0 },
  { text: "Bought 2 cartons of indomie", chip: "📦 −₦27.2k", cls: "bg-sky-soft text-sky", in: 0, out: 27200 },
  { text: "Transport 1,500", chip: "🚌 −₦1,500", cls: "bg-coral-soft text-coral", in: 0, out: 1500 },
  { text: "Joy pay 30k for rice", chip: "💵 +₦30k · ₦20k left", cls: "bg-brand-soft text-brand-dark", in: 30000, out: 0 },
  { text: "Emeka dey owe me 4k", chip: "📥 ₦4,000", cls: "bg-sun-soft text-amber-700", in: 0, out: 0 },
];

/** Types the day's lines one by one, then shows them all; shows everything at once for reduced motion. */
function useTypedDay() {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [line, setLine] = useState(reduce ? DEMO_LINES.length : 0);
  const [chars, setChars] = useState(0);
  useEffect(() => {
    if (reduce) return;
    if (line >= DEMO_LINES.length) {
      const t = window.setTimeout(() => { setLine(0); setChars(0); }, 4500);
      return () => window.clearTimeout(t);
    }
    const full = DEMO_LINES[line].text.length;
    const t = window.setTimeout(
      () => {
        if (chars < full) setChars(chars + 1);
        else { setLine(line + 1); setChars(0); }
      },
      chars < full ? 45 : 700,
    );
    return () => window.clearTimeout(t);
  }, [line, chars, reduce]);
  return { line, chars };
}

function Hero() {
  return (
    <section className="relative px-5 pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-gradient-to-b from-brand-soft/70 to-transparent" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.08] [text-wrap:balance] sm:text-6xl">
            Write it down.
            <br />
            <span className="text-brand">Flowz does the maths.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted sm:text-xl">
            Your daily notebook, in English or Pidgin, turned into profit, debts and statements. Automatically.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="btn-primary px-7 py-4 text-lg">Start free</Link>
            <button onClick={() => go("try")} className="btn-ghost border-2 border-line px-7 py-4 text-lg">Try it here</button>
          </div>
        </div>
        <Phone />
      </div>
    </section>
  );
}

function Phone() {
  const { line, chars } = useTypedDay();
  const shown = DEMO_LINES.slice(0, line);
  const totals = shown.reduce((t, l) => ({ in: t.in + l.in, out: t.out + l.out }), { in: 0, out: 0 });
  const typing = line < DEMO_LINES.length ? DEMO_LINES[line].text.slice(0, chars) : "";
  return (
    <div className="relative mx-auto w-full max-w-[360px]" aria-label="Example of a day in Flowz">
      <div className="absolute -right-4 -top-5 z-10 hidden rotate-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-card sm:block">
        <Sparkles className="mr-1 inline h-4 w-4 text-plum" /> “You kept ₦46,300 today”
      </div>
      <div className="absolute -bottom-6 -left-6 z-10 hidden -rotate-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-card sm:block">
        <HandCoins className="mr-1 inline h-4 w-4 text-amber-700" /> Joy still owes ₦20,000
      </div>
      <div className="rounded-[2.6rem] border-[10px] border-ink bg-paper p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between px-2 pt-1">
          <span className="font-hand text-3xl font-bold">Today</span>
          <span className="rounded-full bg-sky-soft px-2.5 py-1 text-xs font-bold text-sky"><Package className="mr-1 inline h-3 w-3" />Inventory</span>
        </div>
        <div className="mb-3 grid grid-cols-3 rounded-2xl bg-white p-3 text-center text-xs shadow-card">
          <div><div className="text-muted">Money in</div><div className="text-base font-extrabold text-brand-dark">{formatMoney(totals.in, "NGN", { compact: true })}</div></div>
          <div className="border-x border-line"><div className="text-muted">Money out</div><div className="text-base font-extrabold text-coral">{formatMoney(totals.out, "NGN", { compact: true })}</div></div>
          <div><div className="text-muted">Left</div><div className="text-base font-extrabold">{formatMoney(totals.in - totals.out, "NGN", { compact: true })}</div></div>
        </div>
        <ul className="ruled min-h-[300px] overflow-hidden rounded-2xl bg-white px-3 shadow-card">
          {shown.map((l) => (
            <li key={l.text} className="flex h-12 items-center justify-between gap-2">
              <span className="truncate font-hand text-[19px]">{l.text}</span>
              <span className={clsx("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold", l.cls)}>{l.chip}</span>
            </li>
          ))}
          {line < DEMO_LINES.length && (
            <li className="flex h-12 items-center justify-between gap-2">
              <span className="font-hand text-[19px]">{typing}<span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-ink align-middle" /></span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand-dark"><Mic className="h-4 w-4" /></span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ---------- problems and what Flowz does about them ----------

const SOLVES = [
  { icon: Wallet, problem: "Money disappears", fix: "See what came in, what went out and what you kept. Every day." },
  { icon: HandCoins, problem: "Debts get forgotten", fix: "Write “Joy took rice on credit”. Flowz tracks what she still owes." },
  { icon: Package, problem: "Stock runs out unnoticed", fix: "Sell and buy as usual. Flowz counts your stock and warns when it's low." },
  { icon: FileSpreadsheet, problem: "No records for a loan", fix: "One tap turns your notebook into a Profit & Loss and Balance Sheet." },
];

function Solves() {
  return (
    <Section className="bg-white">
      <h2 className="text-3xl font-extrabold sm:text-4xl">Your notebook can't add up. Flowz can.</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SOLVES.map((s) => (
          <div key={s.problem} className="flex gap-4 rounded-3xl border border-line bg-paper p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-dark"><s.icon className="h-6 w-6" /></span>
            <div>
              <p className="font-hand text-2xl font-bold text-coral line-through decoration-2">{s.problem}</p>
              <p className="mt-1 text-lg font-bold">{s.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------- try it ----------

const TRY_EXAMPLES = ["Emeka dey owe me 4k", "Money enter 15k", "Fuel for gen 6,000"];

function TryIt() {
  const [text, setText] = useState("Sold 3 bags of rice 45k");
  const read = useMemo(() => parseLine(text, "NGN"), [text]);
  const info = KINDS[read.kind];
  const category = read.category ? CATEGORY_BY_ID[read.category] : null;
  const money = read.amount != null && read.currency ? formatMoney(read.amount, read.currency) : null;
  return (
    <Section id="try">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Type a line. Watch Flowz read it.</h2>
          <p className="mt-3 text-lg text-muted">English, Pidgin, “5k”. It just understands.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRY_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setText(ex)} className="rounded-full border-2 border-line bg-white px-3 py-1.5 text-sm font-bold text-muted hover:border-brand hover:text-brand-dark">
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <label htmlFor="try-line" className="text-sm font-bold text-muted">Write a line</label>
          <input
            id="try-line"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="ruled mt-2 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 font-hand text-3xl outline-none focus:border-brand"
            placeholder="e.g. Sold 3 bags of rice 45k"
            autoComplete="off"
          />
          <div className="mt-5 rounded-2xl bg-paper p-4" aria-live="polite">
            {money ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="col-span-2">
                  <dt className="text-muted">Flowz reads it as</dt>
                  <dd className="mt-1">
                    <span className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-base font-extrabold", info.chip)}>
                      {info.emoji} {kindLabel(read.kind, "business")}
                    </span>
                  </dd>
                </div>
                <div><dt className="text-muted">Amount</dt><dd className="text-xl font-extrabold">{money}</dd></div>
                <div>
                  <dt className="text-muted">{info.flow === "debt" ? "Debt book" : "Money"}</dt>
                  <dd className="text-xl font-extrabold">{info.flow === "in" ? "Coming in" : info.flow === "out" ? "Going out" : info.flow === "debt" ? "Recorded" : "—"}</dd>
                </div>
                {category && <div><dt className="text-muted">Spent on</dt><dd className="font-extrabold">{category.emoji} {category.label}</dd></div>}
                {read.person && <div><dt className="text-muted">Person</dt><dd className="font-extrabold">{read.person}</dd></div>}
              </dl>
            ) : (
              <p className="text-muted">{text.trim() ? "No money in this line yet — Flowz keeps it as a note. Add an amount like “5k” or “₦5,000”." : "Type something to see it read."}</p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ---------- final call to action ----------

function FinalCta() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-[2rem] bg-brand px-8 py-14 text-center text-white sm:px-16">
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight [text-wrap:balance] sm:text-5xl">Know where your money goes.</h2>
        <p className="mt-3 text-lg text-white/85">Free to start. Works on any phone.</p>
        <Link to="/signup" className="btn mt-8 bg-white px-8 py-4 text-lg text-brand-dark hover:bg-paper">Start free</Link>
      </div>
    </Section>
  );
}

// ---------- footer ----------

function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-1 text-sm font-bold text-muted">Your interactive accounts notebook</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-muted" aria-label="Footer">
          <Link to="/privacy" className="hover:text-ink">Privacy policy</Link>
          <Link to="/delete-account" className="hover:text-ink">Delete account</Link>
          <span>hello@flowz.ng</span>
        </nav>
        <p className="text-sm text-muted">© {new Date().getFullYear()} Flowz. Made in Nigeria.</p>
      </div>
    </footer>
  );
}
