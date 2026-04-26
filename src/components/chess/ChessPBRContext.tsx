"use client";

import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { MARBLE_LIKE, MICRO_GRAIN, WOOD_DARK } from "@/components/chess/pbrTextureUrls";
import type { VibeTheme } from "@/lib/vibeTheme";

export type ChessPBRValue = {
  vibe: VibeTheme;
  createMarbleCellMaterial: (file: number, rank: number) => THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  createWoodCellMaterial: (file: number, rank: number) => THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
};

const ChessPBRContext = createContext<ChessPBRValue | null>(null);

export function useChessPBR() {
  const v = useContext(ChessPBRContext);
  if (!v) throw new Error("useChessPBR must be used inside ChessPBRProvider");
  return v;
}

function cloneMap(
  src: THREE.Texture,
  repeat: number,
  offsetU: number,
  offsetV: number
): THREE.Texture {
  const t = src.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.offset.set(offsetU, offsetV);
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function setLinear(...textures: THREE.Texture[]) {
  for (const t of textures) {
    t.colorSpace = THREE.LinearSRGBColorSpace;
    t.needsUpdate = true;
  }
}

function tuneMarbleCell(m: THREE.MeshStandardMaterial, vibe: VibeTheme) {
  if (vibe === "cyberpunk") {
    m.color.lerp(new THREE.Color("#7c9aff"), 0.38);
    m.emissive = new THREE.Color("#1a0a3a");
    m.emissiveIntensity = 0.2;
    m.metalness = 0.28;
    m.envMapIntensity = 1.8;
  } else if (vibe === "glass") {
    m.roughness = 0.42;
    m.metalness = 0.2;
    m.envMapIntensity = 1.65;
    m.color.lerp(new THREE.Color("#eef4ff"), 0.2);
  }
}

function tuneWoodCell(m: THREE.MeshStandardMaterial, vibe: VibeTheme) {
  if (vibe === "cyberpunk") {
    m.color.lerp(new THREE.Color("#2d0a4a"), 0.5);
    m.emissive = new THREE.Color("#300030");
    m.emissiveIntensity = 0.22;
    m.metalness = 0.45;
    m.envMapIntensity = 2;
  } else if (vibe === "glass") {
    m.roughness = 0.28;
    m.metalness = 0.28;
    m.envMapIntensity = 1.6;
    m.color.lerp(new THREE.Color("#2a2520"), 0.2);
  }
}

export function ChessPBRProvider({
  children,
  vibe = "standard",
}: {
  children: ReactNode;
  vibe?: VibeTheme;
}) {
  const marbleMaps = useTexture([MARBLE_LIKE.map, MARBLE_LIKE.normalMap, MARBLE_LIKE.roughnessMap]);
  const woodMaps = useTexture([WOOD_DARK.map, WOOD_DARK.bumpMap, WOOD_DARK.roughnessMap]);
  const [microGrain] = useTexture([MICRO_GRAIN]);

  const [marbleDiff, marbleNor, marbleRough] = marbleMaps as unknown as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];
  const [woodDiff, woodBump, woodRough] = woodMaps as unknown as [THREE.Texture, THREE.Texture, THREE.Texture];

  useLayoutEffect(() => {
    setLinear(marbleNor, marbleRough, woodBump, woodRough, microGrain);
  }, [marbleNor, marbleRough, woodBump, woodRough, microGrain]);

  const value = useMemo<ChessPBRValue>(() => {
    const createMarbleCellMaterial = (file: number, rank: number) => {
      const r = 0.38;
      const ou = (file * 0.17 + rank * 0.03) % 1;
      const ov = (rank * 0.17 + file * 0.05) % 1;
      if (vibe === "glass") {
        const phys = new THREE.MeshPhysicalMaterial({
          map: cloneMap(marbleDiff, r, ou, ov),
          normalMap: cloneMap(marbleNor, r, ou, ov),
          roughnessMap: cloneMap(marbleRough, r, ou, ov),
          bumpMap: cloneMap(microGrain, 5.2, ou * 2.7, ov * 2.7),
          bumpScale: 0.02,
          color: new THREE.Color("#f0f4fc"),
          roughness: 0.18,
          metalness: 0.04,
          transmission: 0.8,
          thickness: 0.9,
          ior: 1.47,
          transparent: true,
          clearcoat: 0.55,
          clearcoatRoughness: 0.1,
          envMapIntensity: 2,
        });
        return phys;
      }
      const m = new THREE.MeshStandardMaterial({
        map: cloneMap(marbleDiff, r, ou, ov),
        normalMap: cloneMap(marbleNor, r, ou, ov),
        roughnessMap: cloneMap(marbleRough, r, ou, ov),
        bumpMap: cloneMap(microGrain, 5.2, ou * 2.7, ov * 2.7),
        bumpScale: 0.018,
        color: new THREE.Color("#FFF9F2"),
        roughness: 1,
        metalness: 0.06,
        envMapIntensity: 1.25,
      });
      tuneMarbleCell(m, vibe);
      return m;
    };

    const createWoodCellMaterial = (file: number, rank: number) => {
      const r = 0.9;
      const ou = (file * 0.11 + rank * 0.07) % 1;
      const ov = (rank * 0.11 + file * 0.09) % 1;
      if (vibe === "glass") {
        return new THREE.MeshPhysicalMaterial({
          map: cloneMap(woodDiff, r, ou, ov),
          bumpMap: cloneMap(woodBump, r, ou, ov),
          bumpScale: 0.05,
          roughnessMap: cloneMap(woodRough, r, ou, ov),
          normalMap: cloneMap(microGrain, 6.5, ou * 3.1, ov * 3.1),
          normalScale: new THREE.Vector2(0.2, 0.2),
          color: new THREE.Color("#1a1210"),
          roughness: 0.2,
          metalness: 0.06,
          transmission: 0.7,
          thickness: 0.7,
          ior: 1.48,
          transparent: true,
          clearcoat: 0.4,
          clearcoatRoughness: 0.12,
          envMapIntensity: 1.85,
        });
      }
      const m = new THREE.MeshStandardMaterial({
        map: cloneMap(woodDiff, r, ou, ov),
        bumpMap: cloneMap(woodBump, r, ou, ov),
        bumpScale: 0.055,
        roughnessMap: cloneMap(woodRough, r, ou, ov),
        normalMap: cloneMap(microGrain, 6.5, ou * 3.1, ov * 3.1),
        normalScale: new THREE.Vector2(0.18, 0.18),
        color: new THREE.Color("#1f1711"),
        roughness: 1,
        metalness: 0.18,
        envMapIntensity: 1.45,
      });
      tuneWoodCell(m, vibe);
      return m;
    };

    return {
      vibe,
      createMarbleCellMaterial,
      createWoodCellMaterial,
    };
  }, [marbleDiff, marbleNor, marbleRough, woodDiff, woodBump, woodRough, microGrain, vibe]);

  return <ChessPBRContext.Provider value={value}>{children}</ChessPBRContext.Provider>;
}
