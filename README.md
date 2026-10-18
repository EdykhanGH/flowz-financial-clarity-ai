# Flowz — your money notebook

Flowz digitises the paper notebook people use to jot down the day's money.
You write lines in plain words — *"Sold 3 bags of rice 45,000"*, *"Gave mum 10k"*,
*"Chioma owes me 5,000"* — and Flowz works out what each line is, adds everything up,
and writes a plain-English summary of your month.

Built to be simple enough for anyone, business owner or not.

## What's inside

| Screen | What it does |
| --- | --- |
| **Today** | An open notebook page for the day. Each line is read as you type and gets a coloured tag (sale, purchase, expense, gift, owes me, I owe). Money in / out / left is totalled live, in ₦ and $ separately. Tap a tag to correct it. |
| **Notebook** | Every past page, by month, with search. |
| **Summary** | Monthly totals, comparison with last month, where money went, budgets, an AI-written summary with a tip, and **Ask Flowz**: a chat where users ask questions about their own notebook. |
| **Budgets** | Monthly spending limits per category with progress bars. |
| **Owed** | Everyone who owes you and everyone you owe, collected automatically from your pages. Tick them off when paid. |

How a line is understood lives in `src/lib/parse.ts` and `src/lib/language.ts` (runs on the phone — instant, free, no internet needed).
It understands British and American English, Nigerian Pidgin, short forms and common typos:
`got 10k`, `money enter 15k`, `credit alert 40k`, `takings 46,500`, `Emeka dey owe me 4k`, `Tunde borrow me 5k`,
`dash my pikin 2k`, `recieved 5000`, `trasport 1500`, `gas $40`, `groceries 60 bucks`.
Amounts: `45,000`, `₦45k`, `N4500`, `#4,500`, `1.5m`, `$250`, `15 dollars`, `two thousand five hundred naira`,
`3 shirts at 5000 each`, `4 x 2500`.

**Daily reminder**: at a time the user picks (default 8pm), on days they haven't written anything,
Flowz sends a phone notification and shows a banner inside the app.

## Tech

- React + TypeScript + Vite + Tailwind CSS (mobile-first, installable as a web app)
- Supabase: email sign-up, Postgres with row-level security
- Supabase Edge Function `monthly-summary` calls Claude (`claude-opus-5-5`) to write the summary
- Supabase Edge Function `ask-flowz` answers questions. Claude calls tools that do all the maths in code on the
  user's own rows, so the numbers in answers are exact. Limited to 40 questions per user per day.

## Setting up

### 1. Database
Run the files in `supabase/migrations/` (in order) against your Supabase project —
either paste each one into **Supabase dashboard → SQL Editor** and run it, or `supabase db push`.
They only create new tables (`user_settings`, `entries`, `budget_limits`, `monthly_summaries`, `push_subscriptions`); they don't touch old ones.

### 2. Auth
In **Authentication → URL Configuration**, set the Site URL to where the app is hosted and add
`<your-site>/setup` and `<your-site>/settings` to the redirect URLs (used by the confirmation and password-reset emails).

### 3. Smart summary (AI)
```sh
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy monthly-summary
supabase functions deploy ask-flowz
```
Each user can refresh a month's summary up to 15 times; limits are in the function.

### 4. Daily reminder notifications
```sh
npx web-push generate-vapid-keys            # once
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com CRON_SECRET=<long random string>
supabase functions deploy send-reminders
```
Put the same public key in `.env` as `VITE_VAPID_PUBLIC_KEY`. Turn on the `pg_cron` and `pg_net` extensions,
then run `supabase/cron/reminders.sql` (with your project ref and CRON_SECRET filled in) in the SQL Editor.
On iPhone, notifications work after the user adds Flowz to their home screen.

### 5. Run the app
```sh
cp .env.example .env   # fill in your Supabase URL and anon (public) key
npm install
npm run dev            # http://localhost:8080
```

Other commands: `npm test` (line-reading tests), `npm run build`, `npm run typecheck`.
