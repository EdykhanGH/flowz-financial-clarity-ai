# Flowz — Your interactive accounts notebook

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
| **Statements** | Profit & Loss (or Income & Spending) for any period and a Balance Sheet at any date, built from your notebook, with a plain check of whether the data is complete enough. Ask Flowz opens them too ("prepare a profit and loss for September"). Copy as text or print / save as PDF. |
| **Owed** | A debt book: each person's balance (owed minus paid back), with history and a **Record payment** button. Built automatically from your pages. |
| **Inventory** | Opened from the small **Inventory** button on the notebook page. Add goods with the unit they're sold in (pack, bottle, bag), what they come in (carton of 40), buying and selling prices per unit and per carton, stock now and a low-stock warning. Lines like *"Sold 3 indomie"*, *"Bought 2 cartons of indomie"* or *"Joy took 1 bag of rice on credit"* get their money from the prices (a written amount wins) and move the stock; each line shows what's left. |
| **Bank Match** | Upload a bank statement (PDF, Excel, CSV or screenshots). Flowz matches it with the notebook and lists what's in the bank but not in the notebook, with one-tap **Add**, **Written** (link to a line) and **Not business** (optionally "always ignore transfers to MUM"). Bank charges can be added as one line. Notebook lines with no bank transaction are fine — they may be cash. Statements show how much was bank-checked. |

How a line is understood lives in `src/lib/parse.ts` and `src/lib/language.ts` (runs on the phone — instant, free, no internet needed).
It understands British and American English, Nigerian Pidgin, short forms and common typos:
`got 10k`, `money enter 15k`, `credit alert 40k`, `takings 46,500`, `Emeka dey owe me 4k`, `Tunde borrow me 5k`,
`dash my pikin 2k`, `recieved 5000`, `trasport 1500`, `gas $40`, `groceries 60 bucks`.
Amounts: `45,000`, `₦45k`, `N4500`, `#4,500`, `1.5m`, `$250`, `15 dollars`, `two thousand five hundred naira`,
`3 shirts at 5000 each`, `4 x 2500`.

**Reading in context**: Flowz keeps a debt book while you write. "Joy bought 50k rice on credit" means Joy owes you;
"Joy paid back 30k" (or just "Joy paid 30k", since Joy owes you) is a repayment that leaves ₦20k. Lines the phone finds
unclear are also read by AI (`read-lines` function) with the debt book as context; offline, the phone's reading is kept.

**Bank Match**: Excel and CSV statements are read on the phone (`src/lib/bankStatement.ts`). PDFs are split into
4-page parts and photos are shrunk, then read by AI (`read-statement` function). Matching (`src/lib/bankMatch.ts`) pairs each bank
transaction with a line of the same amount and direction within 3 days, lets several transfers sit inside a daily total
("Sales today 52,000"), and never matches lines that say "cash". Uploading the same statement twice doesn't double count.

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
They only create new tables (`user_settings`, `entries`, `budget_limits`, `monthly_summaries`, `push_subscriptions`, `ai_usage`,
`bank_statements`, `bank_transactions`, `bank_rules`, `inventory_items`) and add columns to `entries`; they don't remove anything.

### 2. Auth
In **Authentication → URL Configuration**, set the Site URL to where the app is hosted and add
`<your-site>/setup` and `<your-site>/settings` to the redirect URLs (used by the confirmation and password-reset emails).

### 3. Smart summary (AI)
```sh
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy monthly-summary
supabase functions deploy ask-flowz
supabase functions deploy read-lines
supabase functions deploy read-statement
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
