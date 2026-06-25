"use client";

import { useEffect, useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  created_at: string;
};

export function AlertsPanel() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/member/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const alerts = notifications.filter(
    (n) =>
      n.category === "security" ||
      n.title.toLowerCase().includes("security") ||
      n.title.toLowerCase().includes("sign-in") ||
      n.title.toLowerCase().includes("pin")
  );

  const display = alerts.length > 0 ? alerts : notifications.slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 text-sm text-northium-muted">
        Loading alerts…
      </div>
    );
  }

  if (display.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <ShieldCheck className="size-6" />
          </span>
          <p className="mt-4 font-heading text-base font-semibold text-northium-primary">
            All clear
          </p>
          <p className="mt-2 text-sm text-northium-muted">
            No security alerts right now. Account notifications will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {display.map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Bell className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-northium-primary">{alert.title}</p>
                {!alert.read && (
                  <Badge className="bg-amber-100 text-amber-800">New</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-northium-muted">{alert.message}</p>
              <p className="mt-2 text-xs text-northium-muted">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
