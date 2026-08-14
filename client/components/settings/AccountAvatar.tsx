"use client";

import type { AccountRecord } from "@/types";
import { useState } from "react";

interface Props {
  account: AccountRecord;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const getAvatarUrl = (account: AccountRecord) => {
  if (account.platform === "facebook") {
    return `https://graph.facebook.com/${account.page_id}/picture?type=large`;
  }

  return null;
};

const platformAccentClasses: Record<AccountRecord["platform"], string> = {
  facebook: "bg-[#E8F1FF] text-[#1D4ED8]",
  instagram: "bg-[#FFF0F5] text-[#BE185D]",
  whatsapp: "bg-[#EAFBF2] text-[#15803D]",
};

export function AccountAvatar({ account }: Props) {
  const avatarUrl = getAvatarUrl(account);
  const [imageFailed, setImageFailed] = useState(false);

  if (!avatarUrl || imageFailed) {
    return (
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${platformAccentClasses[account.platform]}`}
        aria-hidden="true"
      >
        {getInitials(account.page_name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={`${account.page_name} avatar`}
      className="h-14 w-14 shrink-0 rounded-2xl border border-[var(--color-line)] object-cover"
      onError={() => setImageFailed(true)}
    />
  );
}
