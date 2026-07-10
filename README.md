# 🐷 PiggyBank

A personal finance tracker for logging transactions, managing recurring expenses, and staying on top of a monthly budget.

**Live:** [piggy-bank-taupe-xi.vercel.app](https://piggy-bank-taupe-xi.vercel.app/)

---

## Features

- **Transactions** — log one-off income and expenses with categories, notes, and dates
- **Recurring** — schedule repeating items by day-of-month; auto-rolls forward each month, pausable per item
- **SMS ingestion** — forward bank SMS via an iOS Shortcut; regex parse rules turn them into transactions, with a pending queue for review
- **AI regex assistant** — Claude generates parse rules from a sample SMS (requires `ANTHROPIC_API_KEY`)
- **AI insights** — Claude analyzes your month on the dashboard: what's going well, what isn't, and what to do about it
- **Analytics dashboard** — cashflow, category donut, 6-month trends, budget pace, weekday pattern, top merchants, streaks, and per-category budget caps
- **Auth** — Clerk-backed sign-in / sign-up with protected routes via middleware
- **Multi-currency** — pick your preferred currency from the settings

## Tech Stack

| Layer    | Tool                          |
| -------- | ----------------------------- |
| Framework | Next.js 16 (App Router) + React 19 |
| Styling  | Tailwind CSS 4                |
| Auth     | Clerk                         |
| Database | PostgreSQL via Prisma 6       |
| Language | TypeScript                    |
| Hosting  | Vercel                        |

## Getting Started

Clone and install:

```bash
git clone https://github.com/LaithAbusada/PiggyBank.git
cd PiggyBank
npm install
```

Create a `.env.local` with:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
# Optional — enables the AI regex assistant and AI insights
ANTHROPIC_API_KEY="sk-ant-..."
```

Push the schema and start dev:

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  api/              # transactions, recurring, user routes
  dashboard/        # calculator, calendar, files, invoicing, settings, support
  login/ signup/    # Clerk auth pages
  page.tsx          # landing
components/
  landing/          # marketing sections
  dashboard/        # sidebar, widgets
prisma/
  schema.prisma     # User, Transaction, Recurring
lib/                # shared helpers
middleware.ts       # route protection
```

## Scripts

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server                 |
| `npm run build` | Production build                     |
| `npm start`     | Run the production build             |
| `npm run lint`  | Lint with ESLint                     |

## Deployment

Auto-deployed to Vercel on push to `main` → [piggy-bank-taupe-xi.vercel.app](https://piggy-bank-taupe-xi.vercel.app/)
