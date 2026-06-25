import { MemberAccountDetailClient } from "@/components/portal/member-accounts-client";

export default async function MemberAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberAccountDetailClient accountId={id} />;
}
