# NFAC Chess

3D chess board (React Three Fiber) with a **Polar.sh** subscription flow: Pro gating (AI analysis, premium Vibe themes), webhooks, and order pages. Built with **Next.js 14** (App Router).

## Quick start

```bash
npm install
cp .env.example .env.local
# fill POLAR_* when testing real checkout; optional: NEXT_PUBLIC_SUBSCRIPTION_MOCK=pro
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Install with optional legacy peer resolution if npm complains about `@polar-sh/nextjs` and Next 14:

```bash
npm install --legacy-peer-deps
```

## Features

- **3D board** and piece interaction (`chess.js` rules, game-over overlay, rematch)
- **Polar** checkout (`/api/checkout/polar`, server action), success/cancel routes
- **Pro session** via cookie + in-memory / optional Supabase sync stub (`pro`/`subscription` code under `src/lib/subscription/`)
- **Webhooks** at `/api/webhooks/polar` — use a tunnel (ngrok, etc.) for local testing

## Production

**Live (Vercel):** [chess-nfac.vercel.app](https://chess-nfac.vercel.app)

See [PRODUCTION.md](./PRODUCTION.md) for env vars (`NEXT_PUBLIC_APP_URL`, Polar, webhooks).

## License

[MIT](./LICENSE) — change the copyright line if you publish under your name or org.
