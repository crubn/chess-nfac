"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChessGame } from "@/lib/useChessGame";
import { supabase } from "@/lib/multiplayer/supabaseClient";
import type { MpMsg } from "@/lib/multiplayer/types";
import type { VibeTheme } from "@/lib/vibeTheme";
import { useProStore } from "@/lib/pro/proStore";

function makeClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function MultiplayerBridge({
  roomId,
  vibe,
  onVibeChange,
  onPresenceChange,
}: {
  roomId: string | null;
  vibe: VibeTheme;
  onVibeChange: (v: VibeTheme) => void;
  onPresenceChange?: (s: { connected: boolean; peerSeen: boolean; peerIsPro: boolean | null }) => void;
}) {
  const { fen, moveLog, applyExternalMove, loadExternalState } = useChessGame();
  const isPro = useProStore((s) => s.isPro);
  const ready = useProStore((s) => s.ready);
  const checkSubscriptionStatus = useProStore((s) => s.checkSubscriptionStatus);

  const clientId = useMemo(() => makeClientId(), []);
  const [peerIsPro, setPeerIsPro] = useState<boolean | null>(null);
  const canSyncVibe = Boolean(ready && isPro && peerIsPro);
  const lastAppliedFenRef = useRef<string>("");
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const suppressNextMoveBroadcastRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [peerSeen, setPeerSeen] = useState(false);

  useEffect(() => {
    void checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  useEffect(() => {
    if (!roomId) return;
    const sb = supabase;
    if (!sb) return;

    const channel = sb.channel(`game:${roomId}`, {
      config: { broadcast: { ack: true, self: false } },
    });
    channelRef.current = channel;
    setConnected(false);
    setPeerSeen(false);
    onPresenceChange?.({ connected: false, peerSeen: false, peerIsPro });

    const send = async (payload: MpMsg) => {
      await channel.send({ type: "broadcast", event: "msg", payload });
    };

    channel.on("broadcast", { event: "msg" }, (evt) => {
      const msg = evt.payload as MpMsg;
      if (!msg) return;
      if (msg.t === "hello") {
        if (msg.clientId === clientId) return;
      } else {
        if (msg.from === clientId) return;
      }

      if (msg.t === "hello") {
        setPeerIsPro(Boolean(msg.isPro));
        setPeerSeen(true);
        onPresenceChange?.({ connected: true, peerSeen: true, peerIsPro: Boolean(msg.isPro) });
        const bothPro = Boolean(ready && isPro && msg.isPro);
        // Always answer with the current snapshot so a joiner can sync.
        void send({
          t: "state",
          from: clientId,
          fen,
          moveLog,
          vibe: bothPro ? vibe : undefined,
        });
        return;
      }

      if (msg.t === "state") {
        if (msg.fen && msg.fen !== lastAppliedFenRef.current) {
          lastAppliedFenRef.current = msg.fen;
          loadExternalState({ fen: msg.fen, moveLog: msg.moveLog });
        }
        if (msg.vibe && canSyncVibe) onVibeChange(msg.vibe);
        return;
      }

      if (msg.t === "move") {
        suppressNextMoveBroadcastRef.current = true;
        applyExternalMove(msg.m);
        return;
      }

      if (msg.t === "vibe") {
        if (canSyncVibe) onVibeChange(msg.vibe);
      }
    });

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      setConnected(true);
      onPresenceChange?.({ connected: true, peerSeen, peerIsPro });
      void send({ t: "hello", clientId, isPro: Boolean(ready && isPro) });
    });

    return () => {
      channelRef.current = null;
      setConnected(false);
      setPeerSeen(false);
      onPresenceChange?.({ connected: false, peerSeen: false, peerIsPro: null });
      void sb.removeChannel(channel);
    };
  }, [
    applyExternalMove,
    canSyncVibe,
    clientId,
    fen,
    isPro,
    loadExternalState,
    moveLog,
    onPresenceChange,
    onVibeChange,
    peerIsPro,
    peerSeen,
    ready,
    roomId,
    vibe,
  ]);

  // Broadcast moves by watching FEN changes (single source of truth) and sending the last move from moveLog.
  const lastBroadcastPlyRef = useRef<number>(0);
  useEffect(() => {
    if (!roomId) return;
    if (!supabase) return;
    if (!moveLog.length) return;
    if (suppressNextMoveBroadcastRef.current) {
      suppressNextMoveBroadcastRef.current = false;
      return;
    }
    const last = moveLog[moveLog.length - 1]!;
    if (last.ply <= lastBroadcastPlyRef.current) return;
    lastBroadcastPlyRef.current = last.ply;

    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "msg",
      payload: { t: "move", from: clientId, m: { from: last.from, to: last.to } },
    });
  }, [clientId, moveLog, roomId]);

  useEffect(() => {
    if (!roomId) return;
    if (!supabase) return;
    if (!canSyncVibe) return;
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "msg",
      payload: { t: "vibe", from: clientId, vibe },
    });
  }, [canSyncVibe, clientId, roomId, vibe]);

  return null;
}

