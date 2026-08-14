"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Unified inbox",
    copy: "Every Facebook, Instagram, and WhatsApp thread in one place.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted replies",
    copy: "Turn AI drafting on or off per conversation, whenever you need it.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    copy: "Every session is authenticated and scoped to your workspace.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { seller, loading: authLoading, login } = useAuth();
  const [sellerId, setSellerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  useEffect(() => {
    if (!authLoading && seller) {
      router.replace("/inbox");
    }
  }, [authLoading, router, seller]);

  const handleSubmit = async () => {
    const trimmedSellerId = sellerId.trim();

    if (!trimmedSellerId) {
      setError("Enter your seller ID to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login(trimmedSellerId);
      router.replace("/inbox");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to create a session right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || authLoading;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
      <div className="animate-fade-in-up glass-panel soft-ring grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--color-line)] md:grid-cols-[1.1fr_minmax(380px,0.9fr)]">
        {/* Brand / value panel */}
        <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#0d1f34_0%,#12314f_55%,#154865_100%)] px-10 py-12 text-white md:flex md:flex-col md:justify-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.28),transparent_36%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/85">
              <span className="flex size-5 items-center justify-center rounded-full bg-teal-400/90 text-[10px] font-bold text-[#0d1f34]">
                K
              </span>
              Khoroch
            </div>

            <h1 className="mt-7 max-w-md text-4xl font-semibold leading-[1.15] tracking-tight md:text-[2.75rem]">
              One inbox for every customer conversation.
            </h1>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/70 md:text-base">
              Sign in to manage messages, track orders, and reply faster with
              AI assistance — all from a single, unified workspace.
            </p>

            <div className="mt-10 space-y-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition hover:bg-white/[0.09]"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-400/15 text-teal-200">
                    <feature.icon size={17} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {feature.title}
                    </h2>
                    <p className="mt-0.5 text-xs leading-6 text-white/60">
                      {feature.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sign-in panel */}
        <section className="bg-[rgba(255,253,248,0.92)] px-6 py-10 sm:px-10 md:py-12">
          <div className="mx-auto flex h-full max-w-sm flex-col justify-center">
            <div className="mb-8 inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] md:hidden">
              <span className="text-lg font-bold">K</span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
              Sign in to your workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              Enter your seller ID to continue, for example
              <span className="mx-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-1 font-mono text-xs text-[var(--color-accent-strong)]">
                shop-demo-01
              </span>
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <label className="block" htmlFor="sellerId">
                <span className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
                  Seller ID
                </span>
                <div className="relative">
                  <Store
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                  />
                  <input
                    id="sellerId"
                    type="text"
                    autoFocus
                    autoComplete="username"
                    spellCheck={false}
                    value={sellerId}
                    onChange={(event) => {
                      setSellerId(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your seller ID"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className="w-full rounded-2xl border border-[var(--color-line)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
                  />
                </div>
              </label>

              {error ? (
                <div
                  id={errorId}
                  role="alert"
                  className="animate-fade-in-up flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,118,110,0.25)] transition hover:bg-[var(--color-accent-strong)] hover:shadow-[0_12px_34px_rgba(15,118,110,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue to inbox
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[var(--color-muted)]">
              <ShieldCheck size={14} className="text-[var(--color-accent)]" />
              Your session is authenticated and kept private to your workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
