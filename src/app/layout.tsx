import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { institution } from "@/lib/institution";
import { ROBOTS_META_CONTENT } from "@/lib/security/crawl-block";
import { assertProductionEnv } from "@/lib/env";
import "./globals.css";

assertProductionEnv();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: institution.name,
    template: `%s | ${institution.name}`,
  },
  description: "Member banking portal.",
  applicationName: institution.shortName,
  themeColor: "#081827",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
  other: {
    robots: ROBOTS_META_CONTENT,
    googlebot: ROBOTS_META_CONTENT,
    bingbot: ROBOTS_META_CONTENT,
    slurp: ROBOTS_META_CONTENT,
    duckduckbot: ROBOTS_META_CONTENT,
    gptbot: ROBOTS_META_CONTENT,
    "anthropic-ai": ROBOTS_META_CONTENT,
    ccbot: ROBOTS_META_CONTENT,
    perplexitybot: ROBOTS_META_CONTENT,
    "oai-searchbot": ROBOTS_META_CONTENT,
    claudebot: ROBOTS_META_CONTENT,
    facebot: ROBOTS_META_CONTENT,
    twitterbot: ROBOTS_META_CONTENT,
    linkedinbot: ROBOTS_META_CONTENT,
    applebot: ROBOTS_META_CONTENT,
    amazonbot: ROBOTS_META_CONTENT,
  },
};

const CRAWL_BLOCK_META = [
  ["robots", ROBOTS_META_CONTENT],
  ["googlebot", ROBOTS_META_CONTENT],
  ["bingbot", ROBOTS_META_CONTENT],
  ["slurp", ROBOTS_META_CONTENT],
  ["duckduckbot", ROBOTS_META_CONTENT],
  ["GPTBot", ROBOTS_META_CONTENT],
  ["anthropic-ai", ROBOTS_META_CONTENT],
  ["CCBot", ROBOTS_META_CONTENT],
  ["PerplexityBot", ROBOTS_META_CONTENT],
  ["OAI-SearchBot", ROBOTS_META_CONTENT],
  ["ClaudeBot", ROBOTS_META_CONTENT],
  ["Facebot", ROBOTS_META_CONTENT],
  ["Twitterbot", ROBOTS_META_CONTENT],
  ["LinkedInBot", ROBOTS_META_CONTENT],
  ["Applebot", ROBOTS_META_CONTENT],
  ["Amazonbot", ROBOTS_META_CONTENT],
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <head>
        {CRAWL_BLOCK_META.map(([name, content]) => (
          <meta key={name} name={name} content={content} />
        ))}
      </head>
      <body className="min-h-full flex flex-col bg-white text-northium-text">
        {children}
      </body>
    </html>
  );
}
