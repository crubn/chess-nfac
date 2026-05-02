"use client";

import { forwardRef, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getPieceTemplateNodeName, getGltfUrl } from "@/lib/pieceGltfMap";
import { useGltfPieceMaterials } from "@/components/chess/GltfPieceMaterialContext";
import type { PieceState } from "@/lib/chess3d";
import { CELL_SIZE } from "@/lib/chess3d";
import { getMassScaleForPieceType } from "@/lib/pieceMassProfile";

/**
 * Target piece height relative to one board cell.
 */
const TARGET_PIECE_HEIGHT = CELL_SIZE * 0.92;

useGLTF.preload(getGltfUrl());

const warnedMissing = new Set<string>();

function buildProceduralPawn(): THREE.Object3D {
  // Simple pawn silhouette: base + body + head. Materials are overridden upstream.
  const g = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.16, 28));
  base.position.y = 0.08;
  g.add(base);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 14, 28));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.27;
  g.add(collar);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.46, 28));
  body.position.y = 0.16 + 0.23;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 28, 18));
  head.position.y = 0.16 + 0.46 + 0.18;
  g.add(head);

  return g;
}

export const PieceGltfModel = forwardRef<THREE.Object3D, { piece: PieceState }>(function PieceGltfModel(
  { piece },
  ref
) {
  const { white, black } = useGltfPieceMaterials();
  const { nodes } = useGLTF(getGltfUrl());

  const root = useMemo(() => {
    const record = nodes as unknown as Record<string, THREE.Object3D>;
    const name = getPieceTemplateNodeName(piece.type, piece.color);
    const isPawn = piece.type === "p" || name.startsWith("__PAWN__");
    const src = isPawn ? null : (record[name] ?? null);
    if (!src && !isPawn) {
      const key = `${piece.type}:${piece.color}:${name}`;
      if (!warnedMissing.has(key)) {
        warnedMissing.add(key);
        console.warn(`[PieceGltf] missing glTF node: ${name}`);
      }
      return new THREE.Group();
    }

    // Clone the source subtree. Pawns use a procedural fallback because the glTF asset
    // merges all pawn bodies/tops into a single shared mesh, which would render every
    // pawn instance at once if cloned directly.
    const model = src ? (clone(src) as THREE.Object3D) : buildProceduralPawn();

    // Deliberately neutralize glTF-authored root scale so every piece type starts
    // from the same coordinate space before normalization (matches original behaviour).
    model.scale.set(1, 1, 1);
    model.updateMatrixWorld(true);

    // Compute normalization from the model we will actually render.
    const srcBox = new THREE.Box3().setFromObject(model);
    const srcSize = new THREE.Vector3();
    srcBox.getSize(srcSize);
    const safeHeight = Number.isFinite(srcSize.y) && srcSize.y > 1e-6 ? srcSize.y : 1;
    const normalize = TARGET_PIECE_HEIGHT / safeHeight;

    const mass = getMassScaleForPieceType(piece.type);
    // Always scale/position a single group so `.scale.set()` affects the whole model consistently.
    const g = new THREE.Group();
    g.add(model);
    g.scale.set(normalize * mass.xz, normalize * mass.y, normalize * mass.xz);
    g.updateMatrixWorld(true);

    // Align pivot: center in XZ and put base on Y=0 (board surface).
    const b2 = new THREE.Box3().setFromObject(g);
    const center = new THREE.Vector3();
    b2.getCenter(center);
    g.position.set(-center.x, -b2.min.y, -center.z);

    return g;
  }, [nodes, piece.type, piece.color]);

  useLayoutEffect(() => {
    const mat = piece.color === "w" ? white : black;
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.material = Array.isArray(o.material) ? o.material.map(() => mat) : mat;
      }
    });
  }, [root, piece.color, white, black]);

  return <primitive ref={ref} object={root} />;
});

export function setPieceMeshesCastShadow(object: THREE.Object3D | null, cast: boolean) {
  object?.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = cast;
  });
}
