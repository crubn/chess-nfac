"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { VibeTheme } from "@/lib/vibeTheme";

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uGridScale;

void main() {
  vec2 g = vUv * uGridScale;
  vec2 fr = abs(fract(g) - 0.5);
  float gx = 1.0 - smoothstep(0.0, 0.09, fr.x);
  float gy = 1.0 - smoothstep(0.0, 0.09, fr.y);
  float line = max(gx, gy);
  line = pow(line, 0.6);

  float pulse = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 2.8 + vUv.x * 3.0 + vUv.y * 2.0));
  float d = length((vUv - 0.5) * 2.0);
  float ring = 1.0 - smoothstep(0.42, 0.58, d);

  vec3 mixCol = mix(uColor1, uColor2, 0.5 + 0.5 * sin(uTime * 1.0));
  float alpha = line * 0.6 * pulse;
  vec3 outRgb = mixCol * (0.5 + 0.5 * line) * (0.35 + 0.65 * pulse) + mixCol * ring * 0.5;
  alpha = clamp(alpha + ring * 0.38, 0.0, 1.0);
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(outRgb, alpha * 0.95);
}
`;

function colorsForVibe(vibe: VibeTheme): { c1: string; c2: string; scale: number } {
  switch (vibe) {
    case "cyberpunk":
      return { c1: "#9333ff", c2: "#00d1ff", scale: 18 };
    case "glass":
      return { c1: "#6366f1", c2: "#a78bfa", scale: 12 };
    default:
      return { c1: "#15803d", c2: "#4ade80", scale: 14 };
  }
}

type Props = {
  vibe: VibeTheme;
  onClick: () => void;
};

/** Additive grid + inner ring, local UV per cell */
export function NeonGridOverlay({ vibe, onClick }: Props) {
  const { c1, c2, scale } = useMemo(() => colorsForVibe(vibe), [vibe]);

  const geom = useMemo(() => new THREE.PlaneGeometry(0.92, 0.92, 1, 1), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color(c1) },
          uColor2: { value: new THREE.Color(c2) },
          uGridScale: { value: scale },
        },
      }),
    [c1, c2, scale]
  );

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      onClick={(e) => (e.stopPropagation(), onClick())}
      position={[0, 0.084, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={mat}
      geometry={geom}
    >
    </mesh>
  );
}

export function UnderGlowDisc({
  vibe,
  onClick,
  emissiveColor,
  emissiveIntensity = 0.3,
}: {
  vibe: VibeTheme;
  onClick: () => void;
  emissiveColor: string;
  emissiveIntensity?: number;
}) {
  return (
    <mesh
      onClick={(e) => (e.stopPropagation(), onClick())}
      position={[0, 0.077, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[0.42, 40]} />
      <meshStandardMaterial
        color="#0a0a0a"
        emissive={emissiveColor}
        emissiveIntensity={vibe === "cyberpunk" ? 0.55 * emissiveIntensity * 1.2 : emissiveIntensity}
        transparent
        opacity={vibe === "glass" ? 0.2 : 0.35}
        roughness={0.2}
        metalness={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}
