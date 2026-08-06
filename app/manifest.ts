import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "積立管理",
    short_name: "積立管理",
    description: "個人用の積立管理PWA",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#0C0A09",
    theme_color: "#0C0A09",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
