/**
 * Persist Polar subscription state to Supabase via the PostgREST REST API
 * (no @supabase/supabase-js dependency required — uses Node's built-in fetch).
 *
 * Required SQL (run once in your Supabase SQL editor):
 *
 *   create table if not exists public.profiles (
 *     id                    text        primary key,  -- nfa_uid cookie / Polar customerExternalId
 *     is_pro                boolean     not null default false,
 *     polar_customer_id     text,
 *     polar_subscription_id text,
 *     updated_at            timestamptz not null default now()
 *   );
 *
 *   -- Optional: expose to your application role
 *   alter table public.profiles enable row level security;
 *   create policy "service role full access" on public.profiles
 *     using (true) with check (true);
 *
 * Environment variables required:
 *   SUPABASE_URL              — e.g. https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — from Project Settings → API
 */
export async function syncProToDatabase(input: {
  externalUserId: string;
  isPro: boolean;
  polarCustomerId?: string;
  subscriptionId?: string;
}): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const res = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      // merge-duplicates = upsert on primary key conflict
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: input.externalUserId,
      is_pro: input.isPro,
      polar_customer_id: input.polarCustomerId ?? null,
      polar_subscription_id: input.subscriptionId ?? null,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    console.error("[syncProToDatabase] Supabase upsert failed", res.status, body);
  }
}
