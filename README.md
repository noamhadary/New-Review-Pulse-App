# Review Pulse

ניהול מוניטין חכם — SaaS לניהול ביקורות לקוחות.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React + TypeScript + TailwindCSS v4 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Charts | Recharts |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo>
cd review-pulse
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your keys
3. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor

```bash
cp .env.example .env.local
# edit .env.local
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

```bash
npm run build
# push to GitHub, then import in Vercel
# set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env vars
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | KPI cards, sentiment chart, pulse gauge, recent reviews |
| `/reviews` | Filterable review grid with reply functionality |
| `/onboarding` | 4-step setup wizard for new businesses |
| `/settings` | Profile, notifications, integrations, billing |
| `/auth/login` | Login page |
| `/auth/register` | Registration page |
