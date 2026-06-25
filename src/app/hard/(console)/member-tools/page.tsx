import { MemberToolsLayoutShell } from "@/components/admin/member-tools-layout-shell";
import { memberToolsNav } from "@/lib/admin/member-tools-nav";
import Link from "next/link";

export default function MemberToolsOverviewPage() {
  const tools = memberToolsNav.filter((item) => item.href !== "/hard/member-tools");

  return (
    <MemberToolsLayoutShell>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-white/10 bg-[#0f2233] p-5 transition-colors hover:border-northium-gold/30 hover:bg-[#122a3d]"
          >
            <p className="font-heading text-base font-semibold text-white">{tool.label}</p>
            <p className="mt-2 text-sm text-white/55">{tool.description}</p>
          </Link>
        ))}
      </div>
    </MemberToolsLayoutShell>
  );
}
