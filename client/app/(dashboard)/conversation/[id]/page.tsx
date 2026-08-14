"use client";

import { InboxWorkspace } from "@/components/inbox/InboxWorkspace";
import { useParams } from "next/navigation";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();

  return <InboxWorkspace selectedConversationId={params.id} />;
}
