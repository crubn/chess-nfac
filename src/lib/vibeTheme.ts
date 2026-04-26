export type VibeTheme = "standard" | "cyberpunk" | "glass";

/** Environment presets for drei's `<Environment preset />` */
export const VIBE_ENV: Record<VibeTheme, "studio" | "city" | "night"> = {
  standard: "studio",
  cyberpunk: "night",
  glass: "city",
};

export type VibeScene = {
  background: string;
  fog: [string, number, number];
  toneExposure: number;
  ambient: { intensity: number; color: string };
  hemisphere: { intensity: number; sky: string; ground: string };
  point: { intensity: number; color: string; position: [number, number, number] };
  spot: { intensity: number; color: string; position: [number, number, number] };
  floor: string;
  floorMetal: number;
  floorRough: number;
  contactOpacity: number;
  contactBlur: number;
  highlight: { color: string; emissive: string; emissiveIntensity: number; opacity: number };
  trim: { color: string; metalness: number; roughness: number; envIntensity: number };
};

export function getVibeScene(v: VibeTheme): VibeScene {
  switch (v) {
    case "cyberpunk":
      return {
        background: "#05030a",
        fog: ["#0a0614", 10, 44],
        toneExposure: 1.15,
        ambient: { intensity: 0.14, color: "#4f46ff" },
        hemisphere: { intensity: 0.26, sky: "#2d0a4a", ground: "#020008" },
        point: { intensity: 1.8, color: "#00d9ff", position: [4.2, 4.5, -5.5] },
        spot: { intensity: 2.7, color: "#ff2fb3", position: [5.5, 10, 4.5] },
        floor: "#08040c",
        floorMetal: 0.35,
        floorRough: 0.45,
        contactOpacity: 0.72,
        contactBlur: 1.6,
        highlight: { color: "#00e5ff", emissive: "#00d4ff", emissiveIntensity: 0.95, opacity: 0.9 },
        trim: { color: "#3de8ff", metalness: 0.95, roughness: 0.18, envIntensity: 1.7 },
      };
    case "glass":
      return {
        background: "#0c1118",
        fog: ["#0e141d", 16, 48],
        toneExposure: 0.98,
        ambient: { intensity: 0.32, color: "#dbe7f5" },
        hemisphere: { intensity: 0.28, sky: "#e8f0fa", ground: "#1a2330" },
        point: { intensity: 0.75, color: "#a8c8ff", position: [-4, 6, 3] },
        spot: { intensity: 1.85, color: "#f5f9ff", position: [6, 9, 5] },
        floor: "#1a2432",
        floorMetal: 0.12,
        floorRough: 0.25,
        contactOpacity: 0.45,
        contactBlur: 2.9,
        highlight: { color: "#6366f1", emissive: "#a5b4fc", emissiveIntensity: 0.45, opacity: 0.75 },
        trim: { color: "#c7d2e3", metalness: 0.55, roughness: 0.12, envIntensity: 1.8 },
      };
    default:
      return {
        background: "#07090E",
        fog: ["#07090E", 14, 38],
        toneExposure: 1.05,
        ambient: { intensity: 0.22, color: "#E8EDF5" },
        hemisphere: { intensity: 0.18, sky: "#F0F4FF", ground: "#1a1410" },
        point: { intensity: 1.05, color: "#FFE8D0", position: [-5.5, 5.2, -4.2] },
        spot: { intensity: 2.35, color: "#FFF5EB", position: [6.2, 9.5, 5.8] },
        floor: "#0B0E14",
        floorMetal: 0.05,
        floorRough: 0.95,
        contactOpacity: 0.64,
        contactBlur: 2.5,
        highlight: { color: "#16A34A", emissive: "#22C55E", emissiveIntensity: 0.55, opacity: 0.88 },
        trim: { color: "#C9A227", metalness: 1, roughness: 0.22, envIntensity: 1.45 },
      };
  }
}
