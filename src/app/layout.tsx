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

const siteDescription =
  "Secure accounts, lending solutions and member-first banking for individuals and families.";

export const metadata: Metadata = {
  metadataBase: new URL(institution.productionUrl),
  title: {
    default: institution.name,
    template: `%s | ${institution.name}`,
  },
  description: siteDescription,
  applicationName: institution.shortName,
  themeColor: "#081827",
  alternates: {
    canonical: institution.productionUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: institution.productionUrl,
    siteName: institution.name,
    title: institution.name,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: institution.name,
    description: siteDescription,
  },
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
    bingbot: ROBOTS_META_CONTENT,
    slurp: ROBOTS_META_CONTENT,
    duckduckbot: ROBOTS_META_CONTENT,
    gptbot: ROBOTS_META_CONTENT,
    "anthropic-ai": ROBOTS_META_CONTENT,
  },
};

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
        <meta name="robots" content={ROBOTS_META_CONTENT} />
        <meta name="googlebot" content={ROBOTS_META_CONTENT} />
        <meta name="bingbot" content={ROBOTS_META_CONTENT} />
        <meta name="slurp" content={ROBOTS_META_CONTENT} />
        <meta name="duckduckbot" content={ROBOTS_META_CONTENT} />
        <meta name="GPTBot" content={ROBOTS_META_CONTENT} />
        <meta name="anthropic-ai" content={ROBOTS_META_CONTENT} />
        <meta name="CCBot" content={ROBOTS_META_CONTENT} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-northium-text">
        {children}
      </body>
    </html>
  );
}
