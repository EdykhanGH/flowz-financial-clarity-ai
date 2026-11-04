import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ErrorNote, Spinner } from "@/components/ui";
import { CONTACT_EMAIL, PublicPage } from "./Privacy";

/** Forget everything Flowz kept on this phone too (drafts, dismissed notes, statement inputs). */
function clearThisDevice() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("flowz:") || k.startsWith("flowz-")) localStorage.removeItem(k);
  } catch {
    // storage blocked: nothing to clear
  }
}

/** The "type DELETE" confirmation, used on this page and in Settings. */
export function DeleteAccountCard() {
  const navigate = useNavigate();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = typed.trim().toUpperCase() === "DELETE";

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount("DELETE");
      clearThisDevice();
      navigate("/delete-account?done=1", { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-3 border-2 border-coral-soft p-5">
      <h2 className="flex items-center gap-2 font-extrabold text-coral"><Trash2 className="h-5 w-5" /> Delete my account</h2>
      <p className="text-sm text-muted">
        This permanently deletes your Flowz account and everything in it: your notebook, debt book, budgets, inventory, bank
        statements, summaries and reminders. It can't be undone. Download any statements you want to keep first.
      </p>
      <label className="label" htmlFor="confirm-delete">Type DELETE to confirm</label>
      <input id="confirm-delete" className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder="DELETE" />
      {error && <ErrorNote>{error}</ErrorNote>}
      <button className="btn w-full bg-coral text-white hover:brightness-95" disabled={!ready || busy} onClick={remove}>
        {busy ? <Spinner /> : "Delete my account forever"}
      </button>
    </div>
  );
}

/** A page Google Play can link to: delete from here when signed in, or learn how. */
export default function DeleteAccount() {
  const { session, loading } = useAuth();
  const [params] = useSearchParams();

  if (params.get("done")) {
    return (
      <PublicPage title="Your account has been deleted">
        <p className="leading-relaxed">
          Your Flowz account and all its records have been removed. Thank you for using Flowz. You're welcome back any time.
        </p>
        <Link to="/" className="btn-primary">Back to Flowz</Link>
      </PublicPage>
    );
  }

  return (
    <PublicPage title="Delete your Flowz account">
      <p className="leading-relaxed">
        You can delete your Flowz account and all the data in it at any time. Deleting removes your account, notebook, debt book,
        budgets, inventory, uploaded bank statements, summaries and reminders. Copies in our providers' backups are removed when those
        backups expire, usually within a few days.
      </p>
      {loading ? (
        <div className="grid h-24 place-items-center text-brand"><Spinner /></div>
      ) : session ? (
        <DeleteAccountCard />
      ) : (
        <div className="card space-y-3 p-5">
          <h2 className="font-extrabold">How to delete it</h2>
          <ol className="ml-5 list-decimal space-y-1.5">
            <li><Link to="/signin" className="font-bold text-brand underline">Sign in</Link> to Flowz.</li>
            <li>Open <b>Settings</b> (the gear at the top), scroll down to <b>Delete my account</b>, type DELETE and confirm.</li>
          </ol>
          <p className="text-sm text-muted">
            Can't sign in? Email <b className="select-all">{CONTACT_EMAIL}</b> from the email address on your account with the subject
            "Delete my Flowz account". We'll delete it within 7 days and reply to confirm.
          </p>
        </div>
      )}
      <p className="text-sm text-muted">
        See our <Link to="/privacy" className="font-bold text-brand underline">privacy policy</Link> for what Flowz keeps and why.
      </p>
    </PublicPage>
  );
}
