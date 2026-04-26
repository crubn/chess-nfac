"use client";

import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useChessPBR } from "@/components/chess/ChessPBRContext";
import { CARRARA_MARBLE_4K } from "@/lib/pieceTextureUrls";
import type { VibeTheme } from "@/lib/vibeTheme";

type GltfPieceMats = {
  white: THREE.MeshPhysicalMaterial;
  black: THREE.MeshPhysicalMaterial;
};

const Ctx = createContext<GltfPieceMats | null>(null);

function setLinear(t: THREE.Texture) {
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
}

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
    m.envMapIntensity = side === "white" ? 1.45 : 1.68;
    if (side === "white") {
      m.emissive = new THREE.Color("#c9a227");
      m.emissiveIntensity = 0.045;
    } else {
      m.emissive = new THREE.Color(0, 0, 0);
      m.emissiveIntensity = 0;
    }
  }
}

export function GltfPieceMaterialProvider({ children }: { children: ReactNode }) {
  const { vibe } = useChessPBR();
  const [diff, nor, rough, ao] = useTexture([
    CARRARA_MARBLE_4K.map,
    CARRARA_MARBLE_4K.normalMap,
    CARRARA_MARBLE_4K.roughnessMap,
    CARRARA_MARBLE_4K.aoMap,
  ]);

  useLayoutEffect(() => {
    diff.colorSpace = THREE.SRGBColorSpace;
    [nor, rough, ao].forEach(setLinear);
  }, [diff, nor, rough, ao]);

  const mats = useMemo(() => {
    const w = new THREE.MeshPhysicalMaterial({
      map: diff,
      normalMap: nor,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: rough,
      metalness: 0.1,
      roughness: 0.36,
      aoMap: ao,
      aoMapIntensity: 0.78,
      color: new THREE.Color("#fbf7f0"),
      envMapIntensity: 1.45,
      clearcoat: 0.72,
      clearcoatRoughness: 0.08,
    });

    const b = new THREE.MeshPhysicalMaterial({
      map: diff,
      color: new THREE.Color("#100d0a"),
      normalMap: nor,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: rough,
      metalness: 0.9,
      roughness: 0.2,
      aoMap: ao,
      aoMapIntensity: 0.62,
      envMapIntensity: 1.68,
      specularIntensity: 1.25,
      sheen: 0.32,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color("#6b4a2a"),
    });

    tuneForVibe(w, "white", vibe);
    tuneForVibe(b, "black", vibe);
    return { white: w, black: b };
  }, [ao, diff, nor, rough, vibe]);

  return <Ctx.Provider value={mats}>{children}</Ctx.Provider>;
}

export function useGltfPieceMaterials() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGltfPieceMaterials requires GltfPieceMaterialProvider");
  return v;
}
