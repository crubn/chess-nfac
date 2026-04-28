"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChessGame } from "@/lib/useChessGame";
import type { VibeTheme } from "@/lib/vibeTheme";
import { getPolarCheckoutUrl } from "@/app/actions/getPolarCheckoutUrl";
import { GameResultOverlay } from "@/components/chess/GameResultOverlay";
import { useProStore } from "@/lib/pro/proStore";
import { getCoachInsight } from "@/app/actions/getCoachInsight";

function IconSettings() {
  return (
    <span className="text-sm leading-none" aria-hidden>
      &#9881;
    </span>
  );
}
function IconChart() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-3" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 12a9 9 0 1 0 2.1-5.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const LOBBY = [
  { id: "1", name: "GM_Nebula", title: "Blitz 3+0", el: 2410 },
  { id: "2", name: "PawnStorm", title: "Rapid 10+0", el: 1982 },
  { id: "3", name: "Aether", title: "Arena", el: 2230 },
  { id: "4", name: "Kairos_X", title: "3-check", el: 2011 },
];

const CHAT = [
  { user: "player", text: "lol" },
  { user: "oversend", text: "no" },
  { user: "watcher-12", text: "Rd8 idea incoming" },
  { user: "Mayon", text: "gg" },
];

const VIBES: { id: VibeTheme; label: string; sub: string; swatch: string; proOnly: boolean }[] = [
  { id: "standard", label: "Standard", sub: "Marble / wood", swatch: "from-[#f5f0e6] to-[#2a2018]", proOnly: false },
  { id: "cyberpunk", label: "Cyberpunk", sub: "Neon haze", swatch: "from-[#120022] to-[#00e5ff]", proOnly: true },
  { id: "glass", label: "Glassmorphism", sub: "Frosted studio", swatch: "from-[#e0e7ef]/80 to-[#3b4a5f]/80", proOnly: true },
];

