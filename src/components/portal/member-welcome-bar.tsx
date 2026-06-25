"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export function MemberWelcomeBar() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [memberNumber, setMemberNumber] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/member/profile").then((r) => r.json()),
      fetch("/api/member/accounts").then((r) => r.json()),
    ]).then(([profileData, accountData]) => {
      const profile = profileData.profile;
      if (profile) {
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setMemberNumber(profile.member_number ?? null);
        setAvatarUrl(profile.avatar_url ?? null);
      }

      const accounts = (accountData.accounts ?? []) as { balance: number }[];
      if (accounts.length > 0) {
        setTotalBalance(
          accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0)
        );
      }
    });
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const balanceLabel =
    totalBalance === null
      ? null
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(totalBalance);

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-northium-primary via-[#0f3454] to-[#0f766e] p-5 shadow-xl shadow-northium-primary/20 sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-northium-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 size-48 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-northium-gold/50 bg-white/10 shadow-lg">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex size-full items-center justify-center text-lg font-bold text-white">
                {initials || "?"}
              </span>
            )}
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-white/75">
              <Sparkles className="size-4 text-northium-gold" />
              {greeting}
              {firstName ? `, ${firstName}` : ""}
            </p>
            <p className="font-heading text-xl font-bold text-white sm:text-2xl">
              Your Northium account
            </p>
            {memberNumber && (
              <p className="mt-1 text-xs tracking-wide text-white/60">
                Member #{memberNumber}
              </p>
            )}
          </div>
        </div>

        {balanceLabel && (
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Total balance
            </p>
            <p className="font-heading text-2xl font-bold text-white">{balanceLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
