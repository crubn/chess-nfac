"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { Suspense } from "react";

function MeshGold() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.4;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} scale={1.15} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshPhysicalMaterial
        color="#1a1008"
        metalness={0.9}
        roughness={0.2}
        clearcoat={0.6}
        clearcoatRoughness={0.15}
        emissive="#2a1b08"
        emissiveIntensity={0.2}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

export function OrderTrophy3D() {
  return (
    <div className="h-56 w-full sm:h-72">
      <Canvas
        className="rounded-2xl"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.4], fov: 40 }}
        gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={["#07050c"]} />
        <ambientLight intensity={0.2} />
        <spotLight position={[3, 4, 2]} intensity={1.1} color="#ffefd5" />
        <pointLight position={[-2, 0.5, 2]} color="#C9A227" intensity={0.8} />
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <MeshGold />
          <OrbitControls enableZoom={false} maxPolarAngle={1.2} minPolarAngle={0.3} autoRotate autoRotateSpeed={0.2} />
        </Suspense>
      </Canvas>
    </div>
  );
}
