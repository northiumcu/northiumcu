import type { MetadataRoute } from "next";

/** Intentionally empty — no public URL discovery for search engines. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
