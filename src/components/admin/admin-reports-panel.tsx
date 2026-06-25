"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportRow = {
  id: string;
  title: string;
  description: string;
  updatedAt: string | null;
};

export function AdminReportsPanel() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data.error) {
          setError(data.error);
          return;
        }
        setReports(data.reports ?? []);
      })
      .catch(() => {
        setLoading(false);
        setError("Could not load reports.");
      });
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-white/50">Loading live institutional reports…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {reports.map((report) => (
        <Card
          key={report.id}
          className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none"
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              {report.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/55">{report.description}</p>
            <p className="mt-3 text-xs text-white/40">
              Last updated:{" "}
              {report.updatedAt
                ? new Date(report.updatedAt).toLocaleString()
                : "—"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
