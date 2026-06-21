# 🚀 Swadesh AI — Render Deployment Guide

## Prerequisites

- A [GitHub](https://github.com) account (free)
- A [Render](https://render.com) account (free tier available)
- A [Neon](https://neon.tech) or [Supabase](https://supabase.io) PostgreSQL database (free tier)
- A [Google AI Studio](https://aistudio.google.com) Gemini API key (free)
- *(Optional)* A [Google Cloud Console](https://console.cloud.google.com) project for OAuth login

---

## Step 1 — Push Code to GitHub

> **⚠️ Make sure `.env` is listed in `.gitignore` before pushing! It already is.**

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all files
git add .

# 3. Commit
git commit -m "feat: Swadesh AI v2.0 — initial deploy"

# 4. Create a new repo on GitHub, then push:
git remote add origin https://github.com/YOUR_USERNAME/swadesh-ai.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Free PostgreSQL Database (Neon)

1. Go to **[neon.tech](https://neon.tech)** → Sign up → **Create Project**
2. Choose region: **Asia Pacific (Singapore)** — closest to India
3. After creation, copy the **Connection String** that looks like:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Save it — this is your `DATABASE_URL`

> **Alternative:** Use [Supabase](https://supabase.io) → New Project → Settings → Database → Connection String (use the "URI" format)

---

## Step 3 — Get Your Gemini API Key

1. Go to **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Click **Create API Key**
3. Copy the key — this is your `GEMINI_API_KEY`

---

## Step 4 — Deploy to Render

### 4a. Create Web Service

1. Go to **[render.com](https://render.com)** → **New → Web Service**
2. Connect your **GitHub** account and select the `swadesh-ai` repository
3. Configure the service:

| Field | Value |
|-------|-------|
| **Name** | `swadesh-ai` |
| **Region** | Singapore (closest to India) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Starter for always-on) |

### 4b. Set Environment Variables

In Render dashboard → **Environment** tab, add:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `10000` | ✅ |
| `GEMINI_API_KEY` | *your key from Step 3* | ✅ |
| `DATABASE_URL` | *your Neon/Supabase URL from Step 2* | ✅ |
| `SESSION_SECRET` | *any long random string, e.g. 64 random chars* | ✅ |
| `GOOGLE_CLIENT_ID` | *from Google Console* | Optional |
| `GOOGLE_CLIENT_SECRET` | *from Google Console* | Optional |
| `BASE_URL` | `https://swadesh-ai.onrender.com` | Optional (for OAuth) |

> **Generate SESSION_SECRET:** Use `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` or any password generator

### 4c. Set Health Check Path

In Render → **Health & Alerts** tab:
- Health Check Path: `/api/health`

### 4d. Deploy!

Click **Create Web Service** — Render will:
1. Pull your code from GitHub
2. Run `npm install && npm run build`
3. Start `npm start`
4. Run database migrations automatically on first boot

**First deploy takes ~3–5 minutes.**

---

## Step 5 — Set Up Google OAuth (Optional but Recommended)

Without this, the app uses a **dev bypass login** — everyone shares one mock account. For real user accounts:

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. Create a new project → **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized redirect URI:
   ```
   https://swadesh-ai.onrender.com/api/auth/callback/google
   ```
6. Copy **Client ID** and **Client Secret** → add to Render env vars
7. Also set `BASE_URL` = `https://swadesh-ai.onrender.com`

---

## Step 6 — Run Database Migrations

The server auto-runs migrations on startup. If you need to run them manually:

```bash
# Locally (with DATABASE_URL in your .env):
npm run db:push
```

---

## Step 7 — Verify Your Deployment

After deploy, check:

| URL | Expected |
|-----|----------|
| `https://swadesh-ai.onrender.com/` | Swadesh AI home |
| `https://swadesh-ai.onrender.com/api/health` | `{"status":"ok","db":true,"ai":true,...}` |
| `https://swadesh-ai.onrender.com/api/login` | Redirect to Google OAuth (or dev bypass) |

---

## All Required Environment Variables

```env
# ── REQUIRED ──────────────────────────────────
NODE_ENV=production
PORT=10000
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=your_64_char_random_string_here

# ── OPTIONAL (for Google OAuth login) ─────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BASE_URL=https://your-app.onrender.com
```

---

## Build & Start Commands Reference

```bash
# Development (local)
npm run dev          # Start dev server on localhost:5000

# Production build
npm run build        # Build client + server to /dist

# Production start
npm start            # Start production server

# Database
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Run migrations
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Render | Check build logs — usually a missing env var |
| `DATABASE_URL must be set` | Add DATABASE_URL in Render environment tab |
| AI features returning errors | Check GEMINI_API_KEY is set correctly |
| OAuth not working | Verify BASE_URL matches your Render URL exactly |
| App crashes on start | Check `/api/health` response; look at Render logs |
| Free tier sleeps | Upgrade to Starter ($7/mo) for always-on |

---

## 🎉 After Deploy

Once live on Render, your Swadesh AI will be accessible at:
```
https://swadesh-ai.onrender.com
```

Share this URL with anyone to access all **30 routes** and **23 AI tools** including:
- 🔍 OCR Scanner, 🎨 AI Image Studio, ✏️ Grammar AI
- 🍛 Recipe Chef, ✈️ Travel Planner, 📄 Resume Builder
- 💚 Health & Wellness AI, 🧮 Calculator, 📖 Dictionary
- 💱 Currency Converter, ❓ Quiz Master, and 14 more!
