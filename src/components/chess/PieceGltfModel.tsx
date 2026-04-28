"use client";

import { forwardRef, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getPieceTemplateNodeName, getGltfUrl } from "@/lib/pieceGltfMap";
import { getMassScaleForPieceType } from "@/lib/pieceMassProfile";
import { useGltfPieceMaterials } from "@/components/chess/GltfPieceMaterialContext";
import { CELL_SIZE, type PieceState } from "@/lib/chess3d";

/** Scaled to sit on the board; pieces should fit comfortably within a cell */
const TARGET_PIECE_HEIGHT = CELL_SIZE * 0.55;
const TARGET_PIECE_FOOTPRINT = CELL_SIZE * 0.38; // max(x,z) must fit comfortably within a cell
const MIN_BOUNDS_DIM = 1e-3;
const MAX_SCALE = 5;

useGLTF.preload(getGltfUrl());

function computeMeshWorldBounds(root: THREE.Object3D): THREE.Box3 | null {
  root.updateMatrixWorld(true);
  const out = new THREE.Box3();
  let any = false;
  const tmp = new THREE.Box3();

  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const geom = o.geometry;
    if (!geom) return;
    if (!geom.boundingBox) geom.computeBoundingBox();
    if (!geom.boundingBox) return;
    tmp.copy(geom.boundingBox).applyMatrix4(o.matrixWorld);
    if (!any) {
      out.copy(tmp);
      any = true;
    } else {
      out.union(tmp);
    }
  });

  return any ? out : null;
}

export const PieceGltfModel = forwardRef<THREE.Object3D, { piece: PieceState }>(function PieceGltfModel(
  { piece },
  ref
) {
  const { white, black } = useGltfPieceMaterials();
  const { nodes } = useGLTF(getGltfUrl());

  const root = useMemo(() => {
    const name = getPieceTemplateNodeName(piece.type, piece.color);
    const record = nodes as unknown as Record<string, THREE.Object3D>;
    const src = record[name];
    if (!src) {
      console.warn(`[PieceGltf] missing glTF node: ${name}`);
      return new THREE.Group();
    }
    const c = clone(src) as THREE.Object3D;
    const box = computeMeshWorldBounds(c) ?? new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const mass = getMassScaleForPieceType(piece.type);
    // Robust single-pass scale:
    // - Prevents "exploding" scale when bounds are near-zero.
    // - Maximizes size while ensuring the piece fits within one cell (footprint) and has a sane height.
    const height = Math.max(size.y, MIN_BOUNDS_DIM);
    const footprint = Math.max(size.x, size.z, MIN_BOUNDS_DIM);
    const sByHeight = TARGET_PIECE_HEIGHT / (height * Math.max(mass.y, 1e-6));
    const sByFootprint = TARGET_PIECE_FOOTPRINT / (footprint * Math.max(mass.xz, 1e-6));
    const rawS = Math.min(sByHeight, sByFootprint);
    const s = THREE.MathUtils.clamp(rawS, 0.01, MAX_SCALE);
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
