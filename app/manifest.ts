import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest and makes the app installable.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaperTrade — Virtual Stock Trading",
    short_name: "PaperTrade",
    description:
      "Risk-free paper trading simulator for learning the US stock market. Track positions, trade, and review your performance.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121218",
    theme_color: "#121218",
    categories: ["finance", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
