import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParticipantDetail } from "@/components/admin/participant-detail";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin");

  const { id } = await params;
  return <ParticipantDetail participantId={id} />;
}
