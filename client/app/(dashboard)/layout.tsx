"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  Bot,
  LogOut,
  MessageSquareText,
  Search,
  Settings2,
} from "lucide-react";
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
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings2,
    match: (pathname: string) => pathname.startsWith("/settings"),
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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 p-4 md:block">
        <div className="flex h-full flex-col rounded-[30px] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] px-4 py-6 shadow-[0_20px_60px_rgba(16,35,58,0.28)]">
          <div className="flex items-center gap-3 px-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Khoroch
              </h1>
              <p className="text-[11px] font-medium text-[var(--color-sidebar-muted)]">
                Unified Inbox
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--color-sidebar-active)] text-white"
                      : "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[22px] border border-[var(--color-sidebar-border)] bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-sidebar-muted)]">
              Active seller
            </p>
            <p className="mt-2 break-all text-sm font-medium text-white">
              {seller.seller_id}
            </p>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-sidebar-border)] bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-sidebar-muted)] transition hover:border-[var(--color-accent)] hover:text-white"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {isConversationDetail ? null : (
          <header className="px-4 pt-4 md:px-0 md:pr-6 md:pt-6">
            <div className="glass-panel soft-ring flex items-center justify-between gap-3 rounded-[24px] border border-[var(--color-line)] px-4 py-3">
              <div className="min-w-0">
                <p className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] md:block">
                  Khoroch
                </p>
                <h1 className="truncate text-lg font-semibold text-[var(--color-foreground)] md:mt-1">
                  {activeLabel}
                </h1>
              </div>

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
          className={`flex-1 min-h-0 p-4 md:px-0 md:pb-6 md:pr-6 md:pt-4 ${
            isConversationDetail ? "pt-4" : "pb-24"
          }`}
        >
          {children}
        </main>

        {isConversationDetail ? null : (
          <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 md:hidden">
            <div className="glass-panel soft-ring mx-auto flex max-w-sm items-center gap-2 rounded-[26px] border border-[var(--color-line)] p-2">
              {navItems.map((item) => {
                const isActive = item.match(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[var(--color-sidebar)] text-white"
                        : "text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
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
