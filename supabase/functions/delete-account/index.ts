// Deletes the signed-in user's account and everything they saved in Flowz.
// Every table that holds a user's data is linked to their login with "on delete cascade",
// so removing the login removes their notebook, debts, budgets, inventory, bank statements,
// summaries, reminders and AI usage counts with it.
//
// Needs no extra secrets: it uses the project's own service role, which only this function sees.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return reply(401, { error: "Please sign in again." });

  // The app sends this only after the person typed DELETE, so a stray call can't remove an account.
  try {
    const body = JSON.parse(await req.text());
    if (body?.confirm !== "DELETE") return reply(400, { error: "Type DELETE to confirm." });
  } catch {
    return reply(400, { error: "Bad request." });
  }

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    console.error("delete-account failed", error);
    return reply(500, { error: "We couldn't delete your account right now. Please try again, or email hello@flowz.ng." });
  }
  return reply(200, { deleted: true });
});
