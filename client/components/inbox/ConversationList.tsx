"use client";

import type { ConversationFilter, ConversationView, Platform } from "@/types";
import { AlertCircle, Camera, MessageCircle, Phone, Search, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { ConversationItem } from "./ConversationItem";

const statusFilters: Array<{ key: ConversationFilter; label: string }> = [
  { key: "unread", label: "Unread" },
  { key: "escalated", label: "Escalated" },
  { key: "resolved", label: "Resolved" },
];

const platformTabs: Array<{
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
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
  activeConversationId?: string | null;
  onSelect: (conversationId: string) => void;
  onRetry: () => void;
}

export function ConversationList({
  conversations,
  allConversations,
  loading,
  error,
  filter,
  setFilter,
  activeConversationId,
  onSelect,
  onRetry,
}: Props) {
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

  const totalCount = allConversations.length;
  const countFor = (platform: Platform) =>
    allConversations.filter((conversation) => conversation.platform === platform)
      .length;

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[var(--color-line)] bg-[rgba(255,255,255,0.56)]">
      <div className="border-b border-[var(--color-line)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Inbox
          </h2>
        </div>

        <div
          className="mt-4 flex flex-wrap items-center gap-1"
          role="tablist"
          aria-label="Filter by platform"
        >
          <button
            type="button"
            role="tab"
            onClick={() => setFilter("all")}
            aria-selected={filter === "all"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-foreground)]"
            }`}
          >
            All chats
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filter === "all"
                  ? "bg-white/22 text-white"
                  : "bg-[var(--color-surface-soft)] text-[var(--color-muted)]"
              }`}
            >
              {totalCount}
            </span>
          </button>

          {platformTabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              onClick={() => setFilter(item.key)}
              aria-selected={filter === item.key}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                filter === item.key
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <item.icon
                size={13}
                style={{ color: filter === item.key ? "white" : item.dot }}
              />
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === item.key
                    ? "bg-white/22 text-white"
                    : "bg-[var(--color-surface-soft)] text-[var(--color-muted)]"
                }`}
              >
                {countFor(item.key)}
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white/80 px-3 py-2.5 transition focus-within:border-[var(--color-accent)] focus-within:ring-4 focus-within:ring-[rgba(15,118,110,0.12)]">
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

        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter conversations by status"
        >
          {statusFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(filter === item.key ? "all" : item.key)}
              aria-pressed={filter === item.key}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === item.key
                  ? "bg-[var(--color-accent)] text-white"
                  : "border border-[var(--color-line)] bg-white/72 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

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
  );
}
