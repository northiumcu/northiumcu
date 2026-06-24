/**
 * Pre-launch crawl blocking — deny all indexing until explicitly enabled.
 * Applied via robots.txt, meta tags, and X-Robots-Tag headers.
 */

export const ROBOTS_META_CONTENT =
  "noindex,nofollow,noarchive,nosnippet,noimageindex,nocache";

export const X_ROBOTS_TAG =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache, max-snippet:0, max-image-preview:none";

/** User agents blocked in robots.txt (search, SEO, social previews, AI crawlers). */
export const BLOCKED_CRAWLERS = [
  "*",
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Googlebot-Video",
  "Google-Extended",
  "Bingbot",
  "Slurp",
  "Yandex",
  "Baiduspider",
  "DuckDuckBot",
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "Bytespider",
  "PetalBot",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
  "DotBot",
  "FacebookExternalHit",
  "Twitterbot",
  "LinkedInBot",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "ia_archiver",
] as const;
