# Authentication Setup (Google Sign-In)

The app now requires signing in with Google. The code is done; you need to do three
one-time setup steps in your dashboards. Takes ~10 minutes.

Your Supabase project ref is `biwckknxnqjspxgvkqwk`, so your auth callback URL is:

```
https://biwckknxnqjspxgvkqwk.supabase.co/auth/v1/callback
```

---

## Step 1 — Run the database migration

In the Supabase SQL editor (https://supabase.com/dashboard/project/biwckknxnqjspxgvkqwk/sql/new),
paste and run **`database-v3.sql`**. This adds per-user ownership to every table and
locks data down so each user only sees their own portfolio.

> ⚠️ This deletes the old shared test portfolio. Each user starts fresh with $10,000.

---

## Step 2 — Create Google OAuth credentials

1. Go to https://console.cloud.google.com and create (or pick) a project.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - Fill in app name (e.g. "PaperTrade"), your support email, and developer email. Save.
   - Under **Audience / Test users**, add your own Google email as a test user
     (so you can sign in while the app is unverified).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: add `http://localhost:3000`
     (and later your Vercel URL, e.g. `https://your-app.vercel.app`).
   - **Authorized redirect URIs**: add
     `https://biwckknxnqjspxgvkqwk.supabase.co/auth/v1/callback`
   - Create, then copy the **Client ID** and **Client secret**.

---

## Step 3 — Enable Google in Supabase

1. Supabase dashboard → **Authentication → Sign In / Providers → Google**:
   - Toggle **Enable**.
   - Paste the **Client ID** and **Client secret** from Step 2. Save.
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (change to your Vercel URL in production).
   - **Redirect URLs**: add `http://localhost:3000/**`
     (and `https://your-app.vercel.app/**` once deployed).
3. (Optional) **Authentication → Sign In / Providers → Email**: since you chose
   instant signup, you don't need email confirmation — Google accounts are
   pre-verified, so there's nothing to toggle here for Google.

---

## Step 4 — Try it

```
npm run dev
```

Open http://localhost:3000 → you'll be redirected to **/login** → click
**Continue with Google** → after consent you land on the dashboard with your own
fresh $10,000 portfolio.

---

## Production notes (Vercel)

When you deploy, repeat the URL additions with your real domain:

- Google Cloud → add `https://your-app.vercel.app` to **JavaScript origins**
  (the redirect URI stays the Supabase callback — unchanged).
- Supabase → **URL Configuration** → set Site URL and add
  `https://your-app.vercel.app/**` to Redirect URLs.
- Make sure `NEXT_PUBLIC_SUPABASE_URL` in Vercel is the **base** project URL
  (`https://biwckknxnqjspxgvkqwk.supabase.co`, no `/rest/v1/` suffix).
