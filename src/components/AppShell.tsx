import { NavLink, Outlet, Link } from "react-router-dom";
import { BookOpen, PenLine, PieChart, Target, Users, Settings } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./ui";
import { ReminderBanner } from "./Reminders";
import { useAuth } from "@/hooks/useAuth";

const DEMO = import.meta.env.MODE === "demo";

const tabs = [
  { to: "/today", label: "Today", icon: PenLine },
  { to: "/notebook", label: "Notebook", icon: BookOpen },
  { to: "/month", label: "Summary", icon: PieChart },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/owed", label: "Owed", icon: Users },
];

export default function AppShell() {
  const { signOut } = useAuth();
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="no-print sticky top-0 z-30 flex items-center justify-between bg-paper/90 px-4 py-3 backdrop-blur">
        <Link to="/today" aria-label="Flowz home">
          <Logo />
        </Link>
        <NavLink to="/settings" className="rounded-full p-2 text-muted hover:bg-line/50" aria-label="Settings">
          <Settings className="h-6 w-6" />
        </NavLink>
      </header>

      {DEMO && (
        <div className="no-print mx-4 mb-2 flex items-center justify-between gap-3 rounded-2xl bg-sun-soft px-4 py-2 text-xs font-bold text-amber-800">
          <span>Demo: the earlier days are sample data, saved only in this browser.</span>
          <button onClick={signOut} className="shrink-0 underline">Start over</button>
        </div>
      )}

      <ReminderBanner />

      <main className="flex-1 px-4 pb-28">
        <Outlet />
      </main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-safe backdrop-blur">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-0.5 pt-2 text-xs font-bold transition",
                    isActive ? "text-brand" : "text-muted hover:text-ink",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={clsx("rounded-full px-4 py-1", isActive && "bg-brand-soft")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
