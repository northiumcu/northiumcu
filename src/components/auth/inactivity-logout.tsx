"use client";

import { useCallback, useEffect, useRef } from "react";
import { INACTIVITY_TIMEOUT_MS } from "@/lib/auth/inactivity-timeout";

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

export function InactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const signingOutRef = useRef(false);

  const signOut = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;

    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Still redirect — session cookies may already be cleared server-side.
    }

    window.location.href = "/";
  }, []);

  useEffect(() => {
    const scheduleLogout = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const idleFor = Date.now() - lastActivityRef.current;
      const remaining = INACTIVITY_TIMEOUT_MS - idleFor;

      if (remaining <= 0) {
        void signOut();
        return;
      }

      timerRef.current = setTimeout(() => {
        void signOut();
      }, remaining);
    };

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      scheduleLogout();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleLogout();
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    scheduleLogout();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [signOut]);

  return null;
}
