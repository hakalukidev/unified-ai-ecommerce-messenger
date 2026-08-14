"use client";

import { useAuth } from "@/hooks/useAuth";
import type {
  ConversationView,
  Platform,
  PlatformFilter,
  StatusFilter,
} from "@/types";
import {
  AlertCircle,
  Camera,
  Inbox,
  MessageCircle,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { ConversationItem } from "./ConversationItem";

const statusTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Open" },
  { key: "escalated", label: "Escalated" },
  { key: "resolved", label: "Resolved" },
];

const platformRail: Array<{
  key: Platform;
  label: string;
  dot: string;
  icon: typeof MessageCircle;
}> = [
  { key: "facebook", label: "Messenger", dot: "#1877F2", icon: MessageCircle },
  { key: "instagram", label: "Instagram", dot: "#E1306C", icon: Camera },
  { key: "whatsapp", label: "WhatsApp", dot: "#25D366", icon: Phone },
];

interface Props {
  conversations: ConversationView[];
  allConversations: ConversationView[];
  loading: boolean;
  error: string | null;
  platformFilter: PlatformFilter;
  setPlatformFilter: (filter: PlatformFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  activeConversationId?: string | null;
  onSelect: (conversationId: string) => void;
  onRetry: () => void;
}

export function ConversationList({
  conversations,
  allConversations,
  loading,
  error,
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
  activeConversationId,
  onSelect,
  onRetry,
}: Props) {
  const { seller } = useAuth();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const visibleConversations = conversations.filter((conversation) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      conversation.sender_name,
      conversation.page_name,
      conversation.last_message_preview,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  const countFor = (platform: PlatformFilter) =>
    allConversations.filter(
      (conversation) => platform === "all" || conversation.platform === platform,
    ).length;
  const unreadCount = allConversations.filter(
    (conversation) => conversation.unread_count > 0,
  ).length;

  return (
    <div className="flex h-full min-h-0 border-r border-[var(--color-line)] bg-[rgba(255,255,255,0.56)]">
      {/* Channel rail — pick which platform's conversations to see */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-[var(--color-line)] bg-[var(--color-sidebar)] py-4">
        <button
          type="button"
          onClick={() => setPlatformFilter("all")}
          aria-pressed={platformFilter === "all"}
          title={`All channels (${countFor("all")})`}
          className={`relative inline-flex h-9 w-9 items-center justify-center rounded-2xl transition ${
            platformFilter === "all"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white"
          }`}
        >
          <Inbox size={16} />
        </button>

        <div className="my-1 h-px w-6 bg-[var(--color-sidebar-border)]" />

        {platformRail.map((item) => {
          const isActive = platformFilter === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setPlatformFilter(isActive ? "all" : item.key)}
              aria-pressed={isActive}
              title={`${item.label} (${countFor(item.key)})`}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white transition ${
                isActive ? "" : "opacity-55 hover:opacity-90"
              }`}
              style={{ backgroundColor: item.dot }}
            >
              <item.icon size={15} />
              {countFor(item.key) > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--color-sidebar)] bg-white px-1 text-[9px] font-bold text-[var(--color-foreground)]">
                  {countFor(item.key) > 99 ? "99+" : countFor(item.key)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-[var(--color-line)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              All Channel
            </h2>
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              {countFor("all")} total
            </span>
          </div>

          <div
            className="mt-4 inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--color-line)] bg-white/70 p-1"
            role="tablist"
            aria-label="Filter by status"
          >
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                onClick={() => setStatusFilter(tab.key)}
                aria-selected={statusFilter === tab.key}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.key
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white/80 px-3 py-2.5 transition focus-within:border-[var(--color-accent)] focus-within:ring-4 focus-within:ring-[rgba(15,118,110,0.12)]">
            <Search size={16} className="shrink-0 text-[var(--color-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sender or message..."
              aria-label="Search conversations"
              className="w-full bg-transparent text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="shrink-0 rounded-full p-0.5 text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
              >
                <X size={14} />
              </button>
            ) : null}
          </label>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === "unread" ? "all" : "unread")
            }
            aria-pressed={statusFilter === "unread"}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "unread"
                ? "bg-[var(--color-accent)] text-white"
                : "border border-[var(--color-line)] bg-white/72 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            Unread
            {unreadCount > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  statusFilter === "unread"
                    ? "bg-white/22 text-white"
                    : "bg-[var(--color-surface-soft)] text-[var(--color-muted)]"
                }`}
              >
                {unreadCount}
              </span>
            ) : null}
          </button>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 font-semibold underline underline-offset-4"
                >
                  Retry loading inbox
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[24px] border border-[var(--color-line)] bg-white/80 p-4"
                >
                  <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[var(--color-surface-soft)]" />
                    <div className="flex-1">
                      <div className="h-3.5 w-28 rounded bg-[var(--color-surface-soft)]" />
                      <div className="mt-3 h-3 w-full rounded bg-[var(--color-surface-soft)]" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-[var(--color-surface-soft)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleConversations.length > 0 ? (
            <div className="space-y-3">
              {visibleConversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  isActive={conversation._id === activeConversationId}
                  onClick={() => onSelect(conversation._id)}
                  sellerId={seller?.seller_id}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[var(--color-line)] bg-white/55 px-6 text-center">
              <p className="text-base font-semibold text-[var(--color-foreground)]">
                No conversations match right now
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Try another filter or search query to narrow down the inbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
