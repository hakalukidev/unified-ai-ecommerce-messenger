"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  LoaderCircle,
} from "lucide-react";

interface Props {
  callbackUrl?: string;
  loading: boolean;
  launching: boolean;
  ready: boolean;
  missingConfiguration: string[];
  flowError: string | null;
  redirectStatus: "success" | "error" | null;
  redirectMessage: string | null;
  connectedCount: number | null;
  onStart: () => void;
}

const formatConnectedMessage = (connectedCount: number | null) => {
  if (!connectedCount) {
    return "Instagram business login finished successfully.";
  }

  return `Connected ${connectedCount} Instagram business account${
    connectedCount === 1 ? "" : "s"
  }.`;
};

export function InstagramBusinessLoginCard({
  callbackUrl,
  loading,
  launching,
  ready,
  missingConfiguration,
  flowError,
  redirectStatus,
  redirectMessage,
  connectedCount,
  onStart,
}: Props) {
  return (
    <section className="glass-panel soft-ring rounded-[30px] border border-[var(--color-line)] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
          <Link2 size={22} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Instagram OAuth
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">
            Instagram business login
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
            Paste this callback URL into Instagram, then use the button below to connect
            Instagram business accounts without manually copying access tokens.
          </p>
        </div>
      </div>

      {redirectStatus === "success" ? (
        <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                {redirectMessage || formatConnectedMessage(connectedCount)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {redirectStatus === "error" || flowError ? (
        <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{flowError || redirectMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[24px] border border-[var(--color-line)] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          Callback URL
        </p>
        <input
          type="text"
          readOnly
          value={loading ? "Loading callback URL..." : callbackUrl || ""}
          className="mt-3 w-full rounded-2xl border border-[var(--color-line)] bg-slate-50 px-4 py-3 text-sm text-[var(--color-foreground)] outline-none"
        />
        <p className="mt-3 text-xs leading-6 text-[var(--color-muted)]">
          Instagram must redirect back to this exact server URL. For production, set
          `SERVER_URL` to your public API origin so the callback is internet
          reachable.
        </p>
      </div>

      {missingConfiguration.length > 0 ? (
        <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          Set {missingConfiguration.join(", ")} on the server before starting the
          Meta login flow.
        </div>
      ) : null}

      <button
        type="button"
        disabled={loading || launching || !ready || !callbackUrl}
        onClick={onStart}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {launching ? (
          <>
            <LoaderCircle size={16} className="animate-spin" />
            Opening Instagram login...
          </>
        ) : (
          <>
            <ExternalLink size={16} />
            Start Instagram business login
          </>
        )}
      </button>
    </section>
  );
}
