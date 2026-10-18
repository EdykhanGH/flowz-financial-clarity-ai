import { Link } from "react-router-dom";
import { BookOpen, Calculator, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui";

const sample = [
  { text: "Sold 3 bags of rice 45,000", tag: "💰 Sale", cls: "bg-brand-soft text-brand-dark" },
  { text: "Bought fuel 8,500", tag: "⛽ Expense", cls: "bg-coral-soft text-coral" },
  { text: "Gave mum 10k", tag: "🤝 Gift", cls: "bg-plum-soft text-plum" },
  { text: "Chioma owes me 5,000", tag: "📥 Owes me", cls: "bg-sun-soft text-amber-700" },
];

export default function Welcome() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      <Logo />
      <section className="mt-10">
        <h1 className="text-4xl font-extrabold leading-tight">
          Write it down.
          <br />
          <span className="text-brand">Flowz does the maths.</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Your money notebook. Jot what you sold, bought, spent or gave, just like on paper. Flowz adds it up and tells you how your month is going.
        </p>
      </section>

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="font-hand text-2xl font-bold">Today</span>
          <span className="text-xs font-bold text-muted">your page</span>
        </div>
        <ul className="ruled px-5">
          {sample.map((s) => (
            <li key={s.text} className="flex h-12 items-center justify-between gap-2">
              <span className="font-hand text-xl">{s.text}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.tag}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-3 gap-2 bg-brand-soft/60 px-5 py-3 text-center text-sm">
          <div><div className="text-muted">In</div><div className="font-extrabold text-brand-dark">₦45,000</div></div>
          <div><div className="text-muted">Out</div><div className="font-extrabold text-coral">₦18,500</div></div>
          <div><div className="text-muted">Kept</div><div className="font-extrabold">₦26,500</div></div>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {[
          { icon: BookOpen, title: "An open page every day", body: "No forms. Just write the way you already do." },
          { icon: Calculator, title: "Totals that add up themselves", body: "Money in, money out and what's left — in naira or dollars." },
          { icon: Sparkles, title: "A smart monthly summary", body: "Plain words that tell you what happened and what to do next." },
        ].map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun-soft text-amber-700">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-extrabold">{title}</div>
              <div className="text-muted">{body}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 pt-10">
        <Link to="/signup" className="btn-primary w-full text-lg">Start my notebook — it's free</Link>
        <Link to="/signin" className="btn-ghost w-full">I already have an account</Link>
      </div>
    </div>
  );
}
