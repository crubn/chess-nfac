/**
 * High-res PBR-friendly textures shipped with three.js examples (stable raw GitHub URLs).
 * - Light squares: ambientCG Ice (crystalline / marble-like veining when warm-tinted)
 * - Dark squares: hardwood2 PBR set (deep wood grain + gloss variation)
 */
const THREEJS = "https://raw.githubusercontent.com/mrdoob/three.js/r164/examples/textures";

export const MARBLE_LIKE = {
  map: `${THREEJS}/ambientcg/Ice002_1K-JPG_Color.jpg`,
  normalMap: `${THREEJS}/ambientcg/Ice002_1K-JPG_NormalGL.jpg`,
  roughnessMap: `${THREEJS}/ambientcg/Ice002_1K-JPG_Roughness.jpg`,
} as const;

export const WOOD_DARK = {
  map: `${THREEJS}/hardwood2_diffuse.jpg`,
  bumpMap: `${THREEJS}/hardwood2_bump.jpg`,
  roughnessMap: `${THREEJS}/hardwood2_roughness.jpg`,
} as const;

export const MICRO_GRAIN = `${THREEJS}/disturb.jpg`;
