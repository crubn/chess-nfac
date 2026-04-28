"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";

/** Lazy-loaded so the main scene chunk never depends on postprocessing (fewer runtime failures). */
export function ProBloomEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.35} luminanceThreshold={0.15} luminanceSmoothing={0.7} mipmapBlur />
    </EffectComposer>
  );
}
