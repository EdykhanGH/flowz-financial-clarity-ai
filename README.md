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
| **Summary** | Monthly totals, comparison with last month, where money went, budgets, and an AI-written summary with a tip. |
| **Budgets** | Monthly spending limits per category with progress bars. |
| **Owed** | Everyone who owes you and everyone you owe, collected automatically from your pages. Tick them off when paid. |

How a line is understood lives in `src/lib/parse.ts` (runs on the phone — instant, free, no internet needed).
Examples it handles: `45,000`, `₦45k`, `N4500`, `1.5m`, `$250`, `15 dollars`, `3 shirts at 5000 each`, `4 x 2500`.

## Tech

- React + TypeScript + Vite + Tailwind CSS (mobile-first, installable as a web app)
- Supabase: email sign-up, Postgres with row-level security
- Supabase Edge Function `monthly-summary` calls Claude (`claude-opus-5-5`) to write the summary

## Setting up

### 1. Database
Run `supabase/migrations/20261018090000_flowz_v1.sql` against your Supabase project —
either paste it into **Supabase dashboard → SQL Editor** and run it, or `supabase db push`.
It only creates new tables (`user_settings`, `entries`, `budget_limits`, `monthly_summaries`); it does not touch old ones.

### 2. Auth
In **Authentication → URL Configuration**, set the Site URL to where the app is hosted and add
`<your-site>/setup` and `<your-site>/settings` to the redirect URLs (used by the confirmation and password-reset emails).

### 3. Smart summary (AI)
```sh
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy monthly-summary
```
Each user can refresh a month's summary up to 15 times; limits are in the function.

### 4. Run the app
```sh
cp .env.example .env   # fill in your Supabase URL and anon (public) key
npm install
npm run dev            # http://localhost:8080
```

Other commands: `npm test` (line-reading tests), `npm run build`, `npm run typecheck`.
