# PalmPay Insights

**An AI money coach inside PalmPay.** It reads your transaction history and tells you what's happening, what's unusual, and what to do next, in plain English or Pidgin.

## What it does

| Feature | Example |
| --- | --- |
| **Smart insight cards** | "Betting is up 14.6× this month", "3 subscriptions cost you ₦23,600 a month", "₦4,100 lost to POS fees" |
| **Fraud / unusual activity** | "Unusual: ₦80,000 to a new account at 2:01am. Wasn't you? Freeze your account" |
| **Run-out forecast** | "At this pace you'll run out around 21 Oct, 5 days before payday" |
| **Money health score** | 0–100, built from spending vs income, savings, betting, fees and cash cushion |
| **AI money coach** | A short, personal note with 3 actions, written by Claude from your numbers |
| **Ask PalmPay** | Chat: "How much did I spend on betting since August?" Claude calls tools that do the maths in code, so answers are exact |
| **Statement upload** | Drop in a PalmPay / bank statement (Excel or CSV) and get insights on real data |
| **Category & trend charts** | This month vs your usual by the same day; month-by-month in vs out |

Every action links back to a PalmPay product (CashBox savings, QR pay, spending limits, account freeze).

## How it works

```
Transactions → categorise (rules) → facts computed in code → insight cards (rules)
                                                    └→ Claude writes the coach note / answers questions using tools
```

- `src/lib/categorise.ts`: maps narrations ("SportyBet wallet funding", "IKEDC prepaid", "POS withdrawal") to categories
- `src/lib/analyse.ts`: the fact engine (spikes vs usual, recurring payments, fees, burn rate and run-out date, unusual transfers, health score) plus the insight cards
- `src/lib/tools.ts`: the tools Claude uses to answer questions (`sum_transactions`, `list_transactions`, `breakdown`)
- `src/lib/statement.ts`: Excel/CSV statement import with loose column matching
- `src/lib/seed.ts`: three realistic demo personas (salary earner, market trader, student)
- `api/insights.ts`, `api/ask.ts`: Vercel serverless functions that call Claude

The AI never does arithmetic. It only words numbers the code already worked out, so nothing is made up.
If the AI can't be reached, the app still works: cards are rule-based and the chat has an offline fallback.

## Run it

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npm run dev
```

## Deploy (Vercel)

Import the repo in Vercel (framework: Vite), add the `ANTHROPIC_API_KEY` environment variable, then deploy.

## In production

The fact engine runs over PalmPay's internal transaction service instead of uploads and pushes proactive
notifications ("You've spent 80% of your usual food budget and it's the 18th").
