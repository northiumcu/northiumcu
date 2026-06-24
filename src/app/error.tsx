"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { institution } from "@/lib/institution";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[northium:error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-northium-surface px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-northium-gold">
          System Notice
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold text-northium-primary">
          Something went wrong
        </h1>
        <p className="mt-4 text-northium-muted">
          We encountered an unexpected issue. Your accounts remain secure. If
          this continues, contact{" "}
          <a
            href={`mailto:${institution.supportEmail}`}
            className="font-medium text-northium-primary hover:underline"
          >
            {institution.supportEmail}
          </a>
          .
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="bg-northium-primary hover:bg-northium-secondary"
          >
            Try Again
          </Button>
          <Button variant="outline" render={<Link href="/" />}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
