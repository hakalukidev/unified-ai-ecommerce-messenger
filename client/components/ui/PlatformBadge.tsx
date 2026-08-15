import { getPlatformLabel } from "@/lib/format";
import type { Platform } from "@/types";
import { ChannelIcon, platformBackground } from "./ChannelIcon";

const platformStyles: Record<Platform, { badge: string; accent: string }> = {
  facebook: {
    badge: "bg-[#E8F1FF] text-[#1D4ED8]",
    accent: "text-[#1D4ED8]",
  },
  instagram: {
    badge: "bg-[#FFF0F5] text-[#BE185D]",
    accent: "text-[#BE185D]",
  },
  whatsapp: {
    badge: "bg-[#EAFBF2] text-[#15803D]",
    accent: "text-[#15803D]",
  },
};

interface Props {
  platform: Platform;
  size?: "xs" | "sm";
}

export function PlatformBadge({ platform, size = "sm" }: Props) {
  const style = platformStyles[platform];

  if (size === "xs") {
    return (
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white"
        style={{ background: platformBackground[platform] }}
      >
        <ChannelIcon platform={platform} size={9} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
    >
      <span
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white"
        style={{ background: platformBackground[platform] }}
      >
        <ChannelIcon platform={platform} size={8} />
      </span>
      {getPlatformLabel(platform)}
    </span>
  );
}
