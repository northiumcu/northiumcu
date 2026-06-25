"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MemberRecord } from "@/components/admin/member-admin-types";

export function useAdminMembers(refreshToken = 0) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const memberFromUrl = searchParams.get("member");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/members");
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setLoadError(data.error ?? "Failed to load members.");
      setMembers([]);
      return;
    }

    setLoadError(null);
    setMembers((data.members ?? []) as MemberRecord[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const selectedId = useMemo(() => {
    if (memberFromUrl && members.some((member) => member.id === memberFromUrl)) {
      return memberFromUrl;
    }
    return members[0]?.id ?? "";
  }, [memberFromUrl, members]);

  const setSelectedId = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("member", id);
      } else {
        params.delete("member");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const selected = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId]
  );

  const accounts = selected?.accounts ?? [];

  useEffect(() => {
    if (!selected) return;
    const firstAccount = selected.accounts?.[0];
    if (firstAccount) {
      setSelectedAccountId((current) =>
        selected.accounts?.some((account) => account.id === current)
          ? current
          : firstAccount.id
      );
    }
  }, [selected]);

  return {
    members,
    loading,
    loadError,
    load,
    selectedId,
    setSelectedId,
    selected,
    accounts,
    selectedAccountId,
    setSelectedAccountId,
  };
}
