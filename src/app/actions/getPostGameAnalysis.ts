"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

const SYSTEM_PROMPT =
  "You are an elite BigTech post-mortem coach running an engineering debrief after a completed chess game. " +
  "Speak entirely in system-design metaphors: O(n) blunders, race conditions, bottlenecks, technical debt, " +
  "single points of failure, premature optimization, etc. " +
  "Return EXACTLY 3 insights, each on its own line, numbered '1.', '2.', '3.'. " +
  "Line 1: overall verdict on the game's architecture (winning/losing strategy quality). " +
  "Line 2: the single critical turning point — the move or phase where the system failed. " +
  "Line 3: one concrete actionable improvement for the next game. " +
  "Each line: max 20 words. Direct, witty, specific. No emojis.";

function getModel() {
  if (process.env.GROQ_API_KEY) return groq("llama-3.1-70b-versatile");
  return openai("gpt-4o-mini");
}

export async function getPostGameAnalysis(
  pgn: string,
  result: string,
): Promise<[string, string, string]> {
  const safePgn = String(pgn ?? "").trim().slice(-8000);

  if (!safePgn) {
    return [
      "Game too short — not enough data points to run a post-mortem.",
      "No critical turning point detected: zero meaningful moves logged.",
      "Play at least 10 moves next time to generate actionable insights.",
    ];
  }

  const { text } = await generateText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    prompt: `Result: ${result}\n\nFull PGN:\n${safePgn}`,
  });

  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  while (lines.length < 3) lines.push("—");
  return [lines[0]!, lines[1]!, lines[2]!];
}
