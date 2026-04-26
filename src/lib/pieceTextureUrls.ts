/**
 * 4K PBR textures (Poly Haven CDN) — see https://polyhaven.com/ — CC0.
 * Reliable pattern: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/{1k|2k|4k}/{slug}/{slug}_{map}_4k.jpg`
 * Map names: `diff` (albedo), `nor_gl` (OpenGL normal), `rough` (roughness in grayscale), `ao` (occlusion, linear).
 * Alternatives: ambientCG, ShareTextures — host files in `/public` if CORS/availability changes.
 */
const PH4 = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k";

/** Carrara-style white marble — used for albedo + normal + microsurface on white pieces */
export const CARRARA_MARBLE_4K = {
  map: `${PH4}/marble_01/marble_01_diff_4k.jpg`,
  normalMap: `${PH4}/marble_01/marble_01_nor_gl_4k.jpg`,
  roughnessMap: `${PH4}/marble_01/marble_01_rough_4k.jpg`,
  aoMap: `${PH4}/marble_01/marble_01_ao_4k.jpg`,
} as const;
