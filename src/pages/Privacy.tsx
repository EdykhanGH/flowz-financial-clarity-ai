import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { FEATURES } from "@/lib/features";

export const CONTACT_EMAIL = "hello@flowz.ng";
const UPDATED = "4 November 2026";

/** A plain page for people who may not be signed in: privacy policy, account deletion. */
export function PublicPage({ title, children }: { title: string; children: ReactNode }) {
  const { session } = useAuth();
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link to={session ? "/today" : "/"} aria-label="Flowz home"><Logo /></Link>
        <Link to={session ? "/settings" : "/"} className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {session ? "Back to settings" : "Back"}
        </Link>
      </div>
      <h1 className="mt-8 text-3xl font-extrabold">{title}</h1>
      <div className="mt-6 space-y-6 pb-16">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <div className="space-y-2 leading-relaxed text-ink/90 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <PublicPage title="Privacy policy">
      <p className="text-sm font-bold text-muted">Last updated {UPDATED}</p>
      <p className="leading-relaxed">
        Flowz is a money notebook. You write what you sell, buy and spend, and Flowz adds it up. Your records are personal and
        often private business information, so this page explains, in plain words, what Flowz keeps, why, who helps us run it,
        and what you can do about it.
      </p>

      <Section title="What Flowz keeps">
        <ul>
          <li><b>Your account:</b> your email address and password. The password is stored scrambled (hashed), so nobody can read it, including us.</li>
          <li><b>Your settings:</b> your name, business name, whether you use Flowz for business or personal money, your main currency, time zone and reminder time.</li>
          <li><b>Your notebook:</b> every line you write or speak, and what Flowz reads from it: amounts, sales and spending, names of people who owe you or whom you owe, budgets, inventory items and stock.</li>
          {FEATURES.bankMatch && <li><b>Bank statements you upload for Bank Match:</b> the transactions on them (date, amount, description, balance) and the file's name. Flowz keeps the transactions, not the file itself.</li>}
          <li><b>Notifications:</b> if you turn on reminders, a token from your phone's browser so we can send them.</li>
          <li><b>Usage counts:</b> how many AI questions and readings you used each day, so daily limits work.</li>
          <li><b>Error reports:</b> if something breaks in the app, a technical report (which screen, what failed, your browser and an anonymous account id). It never includes what you wrote, amounts or names.</li>
        </ul>
      </Section>

      <Section title="What Flowz does not do">
        <ul>
          <li>We don't sell your data, and we don't show you ads.</li>
          <li>Flowz can't see your bank account or move money. It only reads the statements you choose to upload.</li>
          <li>We don't share your records with lenders or anyone else. If we ever offer that, it will only happen when you ask for it.</li>
        </ul>
      </Section>

      <Section title="How your information is used">
        <ul>
          <li>To show your notebook, totals, debt book, budgets, inventory and statements{FEATURES.bankMatch ? " and Bank Match" : ""}.</li>
          <li>To send you sign-up, password and reminder messages.</li>
          <li>For AI features (the monthly summary, Ask Flowz, reading unclear lines and reading PDF or photo statements): only the text or file needed for that request is sent to our AI provider.</li>
          <li>To keep Flowz working and safe, for example fixing errors and stopping abuse.</li>
        </ul>
      </Section>

      <Section title="Who helps us run Flowz">
        <p>These companies process data for us, only to provide their service:</p>
        <ul>
          <li><b>Supabase:</b> stores your account and records, and runs Flowz's server functions.</li>
          <li><b>Vercel:</b> serves the Flowz app to your phone or computer.</li>
          <li><b>Anthropic (Claude):</b> the AI behind summaries, Ask Flowz and statement reading. Under Anthropic's commercial terms, data sent through its API isn't used to train its models.</li>
          <li><b>Resend:</b> sends sign-up and password emails.</li>
          <li><b>Sentry:</b> receives error reports so we can fix problems (stored in the European Union).</li>
          <li><b>Zoho:</b> our support inbox, if you email us.</li>
          <li><b>Your phone's browser company</b> (for example Google for Chrome, Apple for Safari): delivers reminder notifications and, if you use the microphone, turns your speech into text. Flowz receives only the text, not the recording.</li>
        </ul>
        <p>Some of these companies store or process data outside Nigeria, for example in the United States or Europe. We choose providers that protect data with strong security.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your information while you have a Flowz account. When you delete your account, your account and records are removed
          from our database straight away. Copies in our providers' backups are removed when those backups expire, usually within a few days.
          {FEATURES.bankMatch && " You can also delete a single uploaded bank statement at any time in Bank Match."}
        </p>
      </Section>

      <Section title="Keeping it safe">
        <ul>
          <li>Everything travels over encrypted connections (HTTPS).</li>
          <li>Each person can only ever see their own records; this is enforced in the database itself.</li>
          <li>Keys for our AI and email services are kept on our servers, never in the app.</li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>Under Nigeria's Data Protection Act 2023 you can:</p>
        <ul>
          <li><b>See</b> what we hold about you, and <b>correct</b> it (most of it you can edit in the app yourself).</li>
          <li><b>Take a copy:</b> download your statements as PDF or Excel in the app, or email us for a full copy of your data.</li>
          <li><b>Delete</b> your account and all its data: <Link to="/delete-account" className="font-bold text-brand underline">delete my account</Link>.</li>
          <li><b>Object</b> to how we use your data, or withdraw consent, for example by turning off reminders.</li>
          <li><b>Complain</b> to the Nigeria Data Protection Commission (NDPC) if you're unhappy with how we handle your data.</li>
        </ul>
      </Section>

      <Section title="Who can use Flowz">
        <p>Flowz is for people aged 18 and over.</p>
      </Section>

      <Section title="Changes">
        <p>If we change this policy, we'll update the date at the top, and tell you in the app if the change is important.</p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions, requests or complaints: email <b className="select-all">{CONTACT_EMAIL}</b>. We aim to reply within a few working days.
        </p>
      </Section>
    </PublicPage>
  );
}
