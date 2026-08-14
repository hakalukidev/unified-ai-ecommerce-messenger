import { getPlatformLabel } from "@/lib/format";
import type { Platform } from "@/types";
import { Camera, MessageCircle, Phone } from "lucide-react";

const platformStyles: Record<
  Platform,
  { badge: string; dot: string; accent: string }
> = {
  facebook: {
    badge: "bg-[#E8F1FF] text-[#1D4ED8]",
    dot: "#1877F2",
    accent: "text-[#1D4ED8]",
  },
  instagram: {
    badge: "bg-[#FFF0F5] text-[#BE185D]",
    dot: "#E1306C",
    accent: "text-[#BE185D]",
  },
  whatsapp: {
    badge: "bg-[#EAFBF2] text-[#15803D]",
    dot: "#25D366",
    accent: "text-[#15803D]",
  },
};

const platformIcons: Record<Platform, typeof MessageCircle> = {
  facebook: MessageCircle,
  instagram: Camera,
  whatsapp: Phone,
};

interface Props {
  platform: Platform;
  size?: "xs" | "sm";
}

export function PlatformBadge({ platform, size = "sm" }: Props) {
  const style = platformStyles[platform];

  if (size === "xs") {
    const Icon = platformIcons[platform];

    return (
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: style.dot }}
      >
        <Icon size={10} strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: style.dot }}
      />
      {getPlatformLabel(platform)}
    </span>
  );
}
