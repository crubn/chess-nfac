"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useChessPBR } from "@/components/chess/ChessPBRContext";
import type { VibeTheme } from "@/lib/vibeTheme";

type GltfPieceMats = {
  white: THREE.MeshPhysicalMaterial;
  black: THREE.MeshPhysicalMaterial;
};

const Ctx = createContext<GltfPieceMats | null>(null);

function tuneForVibe(m: THREE.MeshPhysicalMaterial, side: "white" | "black", v: VibeTheme) {
  if (v === "cyberpunk") {
    m.envMapIntensity = side === "white" ? 1.45 : 1.58;
    m.clearcoat = side === "white" ? 0.55 : 0.4;
    if (side === "white") {
      m.emissive = new THREE.Color("#6b21a8");
      m.emissiveIntensity = 0.1;
    } else {
      m.emissive = new THREE.Color("#002244");
      m.emissiveIntensity = 0.15;
    }
  } else if (v === "glass") {
    m.envMapIntensity = side === "white" ? 1.5 : 1.6;
    m.transmission = side === "white" ? 0.35 : 0.28;
    m.thickness = 0.45;
    m.roughness = 0.12;
    m.clearcoat = 0.55;
  } else {
    m.envMapIntensity = side === "white" ? 1.3 : 1.5;
    if (side === "white") {
      m.emissive = new THREE.Color("#c9a227");
      m.emissiveIntensity = 0.04;
    }
  }
}

export function GltfPieceMaterialProvider({ children }: { children: ReactNode }) {
  const { vibe } = useChessPBR();

  const mats = useMemo(() => {
    // White: polished ivory / alabaster — no texture, clean clearcoat finish
    const w = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f8f1e4"),
      metalness: 0.0,
      roughness: 0.18,
      envMapIntensity: 1.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
    });

    // Black: polished ebony — dark wood, not metallic
    const b = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#1a1008"),
      metalness: 0.05,
      roughness: 0.22,
      envMapIntensity: 1.5,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06,
    });

    tuneForVibe(w, "white", vibe);
    tuneForVibe(b, "black", vibe);
    return { white: w, black: b };
  }, [vibe]);

  return <Ctx.Provider value={mats}>{children}</Ctx.Provider>;
}

export function useGltfPieceMaterials() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGltfPieceMaterials requires GltfPieceMaterialProvider");
  return v;
}
