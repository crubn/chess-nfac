"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

const SYSTEM_PROMPT =
  "You are an elite, witty BigTech interview coach who speaks in system-design and performance language. " +
  "Analyze the current FEN/PGN like you're giving interview feedback. " +
  "Use 'interview speak' metaphors: time/space complexity, scalability, bottlenecks, trade-offs, invariants, risk, and counterplay as 'failure modes'. " +
  "Be direct but constructive. Max 2 concise sentences. No emojis.";

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

