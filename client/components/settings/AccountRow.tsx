import { AIToggle } from "@/components/ui/AIToggle";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AccountRecord } from "@/types";
import { Trash2 } from "lucide-react";
import { AccountAvatar } from "./AccountAvatar";

interface Props {
  account: AccountRecord;
  disabled: boolean;
  onToggleAI: (accountId: string, aiEnabled: boolean) => void;
  onDelete: (accountId: string) => void;
}

export function AccountRow({
  account,
  disabled,
  onToggleAI,
  onDelete,
}: Props) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-[var(--color-line)] bg-white/78 p-4 transition hover:border-[rgba(15,118,110,0.25)] hover:shadow-md md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <AccountAvatar account={account} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={account.platform} />
            <StatusBadge status={account.status} />
          </div>
          <p className="mt-3 truncate text-base font-semibold text-[var(--color-foreground)]">
            {account.page_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
            <span>Page ID: {account.page_id}</span>
            {account.page_username ? <span>@{account.page_username}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            AI replies
          </p>
          <div className="mt-2">
            <AIToggle
              enabled={account.ai_enabled}
              onToggle={() => onToggleAI(account._id, account.ai_enabled)}
              size="sm"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(account._id)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
