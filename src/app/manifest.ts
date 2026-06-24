import type { MetadataRoute } from "next";
import { institution } from "@/lib/institution";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: institution.name,
    short_name: institution.shortName,
    description:
      "Secure accounts, lending solutions and member-first banking for individuals and families.",
    start_url: "/",
    display: "standalone",
    background_color: "#081827",
    theme_color: "#081827",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
