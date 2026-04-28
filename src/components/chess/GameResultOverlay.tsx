"use client";

import { useEffect, useRef, useState } from "react";
import { useChessGame } from "@/lib/useChessGame";
import type { EndedGameOutcome } from "@/lib/chessOutcome";
import { getPostGameAnalysis } from "@/app/actions/getPostGameAnalysis";
import { submitGameResult, type SubmitResult } from "@/app/actions/submitGameResult";

const USER_IS = "white" as const;
const CONFETTI = [12, 7, 19, 4, 16, 22, 9, 14, 3, 18, 6, 11, 2, 20, 5];
const CITIES = ["Astana", "Almaty", "Other"] as const;
type City = (typeof CITIES)[number];

type PlayerProfile = { uid: string; nickname: string; city: City };

function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem("nfac_player");
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

function saveProfile(p: PlayerProfile) {
  try {
    localStorage.setItem("nfac_player", JSON.stringify(p));
  } catch {
    // ignore
  }
}

function getOrCreateUid(): string {
  try {
    const stored = localStorage.getItem("nfac_uid");
    if (stored) return stored;
    const uid = crypto.randomUUID();
    localStorage.setItem("nfac_uid", uid);
    return uid;
  } catch {
    return crypto.randomUUID();
  }
}

function gameResult(o: EndedGameOutcome): "win" | "loss" | "draw" {
  if (o.result === "draw") return "draw";
  return o.result === USER_IS ? "win" : "loss";
}

function resultForPrompt(o: EndedGameOutcome): string {
  if (o.result === "draw") return "Draw";
  return o.result === "white" ? "White wins" : "Black wins";
}

function reasonLine(o: EndedGameOutcome): string {
  if (o.reason === "stalemate") return "Пат";
  if (o.reason === "insufficient") return "Недостаточно материала";
  if (o.reason === "threefold") return "Трёхкратное повторение";
  if (o.reason === "fifty") return "Правило 50 ходов";
  return "Ничья";
}

const INSIGHT_LABELS = ["Verdict", "Turning Point", "Next Time"] as const;
const INSIGHT_COLORS = ["text-amber-300/90", "text-rose-300/90", "text-emerald-300/90"] as const;

