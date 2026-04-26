# Production deployment checklist

## 1. Polar dashboard setup

1. Create an organization and a **subscription product** (monthly / annual).
2. Copy the **Product ID** → `POLAR_PRO_PRODUCT_ID`.
3. Settings → **API tokens** → generate an org access token → `POLAR_ACCESS_TOKEN`.
4. Settings → **Webhooks** → add endpoint:
   - URL: `https://<your-domain>/api/webhooks/polar`
   - Events to enable: `subscription.created`, `subscription.updated`, `subscription.active`,
     `subscription.canceled`, `subscription.revoked`
   - Copy the **signing secret** → `POLAR_WEBHOOK_SECRET`.
5. Set `POLAR_SERVER=production` (use `sandbox` + sandbox keys during development).

## 2. Vercel environment variables

Set all of the following in **Vercel → Project → Settings → Environment Variables**
(Production + Preview separately; never commit real secrets):

| Variable | Example / notes |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` — no trailing slash |
| `POLAR_ACCESS_TOKEN` | org access token from Polar dashboard |
| `POLAR_PRO_PRODUCT_ID` | UUID from the product page |
| `POLAR_WEBHOOK_SECRET` | signing secret from the Webhooks page |
| `POLAR_SERVER` | `production` (or `sandbox` for preview envs) |
| `SUPABASE_URL` | `https://<project>.supabase.co` (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key — keep server-side only |

`SUBSCRIPTION_MOCK_PRO` and `NEXT_PUBLIC_SUBSCRIPTION_MOCK` are dev-only — do **not** set them in production.

## 3. Success / cancel redirect URLs

The checkout route sets these automatically from `NEXT_PUBLIC_APP_URL`:

- **Success**: `https://<your-domain>/order/success?checkout_id={CHECKOUT_ID}`
- **Return** (cancel / back): `https://<your-domain>/`

Polar replaces `{CHECKOUT_ID}` before redirecting; the success page verifies the ID against the Polar API before granting the Pro cookie.

## 4. Supabase (optional but recommended)

Without Supabase, Pro state lives only in the Node process memory store and is
lost on every cold start / redeploy. With Supabase:

1. Run the SQL from `src/lib/subscription/syncProToDatabase.ts` in your Supabase SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel → the webhook handler will
   upsert on every subscription event automatically.

## 5. Local webhook testing with ngrok

Polar requires a publicly reachable URL for webhooks. During development:

```bash
ngrok http 3000
# copy the https forwarding URL, e.g. https://abc123.ngrok.io
```

Set `NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io` in your `.env.local`, then add
`https://abc123.ngrok.io/api/webhooks/polar` as a webhook endpoint in the Polar sandbox dashboard.

## 6. Smoke-test checklist

- [ ] `GET /api/checkout/polar?products=<id>&customerExternalId=<uid>` redirects to Polar hosted checkout
- [ ] After checkout, Polar redirects to `/order/success?checkout_id=<real-id>` and trophy appears
- [ ] `GET /api/subscription` returns `{ isPro: true }` after success page visit
- [ ] `GET /api/webhooks/polar` returns 405 (POST-only — Polar sends POST)
- [ ] Canceling in Polar dashboard triggers webhook; `/api/subscription` eventually returns `{ isPro: false }`
