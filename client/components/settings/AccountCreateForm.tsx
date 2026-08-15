"use client";

import type { AccountStatus, NewAccountInput, Platform } from "@/types";
import { PlusCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

const initialForm: NewAccountInput = {
  platform: "facebook",
  page_id: "",
  page_name: "",
  page_username: "",
  access_token: "",
  ai_enabled: true,
  status: "active",
};

const platforms: Platform[] = ["facebook", "instagram", "whatsapp"];
const statuses: AccountStatus[] = ["active", "error", "disconnected"];

interface Props {
  creating: boolean;
  onCreate: (payload: NewAccountInput) => Promise<void>;
}

export function AccountCreateForm({ creating, onCreate }: Props) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);

  const updateField = <Key extends keyof NewAccountInput>(
    field: Key,
    value: NewAccountInput[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.page_id.trim() || !form.page_name.trim() || !form.access_token.trim()) {
      setError("Platform, page ID, page name, and access token are required.");
      return;
    }

    setError(null);

    try {
      await onCreate({
        ...form,
        page_id: form.page_id.trim(),
        page_name: form.page_name.trim(),
        page_username: form.page_username?.trim() || undefined,
        access_token: form.access_token.trim(),
      });
      setForm(initialForm);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save the account right now.",
      );
    }
  };

  return (
    <section className="glass-panel soft-ring rounded-[30px] border border-[var(--color-line)] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
          <PlusCircle size={22} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Add account
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">
            Connect a new channel manually
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
            Use this when you already have the channel ID and access token, or
            when you want to add Facebook or WhatsApp credentials directly.
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
              Platform
            </span>
            <select
              value={form.platform}
              onChange={(event) =>
                updateField("platform", event.target.value as Platform)
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform[0].toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as AccountStatus)
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
            Page or phone ID
          </span>
          <input
            type="text"
            value={form.page_id}
            onChange={(event) => updateField("page_id", event.target.value)}
            placeholder="1234567890"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
            Page name
          </span>
          <input
            type="text"
            value={form.page_name}
            onChange={(event) => updateField("page_name", event.target.value)}
            placeholder="My Storefront"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
            Username
          </span>
          <input
            type="text"
            value={form.page_username}
            onChange={(event) => updateField("page_username", event.target.value)}
            placeholder="@myshop"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
            Access token
          </span>
          <textarea
            value={form.access_token}
            onChange={(event) => updateField("access_token", event.target.value)}
            rows={4}
            placeholder="Paste the channel access token..."
            className="w-full rounded-[22px] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--color-line)] bg-white/75 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-[var(--color-accent-strong)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                Enable AI by default
              </p>
              <p className="mt-1 text-xs leading-6 text-[var(--color-muted)]">
                New conversations from this account will start with AI support on.
              </p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={form.ai_enabled}
            onChange={(event) => updateField("ai_enabled", event.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={creating}
          className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "Saving account..." : "Save connected account"}
        </button>
      </form>
    </section>
  );
}