export function GameResultOverlay() {
  const { outcome, playAgain, pgn } = useChessGame();

  // Post-game analysis
  const [insights, setInsights] = useState<[string, string, string] | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Leaderboard
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState<City>("Almaty");
  const [eloResult, setEloResult] = useState<SubmitResult>(null);
  const [eloLoading, setEloLoading] = useState(false);
  const submittedRef = useRef(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // When game ends: fetch analysis + auto-submit if profile exists
  useEffect(() => {
    if (!outcome) {
      setInsights(null);
      setEloResult(null);
      submittedRef.current = false;
      return;
    }

    // AI analysis
    setAnalysisLoading(true);
    setInsights(null);
    void (async () => {
      try {
        const result = await getPostGameAnalysis(pgn, resultForPrompt(outcome));
        setInsights(result);
      } catch {
        setInsights(["Analysis unavailable — coach is offline.", "—", "—"]);
      } finally {
        setAnalysisLoading(false);
      }
    })();

    // Auto-submit ELO if profile already set
    const existing = loadProfile();
    if (existing && !submittedRef.current) {
      submittedRef.current = true;
      setEloLoading(true);
      void submitGameResult(existing.uid, existing.nickname, existing.city, gameResult(outcome))
        .then(setEloResult)
        .finally(() => setEloLoading(false));
    }
  }, [outcome, pgn]);

  if (!outcome) return null;

  const userWon = outcome.result === USER_IS;
  const userLost = outcome.result !== "draw" && !userWon;
  const isDraw = outcome.result === "draw";

  const handleRegister = async () => {
    if (!nickname.trim()) return;
    const uid = getOrCreateUid();
    const p: PlayerProfile = { uid, nickname: nickname.trim(), city };
    saveProfile(p);
    setProfile(p);
    submittedRef.current = true;
    setEloLoading(true);
    try {
      const res = await submitGameResult(uid, p.nickname, p.city, gameResult(outcome));
      setEloResult(res);
    } finally {
      setEloLoading(false);
    }
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Результат партии"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-hidden />

      {userWon && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {CONFETTI.map((left, i) => (
            <span
              key={i}
              className="nfac-confetti absolute top-0 h-2 w-1 rounded-sm opacity-80"
              style={{
                left: `${left}%`,
                background:
                  i % 2
                    ? "linear-gradient(180deg,#fbbf24,#b45309)"
                    : "linear-gradient(180deg,#fde68a,#d97706)",
                animation: `nfac-confetti-fall ${2.3 + (i % 4) * 0.2}s ease-in ${i * 0.04}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div className="nfac-victory-card relative z-10 w-full max-w-sm rounded-2xl border border-amber-400/35 bg-gradient-to-b from-[#12100e] to-[#05040a] p-6 text-white shadow-[0_0_80px_rgba(201,162,39,0.2)]">

        {/* ── Result header ── */}
        <div className="text-center">
          {userWon && <p className="mb-1 text-4xl drop-shadow-lg" aria-hidden>🏆</p>}
          <h2 className={["text-xl font-semibold tracking-tight", userWon ? "text-amber-100" : isDraw ? "text-white/90" : "text-rose-100/95"].join(" ")}>
            {userWon && "Победа!"}
            {userLost && "Соперник поставил мат"}
            {isDraw && "Ничья"}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {userWon && "Белыми сделан мат. Отлично сыграно."}
            {userLost && "Чёрные выиграли эту партию."}
            {isDraw && reasonLine(outcome)}
          </p>
        </div>

        {/* ── AI Coach Post-Mortem ── */}
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3.5">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            AI Coach · Post-Mortem
          </p>
          {analysisLoading && (
            <div className="flex items-center gap-2 text-[12px] text-white/50">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400/70" />
              Coach is running the debrief…
            </div>
          )}
          {!analysisLoading && insights && (
            <ul className="space-y-2.5">
              {insights.map((text, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug">
                  <span className={["mt-px shrink-0 font-mono text-[10px] font-bold", INSIGHT_COLORS[i]].join(" ")}>
                    {INSIGHT_LABELS[i]}
                  </span>
                  <span className="text-white/75">{text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Leaderboard section ── */}
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Leaderboard
          </p>

          {/* ELO result if already registered */}
          {profile && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-white/60">
                {profile.nickname} · {profile.city}
              </span>
              {eloLoading && (
                <span className="font-mono text-[11px] text-white/40">updating…</span>
              )}
              {!eloLoading && eloResult && (
                <span className={["font-mono text-[12px] font-semibold", eloResult.delta >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>
                  {eloResult.elo} ELO
                  <span className="ml-1 text-[10px] opacity-70">
                    ({eloResult.delta >= 0 ? "+" : ""}{eloResult.delta})
                  </span>
                </span>
              )}
              {!eloLoading && !eloResult && (
                <span className="font-mono text-[11px] text-white/30">offline</span>
              )}
            </div>
          )}

          {/* Registration form if first time */}
          {!profile && (
            <div className="space-y-2">
              <p className="text-[11px] text-white/50">Войди в рейтинг по городу</p>
              <input
                type="text"
                placeholder="Никнейм"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white placeholder-white/30 outline-none focus:border-amber-400/40"
              />
              <div className="flex gap-1.5">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={[
                      "flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition",
                      city === c
                        ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleRegister()}
                disabled={!nickname.trim() || eloLoading}
                className="w-full rounded-lg border border-emerald-400/35 bg-emerald-500/15 py-2 text-[12px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40"
              >
                {eloLoading ? "Сохраняем…" : "Добавить в рейтинг"}
              </button>
            </div>
          )}
        </div>

        {/* ── Play again ── */}
        <button
          type="button"
          onClick={playAgain}
          className="mt-4 w-full rounded-xl border border-amber-400/40 bg-amber-500/20 py-3 text-sm font-semibold text-amber-50 transition hover:border-amber-300/50 hover:bg-amber-500/30"
        >
          Сыграть снова
        </button>
      </div>
    </div>
  );
}