export function ChessOverlay({
  vibe,
  onVibeChange,
  roomId,
  mpPresence,
  systemDesignMode,
  onSystemDesignModeChange,
}: {
  vibe: VibeTheme;
  onVibeChange: (v: VibeTheme) => void;
  roomId?: string | null;
  mpPresence?: { connected: boolean; peerSeen: boolean; peerIsPro: boolean | null };
  systemDesignMode?: boolean;
  onSystemDesignModeChange?: (v: boolean) => void;
}) {
  const { pgnLine, historySan, moveLog, fen, pgn } = useChessGame();
  const router = useRouter();
  const isPro = useProStore((s) => s.isPro);
  const ready = useProStore((s) => s.ready);
  const checkSubscriptionStatus = useProStore((s) => s.checkSubscriptionStatus);
  const [evalBar, setEvalBar] = useState(50);
  const [coachMessage, setCoachMessage] = useState<string>("Make a move — I’ll comment on the position.");
  const [coachLoading, setCoachLoading] = useState(false);
  const lastFenRef = useRef<string>("");
  const reqIdRef = useRef(0);
  const [rightTab, setRightTab] = useState<"multiplayer" | "leaderboard">("multiplayer");

  useEffect(() => {
    void checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const shouldAnalyze = ready && isPro;
  const fenKey = useMemo(() => (fen ?? "").trim(), [fen]);

  useEffect(() => {
    if (!shouldAnalyze) return;
    if (!fenKey) return;
    if (lastFenRef.current === fenKey) return;
    lastFenRef.current = fenKey;

    const myReq = ++reqIdRef.current;
    setCoachLoading(true);
    setCoachMessage("Coach is thinking...");

    const t = setTimeout(() => {
      void (async () => {
        try {
          const msg = await getCoachInsight(fenKey, pgn);
          if (reqIdRef.current !== myReq) return;
          setCoachMessage(msg);
        } catch {
          if (reqIdRef.current !== myReq) return;
          setCoachMessage("I lost the thread — make another move and I’ll re-evaluate.");
        } finally {
          if (reqIdRef.current === myReq) setCoachLoading(false);
        }
      })();
    }, 650); // debounce to save credits / avoid spam while animating

    return () => clearTimeout(t);
  }, [fenKey, pgn, shouldAnalyze]);

  useEffect(() => {
    const i = setInterval(() => {
      setEvalBar(50 + Math.sin(Date.now() / 2200) * 10 + (historySan.length % 5) * 0.4);
    }, 80);
    return () => clearInterval(i);
  }, [historySan.length]);

  const openCheckout = async () => {
    const url = await getPolarCheckoutUrl();
    // New tab, no opener for security.
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback: best-effort prompt
      window.prompt("Copy link", url);
    }
  };

  const copyRoomLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy room link", url);
    }
  };

  const createPrivateRoom = () => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    router.push(`/game/${id}`);
  };

  const onVibeClick = async (id: VibeTheme, locked: boolean) => {
    if (locked) return openCheckout();
    onVibeChange(id);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 font-sans text-white/90">
      <div className="pointer-events-auto absolute left-0 right-0 top-0 z-30 flex items-center justify-center border-b border-white/10 bg-black/20 px-2 py-2.5 backdrop-blur-md sm:px-4">
        <div className="mx-auto flex max-w-6xl flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 sm:mr-4 sm:inline">
            BigTech Interview Chess
          </span>
          {roomId ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/55">
                room {roomId.slice(0, 8)}
              </span>
              <span
                className={[
                  "rounded border px-2 py-1 font-mono text-[10px]",
                  mpPresence?.peerSeen ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100/90" : "border-white/10 bg-white/5 text-white/45",
                ].join(" ")}
                title={mpPresence?.peerSeen ? "Peer connected" : "Waiting for peer"}
              >
                {mpPresence?.peerSeen ? "connected" : "waiting"}
              </span>
              <button
                type="button"
                onClick={() => void copyRoomLink()}
                className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70 transition hover:border-cyan-300/40 hover:bg-white/10 hover:text-white"
                title="Copy room link"
              >
                Copy link
              </button>
            </div>
          ) : null}
          {[
            { k: "settings", icon: <IconSettings />, label: "Settings" },
            { k: "analytics", icon: <IconChart />, label: "Analytics" },
            { k: "history", icon: <IconHistory />, label: "History" },
          ].map((b) => (
            <button
              type="button"
              key={b.k}
              title={b.label}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
            >
              {b.icon}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void shareLink()}
            title="Share game link"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
          >
            <span className="text-sm leading-none" aria-hidden>
              ⤴
            </span>
          </button>
        </div>
      </div>

      <div className="max-md:pointer-events-auto max-md:mt-0 max-h-[100dvh] max-md:overflow-y-auto max-md:px-2 max-md:pt-14 max-md:pb-6 md:contents">
        <aside className="pointer-events-auto relative z-20 order-1 mx-auto mt-0 flex w-full max-w-sm flex-col gap-3 py-1 max-md:shrink-0 sm:px-1 md:absolute md:left-0 md:top-14 md:order-none md:mx-0 md:mt-0 md:w-80 md:max-w-none md:gap-4 md:p-4">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur-xl sm:p-4">
            <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/50">Moves</h2>
            <div className="max-h-28 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2.5 text-[12px] leading-relaxed text-white/85 sm:max-h-32">
              <p className="whitespace-pre-wrap break-words font-mono text-[11px] sm:text-xs">
                {pgnLine || "— 1. (make a move) —"}
              </p>
            </div>
            <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">Move log</p>
              <ul className="max-h-24 space-y-1 overflow-y-auto pr-1 text-[11px]">
                {moveLog.length === 0 ? (
                  <li className="text-white/35">No moves yet</li>
                ) : (
                  moveLog
                    .slice(-12)
                    .reverse()
                    .map((m) => (
                      <li key={`${m.ply}-${m.atMs}`} className="flex items-center justify-between gap-2 text-white/75">
                        <span className="inline-flex items-center gap-2 font-mono">
                          <span
                            className={[
                              "inline-block h-1.5 w-1.5 rounded-full",
                              m.color === "w" ? "bg-white/80" : "bg-slate-400/80",
                            ].join(" ")}
                            aria-hidden
                          />
                          <span className="text-white/40">{m.ply}.</span>
                          <span>{m.san}</span>
                        </span>
                        <span className="text-[10px] text-white/35">
                          {new Date(m.atMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </li>
                    ))
                )}
              </ul>
            </div>

            <div className="mt-4 space-y-3">
              <PlayerRow
                name="Mayon"
                elo={2101}
                flag="🇺🇸"
                country="US"
                tone="text-emerald-200/90"
                showProBadge={ready && isPro}
              />
              <PlayerRow
                name="oversend"
                elo={2080}
                flag="🇰🇿"
                country="KZ"
                tone="text-sky-200/90"
                showProBadge={false}
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-600/40 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                  AI analysis
                </span>
                <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200/80">
                  Stockfish 16.1
                </span>
              </div>
              <div className="relative">
                {!isPro && ready && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-amber-500/30 bg-black/50 px-2 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="text-[12px] text-amber-200/90" aria-hidden>
                        🔒
                      </p>
                      <p className="text-[10px] font-medium tracking-wide text-amber-200/90">
                        Unlock with <span className="text-amber-100">PRO</span>
                      </p>
                      <p className="mt-0.5 text-[9px] text-white/55">Get Pro to see Grandmaster insights</p>
                    </div>
                  </div>
                )}
                <div
                  className={[
                    "select-none transition",
                    !isPro && ready ? "blur-sm saturate-50" : "",
                  ].join(" ")}
                >
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-700/80">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.55)] transition-[width] duration-200"
                      style={{ width: `${Math.max(0, Math.min(100, evalBar))}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-slate-500/60"
                      style={{ width: `${100 - Math.max(0, Math.min(100, evalBar))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] italic leading-snug text-emerald-200/85">
                    {coachMessage}
                    {coachLoading ? <span className="text-emerald-200/55"> {" "}…</span> : null}
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] text-white/45">Live engine · depth 32</p>
                </div>
              </div>
            </div>

            <div className="group relative mt-4 overflow-hidden">
              <button
                type="button"
                onClick={() => void openCheckout()}
                className="nfac-pro-pulse relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-bold tracking-tight text-white transition hover:from-emerald-400 hover:to-emerald-600"
              >
                <span
                  className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent opacity-0 transition group-hover:translate-x-[220%] group-hover:opacity-100"
                  style={{ transitionDuration: "1.1s" }}
                  aria-hidden
                />
                <span className="absolute left-2 top-1.5 text-amber-200/90" aria-hidden>
                  ✦
                </span>
                <span className="relative">{isPro && ready ? "Manage Pro" : "Upgrade to PRO"}</span>
              </button>
              <p className="mt-1 text-center text-[9px] text-white/35">Cloud analysis, premium Vibe themes, coach lines</p>
            </div>
          </div>
        </aside>

        <aside className="pointer-events-auto relative z-20 order-2 mx-auto flex w-full max-w-sm flex-col gap-3 py-1 max-md:mt-1 max-md:shrink-0 sm:px-1 md:absolute md:right-0 md:top-14 md:order-none md:mx-0 md:mt-0 md:w-80 md:max-w-none md:gap-4 md:p-4">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur-xl sm:p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Social</h2>
              <div className="flex items-center gap-1">
                {[
                  { k: "multiplayer" as const, label: "Multiplayer" },
                  { k: "leaderboard" as const, label: "Leaderboard" },
                ].map((t) => (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setRightTab(t.k)}
                    className={[
                      "rounded-lg border px-2 py-1 text-[10px] font-semibold",
                      rightTab === t.k ? "border-amber-400/40 bg-amber-500/10 text-amber-100" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/8",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {rightTab === "multiplayer" ? (
              <div className="mt-3 space-y-3">
                {roomId ? (
                  <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Invite teammate</p>
                      <span
                        className={[
                          "rounded border px-1.5 py-0.5 font-mono text-[9px]",
                          mpPresence?.peerSeen ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100/90" : "border-white/10 bg-white/5 text-white/45",
                        ].join(" ")}
                      >
                        {mpPresence?.peerSeen ? "peer online" : "waiting"}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/45">Share this URL. Moves sync instantly via Supabase Realtime.</p>
                    <button
                      type="button"
                      onClick={() => void copyRoomLink()}
                      className="mt-2 w-full rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-left text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                    >
                      Copy room link
                      <p className="mt-0.5 text-[10px] font-normal text-white/45">Paste it into chat / email / calendar invite.</p>
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={createPrivateRoom}
                  className="w-full rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-left text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                >
                  Create Private Room
                  <p className="mt-0.5 text-[10px] font-normal text-white/45">Generates a unique URL and syncs moves in real-time.</p>
                </button>

                <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Lobby (mock)</p>
                  <ul className="mt-2 max-h-24 space-y-1.5 overflow-y-auto pr-0.5 text-[12px]">
                    {LOBBY.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-2 py-1.5"
                      >
                        <span className="truncate text-white/85">{r.name}</span>
                        <span className="shrink-0 text-[9px] text-white/40">{r.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-amber-200/80">{r.el}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <LeaderboardPanel />
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur-xl sm:p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Chat</h2>
            <ul className="mt-2 max-h-32 space-y-1.5 overflow-y-auto pr-0.5 text-[11px] leading-snug sm:max-h-40">
              {CHAT.map((c, i) => (
                <li key={i} className="text-white/75">
                  <span className="font-mono text-cyan-200/80">{c.user}:</span> {c.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur-xl sm:p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Vibe theme</h2>
            <div className="mt-3 space-y-2.5">
              {VIBES.map((t) => {
                const locked = t.proOnly && !isPro;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => void onVibeClick(t.id, locked)}
                    title={locked ? "Upgrade to Unlock High Agency Themes" : t.sub}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition",
                      vibe === t.id
                        ? "border-amber-400/50 bg-amber-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "relative h-10 w-10 shrink-0 rounded-lg border border-white/15 bg-gradient-to-br shadow-inner",
                        t.swatch,
                        locked ? "opacity-70" : "",
                      ].join(" ")}
                    >
                      {locked && (
                        <span
                          className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-amber-400/40 bg-black/60 text-[10px] text-amber-200"
                          aria-hidden
                        >
                          🔒
                        </span>
                      )}
                      {t.proOnly && (
                        <span
                          className="absolute -right-1 -top-1 rounded border border-amber-300/60 bg-amber-500/20 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-200 shadow-[0_0_12px_rgba(201,162,39,0.25)]"
                          title="Pro"
                        >
                          Pro
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/90">{t.label}</p>
                      <p className="text-[10px] text-white/50">
                        {locked ? "Upgrade to Unlock High Agency Themes" : t.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur-xl sm:p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/50">System Design Mode</h2>
              <button
                type="button"
                onClick={() => onSystemDesignModeChange?.(!systemDesignMode)}
                className={[
                  "rounded-lg border px-2 py-1 text-[10px] font-semibold",
                  systemDesignMode ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/8",
                ].join(" ")}
              >
                {systemDesignMode ? "On" : "Off"}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/45">Visual-only technical grid overlay. No gameplay changes.</p>
          </div>
        </aside>
      </div>

      <GameResultOverlay />
    </div>
  );
}

function PlayerRow({
  name,
  elo,
  flag,
  country,
  tone,
  showProBadge,
}: {
  name: string;
  elo: number;
  flag: string;
  country: string;
  tone: string;
  showProBadge?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-slate-800/80 text-xs font-bold text-white/60"
        title="Avatar"
      >
        {name.slice(0, 2).toUpperCase()}
        {showProBadge && (
          <span
            className="absolute -bottom-0.5 -right-0.5 rounded border border-amber-400/50 bg-amber-600/90 px-1 text-[6px] font-bold uppercase text-amber-100 shadow"
            title="Pro"
          >
            pro
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-[11px] sm:text-xs">
        <p className={`truncate font-medium ${tone}`}>
          <span className={[showProBadge ? "nfac-name-pro" : "", "inline-flex items-center gap-1.5"].join(" ")}>
            {name}
            {showProBadge && (
              <span className="rounded border border-amber-300/40 bg-amber-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">
                PRO
              </span>
            )}
          </span>{" "}
          <span className="text-white/45">{elo} ELO</span>{" "}
          <span className="text-sm" title={country}>
            {flag}
          </span>
        </p>
        <p className="text-[9px] text-white/40">{country} · FIDE</p>
      </div>
    </div>
  );
}

function LeaderboardPanel() {
  const astana = [
    { name: "SteppeScaler", elo: 2462 },
    { name: "KhanLatency", elo: 2398 },
    { name: "EdgeCache", elo: 2321 },
    { name: "ByteBishop", elo: 2289 },
    { name: "DP-Knight", elo: 2240 },
    { name: "FaultTolerant", elo: 2212 },
    { name: "ShardingQueen", elo: 2177 },
    { name: "HotPath", elo: 2144 },
    { name: "Invariant", elo: 2120 },
    { name: "Backpressure", elo: 2095 },
  ];
  const almaty = [
    { name: "ZailiyskiGM", elo: 2440 },
    { name: "Heapify", elo: 2379 },
    { name: "MicroserviceMate", elo: 2312 },
    { name: "O(1)Endgame", elo: 2290 },
    { name: "PruneSearch", elo: 2255 },
    { name: "LoadBalancer", elo: 2219 },
    { name: "PromoteOrDie", elo: 2183 },
    { name: "ColdStart", elo: 2152 },
    { name: "MergeConflict", elo: 2127 },
    { name: "RetryPolicy", elo: 2101 },
  ];

  return (
    <div className="mt-3 space-y-3">
      <CityTop title="Top 10 Astana" badge="ASTANA" tone="bg-emerald-500/15 border-emerald-400/25 text-emerald-100" rows={astana} />
      <CityTop title="Top 10 Almaty" badge="ALMATY" tone="bg-sky-500/15 border-sky-400/25 text-sky-100" rows={almaty} />
    </div>
  );
}

function CityTop({
  title,
  badge,
  tone,
  rows,
}: {
  title: string;
  badge: string;
  tone: string;
  rows: { name: string; elo: number }[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">{title}</p>
        <span className={["rounded border px-1.5 py-0.5 font-mono text-[9px]", tone].join(" ")}>{badge}</span>
      </div>
      <ul className="mt-2 space-y-1.5 text-[12px]">
        {rows.map((r, i) => (
          <li
            key={r.name}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-2 py-1.5"
          >
            <span className="min-w-0 truncate text-white/85">
              <span className="mr-2 font-mono text-[10px] text-white/40">{String(i + 1).padStart(2, "0")}</span>
              {r.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-amber-200/80">{r.elo} ELO</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
