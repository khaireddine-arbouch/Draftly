# Draftly — Huawei Cloud Native Design Copilot

Draftly is a generative design studio for Morocco’s fast-growing creative sector. It turns screenshots into editable canvases, auto-builds style guides, and keeps product teams in sync with autosave workflows powered by Convex, Inngest, and Huawei Cloud.

## Why Draftly Wins SEO & Judging Points

- **Clear audience signal** – copy, metadata, and Open Graph tags all emphasize “Morocco”, “Huawei Cloud”, and “AI design copilot”.
- **Fast page experience** – optimized Next.js App Router build with image remote patterns and streaming partials.
- **Link-ready assets** – shareable `/` landing page, `/api/inngest` health check, and sitemap-friendly structure for Vercel.

## Tech Stack

| Layer | Details |
| --- | --- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind/Radix UI, Framer Motion |
| Data & Auth | Convex realtime DB + Convex Auth (Google OAuth) |
| Background Workflows | Inngest cloud functions (autosave, billing sync) |
| AI Providers | Polar billing, Anthropic Claude, Alibaba Qwen, DeepSeek, Huawei ModelArts-ready endpoints |
| State | Redux Toolkit + custom hooks |

## Feature Highlights

- 🔐 **Account-aware canvas** – OAuth + Convex sessions protect every project.
- 🧠 **Style guide AI** – Upload moodboards, get palette + typography suggestions tuned for North African brands.
- 🛰️ **Autosave & billing webhooks** – Inngest listens for canvas edits and Polar renewals.
- 📱 **Responsive landing funnel** – SEO-ready and localized copy for Moroccan agencies.

## Local Development

### Prerequisites
- Node.js 20+
- `pnpm` (recommended) or npm/yarn

### Install & Run
```bash
pnpm install
pnpm dev
```
Navigate to `http://localhost:3000`.

### Required Environment Variables
Create `.env.local` (or configure in Vercel dashboard) with:

| Key | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public site URL (e.g., `https://draftly-huawei.com`) |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `CONVEX_DEPLOYMENT`, `CONVEX_DEPLOY_KEY`, `CONVEX_SITE_URL` | Convex admin keys |
| `GOOGLE_CLOUD_ID`, `GOOGLE_CLIENT_SECRET` | OAuth credentials |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ENV`, `POLAR_STANDARD_PLAN` | Billing |
| `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` | Inngest cloud credentials |
| `ANTHROPIC_API_KEY`, `DEEPSEEK_ENDPOINT_URL`, `DEEPSEEK_API_KEY`, `QWEN_3_API_KEY` | AI models |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | (If using NextAuth locally or in Vercel) |

> Tip: In Vercel, add these under **Project Settings → Environment Variables** and select the appropriate environments (Preview/Production).

## Deploying to Vercel

1. **Connect repo** – Import the GitHub repo into Vercel. Framework preset: **Next.js**.
2. **Set env vars** – Paste the keys above into Vercel → Settings → Environment Variables. Include `NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app` (or custom domain).
3. **Build command** – Vercel auto-detects `pnpm build`. Output is `.next`.
4. **Convex auth** – In Convex dashboard, add your Vercel Preview + Production domains to the allowed origins list.
5. **Inngest** – In Inngest console, set the App Origin to your Vercel Production domain (`https://your-domain.vercel.app/api/inngest`) and re-run “Resync App”.
6. **Custom domain** – Once verified, add `draftly-huawei.com` (or `app.draftly-huawei.com`) in Vercel’s Domains panel if you want Vercel to serve primary traffic instead of Huawei Cloud.

## SEO Playbook

- Global metadata (title templates, OpenGraph, Twitter cards) lives in `app/layout.tsx`.
- Landing content uses semantic headings (`<h1>`, `<section>`) and Morocco-specific keywords.
- `/api/inngest` returns a JSON health payload for monitoring & search console pings.
- Optional: add `sitemap.ts` and `robots.txt` under `app/` if you split marketing routes later.

## Project Structure

```
draftly/
├── app/                  # Next.js routes, layouts, metadata
├── components/           # UI and landing sections
├── convex/               # Convex schema + functions
├── redux/                # Store & slices
├── hooks/, lib/, prompts/ # Shared logic & AI clients
└── public/               # Static assets (favicons, logos)
```

## Deployment Targets

- **Huawei Cloud CCI** – Containerized build via `docker buildx` and SWR image registry for regional judging.
- **Vercel** – Zero-config Next.js hosting with ISR, previews, and Edge Middleware support.

## Self-Hosting & Docker Image

Draftly is available as a Docker image on Docker Hub. Users can self-host the application with their own environment variables.

**Quick Start:**
```bash
# Pull the image
docker pull khaireddinearb/draftly:latest

# Create .env.docker file (see template in docs/SELF_HOSTING.md)

# Run with your environment variables
docker run -p 3000:3000 --env-file .env.docker khaireddinearb/draftly:latest
```

**Docker Hub:** [khaireddinearb/draftly](https://hub.docker.com/r/khaireddinearb/draftly)

**Documentation:**
- [`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md) - Complete Docker setup and deployment guide
- [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) - Step-by-step guide for obtaining all environment variables

## License

Private – All rights reserved.

