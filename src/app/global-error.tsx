"use client";

import { institution } from "@/lib/institution";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#F7F9FB",
          color: "#0B1220",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {institution.name}
            </h1>
            <p style={{ marginTop: "1rem", color: "#667085" }}>
              A critical error occurred. Please refresh the page or contact{" "}
              <a
                href={`mailto:${institution.supportEmail}`}
                style={{ color: "#081827" }}
              >
                {institution.supportEmail}
              </a>
              .
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                padding: "0.625rem 1.25rem",
                background: "#081827",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
