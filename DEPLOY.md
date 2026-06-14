# Deploying PaperTrade to Vercel

This app is a standard Next.js project and deploys cleanly to Vercel's free tier.
Below is everything needed to go live.

## Prerequisites

- The GitHub repo is pushed (it is: `Dark10701/Trading-stocks`).
- Your Supabase project exists and the SQL migrations have been run (see below).
- API keys for Polygon.io and Finnhub (you already have these). Anthropic is optional.

## 1. Make sure the database is migrated

Run these SQL files in the Supabase SQL editor, in order, if you haven't already:

1. `database.sql` — core tables (portfolio, positions, trades)
2. `database-rls-fix.sql` — initial RLS policies + starting balance
3. `database-v2.sql` — portfolio_snapshots table (powers the value chart)
4. `database-v3.sql` — per-user ownership + auth RLS (multi-user)

**Authentication (Google sign-in) is required.** Follow `AUTH-SETUP.md` to create
Google OAuth credentials and enable the Google provider in Supabase before the app
is usable. Add your Vercel domain to the Google origins and Supabase URL config.

## 2. Import the project into Vercel

1. Go to https://vercel.com → **Add New… → Project**.
2. Import the `Dark10701/Trading-stocks` GitHub repo.
3. Framework preset: **Next.js** (auto-detected). Leave build settings default.
4. Do **not** deploy yet — add the environment variables first (next step).

## 3. Set environment variables

In the Vercel project, under **Settings → Environment Variables**, add each of these
(values come from your local `.env.local`; see `.env.example` for the full list):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase REST URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon/public key |
| `POLYGON_API_KEY` | yes | Stock data |
| `FINNHUB_API_KEY` | yes | Company news |
| `ANTHROPIC_API_KEY` | optional | Enables the AI trade debrief |
| `NEXT_PUBLIC_APP_URL` | optional | Only needed with a custom domain; otherwise Vercel's URL is auto-detected |

Add them to **Production** (and Preview if you want preview deploys to work).

## 4. Deploy

Click **Deploy**. Vercel builds and publishes the app at `https://<project>.vercel.app`.
Every push to `main` will auto-deploy from then on.

## 5. After deploy

- Open the URL on your phone and use the browser's **Add to Home Screen** to install
  it as a PWA (full-screen, app icon, no browser chrome).
- If you set `ANTHROPIC_API_KEY`, sells will generate an AI debrief on the History page.

## Notes / caveats

- **Single shared portfolio, no login.** Anyone with the URL reads and writes the same
  portfolio. That's fine for a personal tool; add authentication before sharing publicly.
- **Free-tier stock data** is previous-day closing prices, so values update once per
  trading day rather than in real time.
