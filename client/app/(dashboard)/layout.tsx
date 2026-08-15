"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { Bell, LogOut, MessageSquareText, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  {
    href: "/inbox",
    label: "Inbox",
    icon: MessageSquareText,
    match: (pathname: string) =>
      pathname.startsWith("/inbox") || pathname.startsWith("/conversation"),
    badgeKey: "unread" as const,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (pathname: string) => pathname.startsWith("/settings"),
    badgeKey: null,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { seller, loading, logout } = useAuth();
  const { allConversations } = useConversations();
  const unreadCount = allConversations.filter(
    (conversation) => conversation.unread_count > 0,
  ).length;

  useEffect(() => {
    if (!loading && !seller) {
      router.replace("/login");
    }
  }, [loading, router, seller]);

  if (loading || !seller) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel soft-ring rounded-[28px] border border-[var(--color-line)] px-8 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Khoroch
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Loading your workspace
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Verifying your session and preparing the inbox.
          </p>
        </div>
      </div>
    );
  }

  const activeLabel =
    navItems.find((item) => item.match(pathname))?.label ?? "Workspace";
  const isConversationDetail = pathname.startsWith("/conversation/");
  // The inbox workspace fills the browser edge-to-edge — no outer padding,
  // no card frame — instead of sitting inside the padded/rounded shell the
  // other pages (Settings, etc.) use.
  const isInboxRoute = isConversationDetail || pathname.startsWith("/inbox");

  return (
    <div className="flex h-screen">
      <div className="flex h-screen min-h-0 min-w-0 flex-1 flex-col">
        {isConversationDetail ? null : (
          <header className="px-4 pt-4 md:px-6 md:pt-6">
            <div className="glass-panel soft-ring flex items-center justify-between gap-3 rounded-[24px] border border-[var(--color-line)] px-4 py-3">
              <div className="min-w-0">
                <p className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] md:block">
                  Khoroch
                </p>
                <h1 className="truncate text-lg font-semibold text-[var(--color-foreground)] md:mt-1">
                  {activeLabel}
                </h1>
              </div>

              {pathname.startsWith("/settings") ? (
                <Link
                  href="/inbox"
                  className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)] md:inline-flex"
                >
                  <MessageSquareText size={14} />
                  Back to inbox
                </Link>
              ) : null}

              <div className="flex items-center gap-2">
                <label className="hidden items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 md:flex">
                  <Search size={16} className="shrink-0 text-[var(--color-muted)]" />
                  <input
                    type="search"
                    placeholder="Search..."
                    aria-label="Search"
                    className="w-40 bg-transparent text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] lg:w-56"
                  />
                </label>

                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
                >
                  <Bell size={18} />
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                </button>

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(16,35,58,0.08)] text-sm font-semibold text-[var(--color-foreground)] sm:flex">
                  {seller.seller_id.slice(0, 2).toUpperCase()}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.replace("/login");
                  }}
                  aria-label="Log out"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white/70 text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)] md:hidden"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </header>
        )}

        <main
          className={
            isInboxRoute
              ? `flex-1 min-h-0 min-w-0 ${isConversationDetail ? "" : "pb-20 md:pb-0"}`
              : "flex-1 min-h-0 min-w-0 p-4 pb-24 md:px-6 md:pb-6 md:pt-4"
          }
        >
          {children}
        </main>

        {isConversationDetail ? null : (
          <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 md:hidden">
            <div className="glass-panel soft-ring mx-auto flex max-w-sm items-center gap-2 rounded-[26px] border border-[var(--color-line)] p-2">
              {navItems.map((item) => {
                const isActive = item.match(pathname);
                const badge = item.badgeKey === "unread" ? unreadCount : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[var(--color-sidebar)] text-white"
                        : "text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                    {badge > 0 ? (
                      <span className="absolute right-6 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] font-bold text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
