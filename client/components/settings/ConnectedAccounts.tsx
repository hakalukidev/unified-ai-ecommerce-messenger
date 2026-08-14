import type { AccountRecord } from "@/types";
import { AccountRow } from "./AccountRow";

interface Props {
  accounts: AccountRecord[];
  loading: boolean;
  pendingAccountId: string | null;
  onToggleAI: (accountId: string, aiEnabled: boolean) => void;
  onDelete: (accountId: string) => void;
}

export function ConnectedAccounts({
  accounts,
  loading,
  pendingAccountId,
  onToggleAI,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[24px] border border-[var(--color-line)] bg-white/78 p-4"
          >
            <div className="h-4 w-28 rounded bg-[var(--color-surface-soft)]" />
            <div className="mt-4 h-4 w-2/3 rounded bg-[var(--color-surface-soft)]" />
            <div className="mt-3 h-3 w-1/2 rounded bg-[var(--color-surface-soft)]" />
          </div>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-[var(--color-line)] bg-white/60 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-[var(--color-foreground)]">
          No connected accounts yet
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
          Add a page, Instagram profile, or WhatsApp number on the right to make
          this seller inbox live.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountRow
          key={account._id}
          account={account}
          disabled={pendingAccountId === account._id}
          onToggleAI={onToggleAI}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
