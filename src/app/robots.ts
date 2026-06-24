import type { MetadataRoute } from "next";
import { BLOCKED_CRAWLERS } from "@/lib/security/crawl-block";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: BLOCKED_CRAWLERS.map((userAgent) => ({
      userAgent,
      disallow: "/",
    })),
  };
}
