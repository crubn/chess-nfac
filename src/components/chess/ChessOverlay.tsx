"use client";

import { useEffect, useState } from "react";
import { useChessGame } from "@/lib/useChessGame";
import type { VibeTheme } from "@/lib/vibeTheme";
import { getPolarCheckoutUrl } from "@/app/actions/getPolarCheckoutUrl";
import { GameResultOverlay } from "@/components/chess/GameResultOverlay";
import { useProStore } from "@/lib/pro/proStore";

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
}: {
  vibe: VibeTheme;
  onVibeChange: (v: VibeTheme) => void;
}) {
  const { pgnLine, historySan } = useChessGame();
  const isPro = useProStore((s) => s.isPro);
  const ready = useProStore((s) => s.ready);
  const checkSubscriptionStatus = useProStore((s) => s.checkSubscriptionStatus);
  const [evalBar, setEvalBar] = useState(50);

  useEffect(() => {
    void checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

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

  const onVibeClick = async (id: VibeTheme, locked: boolean) => {
    if (locked) return openCheckout();
    onVibeChange(id);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 font-sans text-white/90">
      <div className="pointer-events-auto absolute left-0 right-0 top-0 z-30 flex items-center justify-center border-b border-white/10 bg-black/20 px-2 py-2.5 backdrop-blur-md sm:px-4">
        <div className="mx-auto flex max-w-6xl flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 sm:mr-4 sm:inline">
            nfac
          </span>
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
                  <p className="mt-1.5 font-mono text-[10px] text-white/45">
                    Live engine · depth 32 (full lines on PRO)
                  </p>
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
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Multi-players</h2>
            <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto pr-0.5 text-[12px] sm:max-h-32">
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
                        {locked ? "Pro · checkout to unlock" : t.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
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
