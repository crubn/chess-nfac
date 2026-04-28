"use server";

import { createClient } from "@supabase/supabase-js";

export type LeaderboardRow = {
  nickname: string;
  city: string;
  elo: number;
  wins: number;
};

export async function getLeaderboard(city: "Astana" | "Almaty"): Promise<LeaderboardRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from("leaderboard")
    .select("nickname, city, elo, wins")
    .eq("city", city)
    .order("elo", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as LeaderboardRow[];
}
