"use server";

import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const ELO_DELTA: Record<"win" | "loss" | "draw", number> = {
  win: 15,
  loss: -10,
  draw: 3,
};

export type SubmitResult = { elo: number; delta: number } | null;

export async function submitGameResult(
  uid: string,
  nickname: string,
  city: string,
  result: "win" | "loss" | "draw",
): Promise<SubmitResult> {
  const sb = getAdmin();
  if (!sb) return null;

  const { data: existing } = await sb
    .from("leaderboard")
    .select("elo, wins, losses, draws")
    .eq("uid", uid)
    .maybeSingle();

  const delta = ELO_DELTA[result];
  const currentElo = (existing?.elo as number | undefined) ?? 1200;
  const newElo = Math.max(100, currentElo + delta);

  const { error } = await sb.from("leaderboard").upsert(
    {
      uid,
      nickname,
      city,
      elo: newElo,
      wins: ((existing?.wins as number | undefined) ?? 0) + (result === "win" ? 1 : 0),
      losses: ((existing?.losses as number | undefined) ?? 0) + (result === "loss" ? 1 : 0),
      draws: ((existing?.draws as number | undefined) ?? 0) + (result === "draw" ? 1 : 0),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "uid" },
  );

  if (error) return null;
  return { elo: newElo, delta };
}
