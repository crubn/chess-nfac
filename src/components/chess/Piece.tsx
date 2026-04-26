"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";
import gsap from "gsap";
import type { Square } from "chess.js";
import { squareToWorld, type PieceState } from "@/lib/chess3d";
import type { VibeTheme } from "@/lib/vibeTheme";
import { PieceGltfModel, setPieceMeshesCastShadow } from "@/components/chess/PieceGltfModel";

type PieceProps = {
  piece: PieceState;
  isSelected: boolean;
  vibe: VibeTheme;
  onSquareClick: (sq: Square) => void;
  onRemove: (id: string) => void;
  onMoveAnimStart?: () => void;
  onMoveAnimEnd?: () => void;
};

function PieceInner({
  piece,
  isSelected,
  vibe,
  onSquareClick,
  onRemove,
  onMoveAnimStart,
  onMoveAnimEnd,
}: PieceProps) {
  const group = useRef<Group>(null);
  const gltfRoot = useRef<THREE.Object3D | null>(null);
  const prevSquare = useRef(piece.square);

  const initRef = useRef(true);
  const [moveSpark, setMoveSpark] = useState(false);
  const [capSpark, setCapSpark] = useState(false);
  const prevCap = useRef(false);

  const onPick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSquareClick(piece.square);
    },
    [onSquareClick, piece.square]
  );

  useEffect(() => {
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    setMoveSpark(true);
    const t = window.setTimeout(() => setMoveSpark(false), 450);
    return () => clearTimeout(t);
  }, [piece.square]);

  useEffect(() => {
    if (piece.captured && !prevCap.current) {
      setCapSpark(true);
      const t = window.setTimeout(() => setCapSpark(false), 650);
      prevCap.current = true;
      return () => clearTimeout(t);
    }
    if (!piece.captured) prevCap.current = false;
  }, [piece.captured]);

  useEffect(() => {
    if (!group.current) return;
    const { x, z } = squareToWorld(piece.square);

    if (!group.current.userData._mounted) {
      group.current.position.set(x, 0, z);
      group.current.userData._mounted = true;
      prevSquare.current = piece.square;
      return;
    }

    if (prevSquare.current === piece.square) return;
    prevSquare.current = piece.square;

    const g = group.current;
    gsap.killTweensOf(g.position);
    setPieceMeshesCastShadow(gltfRoot.current, true);
    setPieceMeshesCastShadow(gltfRoot.current, false);

    onMoveAnimStart?.();

    const gltf = gltfRoot.current;
    const tl = gsap.timeline({
      onComplete: () => {
        setPieceMeshesCastShadow(gltf, true);
        onMoveAnimEnd?.();
      },
    });
    tl.to(g.position, { duration: 0.16, y: 0.28, ease: "power2.out" }, 0);
    tl.to(g.position, { duration: 0.32, x, z, ease: "power2.inOut" }, 0);
    tl.to(g.position, { duration: 0.18, y: 0, ease: "power2.in" }, 0.18);

    return () => {
      if (gsap.isTweening(g.position)) {
        gsap.killTweensOf(g.position);
        setPieceMeshesCastShadow(gltf, true);
        onMoveAnimEnd?.();
      }
    };
  }, [onMoveAnimEnd, onMoveAnimStart, piece.square]);

  useEffect(() => {
    if (!group.current) return;
    const g = group.current;
    gsap.killTweensOf(g.scale);
    gsap.to(g.scale, {
      x: isSelected ? 1.08 : 1,
      y: isSelected ? 1.08 : 1,
      z: isSelected ? 1.08 : 1,
      duration: 0.12,
      ease: "power2.out",
    });
  }, [isSelected]);

  useEffect(() => {
    if (!group.current) return;
    if (!piece.captured) return;
    const g = group.current;
    gsap.killTweensOf(g.scale);
    gsap.to(g.scale, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => onRemove(piece.id),
    });
  }, [onRemove, piece.captured, piece.id]);

  const moveColor =
    vibe === "cyberpunk" ? "#40f6ff" : vibe === "glass" ? "#a5b4fc" : "#7dd3fc";
  const sparkN = vibe === "cyberpunk" ? 50 : vibe === "glass" ? 40 : 35;

  return (
    <group ref={group} onClick={onPick}>
      {vibe === "cyberpunk" && <pointLight position={[0, 0.35, 0]} color="#e879f9" intensity={0.55} distance={1.8} decay={2} />}
      {vibe === "cyberpunk" && <pointLight position={[0, 0.1, 0.15]} color="#22d3ee" intensity={0.45} distance={1.4} />}

      {moveSpark && !piece.captured && (
        <Sparkles
          count={sparkN}
          position={[0, 0.1, 0]}
          scale={0.5}
          size={vibe === "cyberpunk" ? 2.2 : 1.4}
          speed={2.2}
          opacity={0.65}
          color={moveColor}
        />
      )}

      {capSpark && (
        <Sparkles
          count={80}
          position={[0, 0.15, 0]}
          scale={0.7}
          size={2.5}
          speed={3}
          opacity={0.85}
          color={vibe === "cyberpunk" ? "#ff0aa8" : "#fb7185"}
        />
      )}

      <PieceGltfModel ref={gltfRoot} piece={piece} key={`${piece.type}-${piece.color}`} />
    </group>
  );
}

function piecesEqual(a: PieceProps, b: PieceProps) {
  return (
    a.piece.id === b.piece.id &&
    a.piece.square === b.piece.square &&
    a.piece.type === b.piece.type &&
    a.piece.color === b.piece.color &&
    a.piece.captured === b.piece.captured &&
    a.isSelected === b.isSelected &&
    a.vibe === b.vibe &&
    a.onSquareClick === b.onSquareClick &&
    a.onRemove === b.onRemove &&
    a.onMoveAnimStart === b.onMoveAnimStart &&
    a.onMoveAnimEnd === b.onMoveAnimEnd
  );
}

export const Piece = memo(PieceInner, piecesEqual);
