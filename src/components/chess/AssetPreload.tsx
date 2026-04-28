"use client";

import { useEffect } from "react";
import { GLTF_URL } from "@/lib/pieceGltfMap";

const links = [
  { href: GLTF_URL, as: "fetch", crossOrigin: "anonymous" as const },
  { href: "/hdri/studio_small_03_1k.hdr", as: "image" as const },
  { href: "/chess-textures/marble_01/marble_01_diff_1k.jpg", as: "image" as const },
];

export function AssetPreload() {
  useEffect(() => {
    const added: HTMLLinkElement[] = [];
    for (const spec of links) {
      const id = `nfac-preload-${spec.href}`;
      if (document.getElementById(id)) continue;
      const l = document.createElement("link");
      l.id = id;
      l.rel = "preload";
      l.href = spec.href;
      l.as = spec.as;
      if ("crossOrigin" in spec && spec.crossOrigin) l.crossOrigin = spec.crossOrigin;
      document.head.appendChild(l);
      added.push(l);
    }
    return () => {
      for (const l of added) {
        if (l.parentNode) l.parentNode.removeChild(l);
      }
    };
  }, []);
  return null;
}
