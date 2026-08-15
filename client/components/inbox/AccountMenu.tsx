"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  sellerId?: string;
  onLogout: () => void;
}

// The rail's account avatar — click opens a small profile card instead of
// just showing a tooltip, and folds settings/log-out into one place.
export function AccountMenu({ sellerId, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const initials = sellerId ? sellerId.slice(0, 2).toUpperCase() : "?";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        title={sellerId ? `Signed in as ${sellerId}` : undefined}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-semibold text-white transition ${
          open ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
        }`}
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute bottom-0 left-full z-30 ml-2 w-56 rounded-[20px] border border-[var(--color-line)] bg-white p-4 text-left shadow-[0_20px_50px_rgba(16,35,58,0.18)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                {sellerId || "Seller"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">Signed in</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-[var(--color-surface-soft)] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Khoroch
            </p>
            <p className="text-xs text-[var(--color-muted)]">Unified Inbox</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-[var(--color-line)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
          >
            <Settings size={15} />
            Settings
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-[var(--color-line)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
