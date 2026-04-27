"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

const SYSTEM_PROMPT =
  "You are an elite, witty Grandmaster Chess Coach. Analyze the current FEN/PGN. " +
  "Briefly explain the strategic balance. If the last move was a blunder, point it out. " +
  "If it was a brilliant move, praise it. Max 2 concise sentences.";

function getModel() {
  // Prefer Groq if configured, else OpenAI.
  if (process.env.GROQ_API_KEY) return groq("llama-3.1-70b-versatile");
  return openai("gpt-4o-mini");
}

export async function getCoachInsight(fen: string, pgn: string): Promise<string> {
  // Guardrails: avoid huge prompts and empty input.
  const safeFen = String(fen ?? "").slice(0, 140);
  const safePgn = String(pgn ?? "").slice(-5000);
  if (!safeFen) return "Make a move — I’ll comment on the position.";

  const { text } = await generateText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    prompt: `FEN:\n${safeFen}\n\nPGN:\n${safePgn || "(no moves yet)"}`,
  });

  return text.trim();
}

