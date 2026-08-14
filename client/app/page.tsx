"use client";

import { getAuthToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAuthToken() ? "/inbox" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[28px] border border-[var(--color-line)] bg-white/70 px-8 py-6 text-center shadow-[0_30px_80px_rgba(16,35,58,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
          Khoroch
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
          Opening your workspace
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Routing you to the inbox or login screen.
        </p>
      </div>
    </main>
  );
}
