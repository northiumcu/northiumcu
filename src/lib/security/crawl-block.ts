/**
 * Pre-launch crawl blocking — deny all indexing until explicitly enabled.
 * Applied via robots.txt, meta tags, X-Robots-Tag headers, and middleware UA blocks.
 */

export const ROBOTS_META_CONTENT =
  "noindex,nofollow,noarchive,nosnippet,noimageindex,nocache,noai,noimageai";

export const X_ROBOTS_TAG =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache, max-snippet:0, max-image-preview:none, noai, noimageai";

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
  "YandexBot",
  "Baiduspider",
  "DuckDuckBot",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "Claude-Web",
  "Bytespider",
  "PetalBot",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
  "DotBot",
  "FacebookExternalHit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "ia_archiver",
  "PerplexityBot",
  "cohere-ai",
  "Diffbot",
  "Meta-ExternalAgent",
  "ImagesiftBot",
  "YouBot",
] as const;

const MIDDLEWARE_BLOCKED_AGENTS = BLOCKED_CRAWLERS.filter(
  (agent) => agent !== "*"
);

export function isBlockedCrawlerUserAgent(
  userAgent: string | null | undefined
): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return MIDDLEWARE_BLOCKED_AGENTS.some((bot) =>
    ua.includes(bot.toLowerCase())
  );
}
