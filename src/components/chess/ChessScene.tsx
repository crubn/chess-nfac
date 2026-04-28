"use client";

import dynamic from "next/dynamic";
import { memo, Suspense, useLayoutEffect, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { AdaptiveDpr, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { Square } from "chess.js";
import { CELL_SIZE, fileRankToSquare, isDarkSquare, squareToWorld } from "@/lib/chess3d";
import { useChessGame } from "@/lib/useChessGame";
import { Piece } from "@/components/chess/Piece";
import { ChessPBRProvider, useChessPBR } from "@/components/chess/ChessPBRContext";
import { GltfPieceMaterialProvider } from "@/components/chess/GltfPieceMaterialContext";
import { getVibeScene, VIBE_ENV, type VibeScene, type VibeTheme } from "@/lib/vibeTheme";
import { NeonGridOverlay, UnderGlowDisc } from "@/components/chess/validMove/NeonGridOverlay";
import { useProStore } from "@/lib/pro/proStore";

const ProBloomEffects = dynamic(
  () => import("./ProBloomEffects").then((m) => m.ProBloomEffects),
  { ssr: false, loading: () => null }
);

function squareToFileRank(square: Square) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]) - 1;
  return { file, rank };
}

const BOARD_CELLS = (() => {
  const out: Square[] = [];
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) out.push(fileRankToSquare(file, rank));
  }
  return out;
})();

type BoardProps = {
  legalTargets: Set<Square>;
  onSquareClick: (sq: Square) => void;
  highlight: VibeScene["highlight"];
  vibe: VibeTheme;
  /** Hide green/neon legal move overlays (UnderGlow + grid) */
  hideLegalOverlays: boolean;
};

