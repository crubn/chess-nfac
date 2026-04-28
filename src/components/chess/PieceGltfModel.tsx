"use client";

import { forwardRef, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getPieceTemplateNodeName, GLTF_URL } from "@/lib/pieceGltfMap";
import { getMassScaleForPieceType } from "@/lib/pieceMassProfile";
import { useGltfPieceMaterials } from "@/components/chess/GltfPieceMaterialContext";
import type { PieceState } from "@/lib/chess3d";

/** Scaled to sit on the board; ~same footprint as the previous primitive pieces */
const TARGET_PIECE_HEIGHT = 0.82;
const MIN_BOUNDS_DIM = 1e-3;
const MAX_SCALE = 5;

useGLTF.preload(GLTF_URL);

export const PieceGltfModel = forwardRef<THREE.Object3D, { piece: PieceState }>(function PieceGltfModel(
  { piece },
  ref
) {
  const { white, black } = useGltfPieceMaterials();
  const { nodes } = useGLTF(GLTF_URL);

  const root = useMemo(() => {
    const name = getPieceTemplateNodeName(piece.type, piece.color);
    const record = nodes as unknown as Record<string, THREE.Object3D>;
    const src = record[name];
    if (!src) {
      console.warn(`[PieceGltf] missing glTF node: ${name}`);
      return new THREE.Group();
    }
    const c = clone(src) as THREE.Object3D;
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    // Some glTF nodes can yield near-zero bounds (e.g. empty transforms), which would explode scale.
    // Scale primarily by height so pieces visually match board proportions.
    const height = Math.max(size.y, MIN_BOUNDS_DIM);
    const raw = TARGET_PIECE_HEIGHT / height;
    const s = THREE.MathUtils.clamp(raw, 0.01, MAX_SCALE);
    const mass = getMassScaleForPieceType(piece.type);
    c.scale.set(s * mass.xz, s * mass.y, s * mass.xz);
    c.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(c);
    const center = new THREE.Vector3();
    b2.getCenter(center);
    c.position.set(-center.x, -b2.min.y, -center.z);
    return c;
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