function BoardInner({ legalTargets, onSquareClick, highlight, vibe, hideLegalOverlays }: BoardProps) {
  const pbr = useChessPBR();
  const cellBox = useMemo(
    () => new THREE.BoxGeometry(CELL_SIZE, 0.16, CELL_SIZE),
    []
  );

  useEffect(
    () => () => {
      cellBox.dispose();
    },
    [cellBox]
  );

  const materialsBySquare = useMemo(() => {
    const map = new Map<Square, THREE.Material>();
    for (const sq of BOARD_CELLS) {
      const { file, rank } = squareToFileRank(sq);
      const dark = isDarkSquare(sq);
      map.set(
        sq,
        dark ? pbr.createWoodCellMaterial(file, rank) : pbr.createMarbleCellMaterial(file, rank)
      );
    }
    return map;
  }, [pbr]);

  return (
    <group>
      {BOARD_CELLS.map((sq) => {
        const { x, z } = squareToWorld(sq);
        const isHL = !hideLegalOverlays && legalTargets.has(sq);
        const mat = materialsBySquare.get(sq)!;

        return (
          <group key={sq} position={[x, 0, z]}>
            <mesh
              receiveShadow
              onClick={(e) => (e.stopPropagation(), onSquareClick(sq))}
              position={[0, -0.08, 0]}
              material={mat}
              geometry={cellBox}
            />

            {isHL && (
              <>
                <UnderGlowDisc
                  vibe={vibe}
                  onClick={() => onSquareClick(sq)}
                  emissiveColor={highlight.emissive}
                  emissiveIntensity={highlight.emissiveIntensity * 0.5}
                />
                <NeonGridOverlay vibe={vibe} onClick={() => onSquareClick(sq)} />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

const Board = memo(BoardInner, (a, b) => {
  return (
    a.vibe === b.vibe &&
    a.legalTargets === b.legalTargets &&
    a.onSquareClick === b.onSquareClick &&
    a.hideLegalOverlays === b.hideLegalOverlays &&
    a.highlight.emissive === b.highlight.emissive &&
    a.highlight.emissiveIntensity === b.highlight.emissiveIntensity
  );
});

function BoardGoldTrim({ trim }: { trim: VibeScene["trim"] }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(trim.color),
        metalness: trim.metalness,
        roughness: trim.roughness,
        envMapIntensity: trim.envIntensity,
      }),
    [trim.color, trim.metalness, trim.roughness, trim.envIntensity]
  );

  const half = (8 * CELL_SIZE) / 2;
  const pad = 0.14;
  const thickness = 0.07;
  const height = 0.045;
  const y = 0.018;

  const outer = half + pad;
  const long = 8 * CELL_SIZE + pad * 2;
  const short = thickness;

  return (
    <group>
      <mesh position={[0, y, outer + short / 2]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[long, height, short]} />
      </mesh>
      <mesh position={[0, y, -outer - short / 2]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[long, height, short]} />
      </mesh>
      <mesh position={[outer + short / 2, y, 0]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[short, height, long]} />
      </mesh>
      <mesh position={[-outer - short / 2, y, 0]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[short, height, long]} />
      </mesh>
    </group>
  );
}

function SceneContents({ vibe }: { vibe: VibeTheme }) {
  const { pieces, selectedPieceId, legalTargets, onSquareClick, removePiece } = useChessGame();
  const [hideLegalOverlays, setHideLegalOverlays] = useState(false);
  const isPro = useProStore((s2) => s2.isPro);
  const onMoveAnimStart = useCallback(() => {
    setHideLegalOverlays(true);
  }, []);
  const onMoveAnimEnd = useCallback(() => {
    setHideLegalOverlays(false);
  }, []);
  const spotRef = useRef<THREE.SpotLight>(null);
  const s = useMemo(() => getVibeScene(vibe), [vibe]);

  useLayoutEffect(() => {
    const l = spotRef.current;
    if (!l?.shadow) return;
    (l.shadow as THREE.SpotLightShadow).radius = 12;
  }, []);

  return (
    <>
      <AdaptiveDpr />
      <color attach="background" args={[s.background]} />
      <fog attach="fog" args={s.fog} />

      {isPro && <ProBloomEffects />}

      <ambientLight intensity={s.ambient.intensity} color={s.ambient.color} />
      <hemisphereLight
        intensity={s.hemisphere.intensity}
        color={s.hemisphere.sky}
        groundColor={s.hemisphere.ground}
      />

      <pointLight
        position={s.point.position}
        intensity={s.point.intensity}
        color={s.point.color}
        distance={40}
        decay={2}
      />

      <spotLight
        ref={spotRef}
        position={s.spot.position}
        angle={0.38}
        penumbra={0.65}
        intensity={s.spot.intensity}
        color={s.spot.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00015}
      >
        <object3D position={[0, 0.05, 0]} attach="target" />
      </spotLight>

      <Environment preset={VIBE_ENV[vibe]} background={false} />

      {vibe === "cyberpunk" && (
        <group>
          <pointLight position={[-1.2, 2.1, 3.5]} color="#ff2fd8" intensity={1.45} distance={12} decay={2} />
          <pointLight position={[3.8, 1.2, -2.4]} color="#2af6ff" intensity={1.35} distance={12} decay={2} />
          <pointLight position={[0, 5.2, 0.5]} color="#b366ff" intensity={0.65} distance={18} decay={2} />
        </group>
      )}

      {vibe === "glass" && <pointLight position={[-1, 3.2, 2]} color="#dbeafe" intensity={0.5} distance={20} />}

      <Board
        legalTargets={legalTargets}
        onSquareClick={onSquareClick}
        highlight={s.highlight}
        vibe={vibe}
        hideLegalOverlays={hideLegalOverlays}
      />
      <BoardGoldTrim trim={s.trim} />

      {pieces.map((p) => (
        <Piece
          key={p.id}
          piece={p}
          vibe={vibe}
          isSelected={p.id === selectedPieceId}
          onSquareClick={onSquareClick}
          onRemove={removePiece}
          onMoveAnimStart={onMoveAnimStart}
          onMoveAnimEnd={onMoveAnimEnd}
        />
      ))}

      <ContactShadows
        position={[0, -0.078, 0]}
        opacity={s.contactOpacity}
        scale={14}
        blur={s.contactBlur}
        far={3.2}
        resolution={512}
        color="#000000"
      />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color={s.floor}
          roughness={s.floorRough}
          metalness={s.floorMetal}
        />
      </mesh>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.22}
        minDistance={5}
        maxDistance={13}
        target={[0, 0.05, 0]}
      />
    </>
  );
}

function SceneWithPBR({ vibe }: { vibe: VibeTheme }) {
  return (
    <ChessPBRProvider vibe={vibe}>
      <GltfPieceMaterialProvider>
        <SceneContents vibe={vibe} />
      </GltfPieceMaterialProvider>
    </ChessPBRProvider>
  );
}

export function ChessScene({ vibe = "standard" }: { vibe?: VibeTheme }) {
  const s = getVibeScene(vibe);
  return (
    <Canvas
      shadows
      className="absolute inset-0 h-full w-full"
      camera={{ position: [7.2, 6.8, 7.2], fov: 42, near: 0.1, far: 120 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: s.toneExposure,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <Suspense fallback={null}>
        <SceneWithPBR vibe={vibe} />
      </Suspense>
    </Canvas>
  );
}
