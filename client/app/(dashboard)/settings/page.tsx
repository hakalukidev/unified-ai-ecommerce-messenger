"use client";

import { AccountCreateForm } from "@/components/settings/AccountCreateForm";
import { ConnectedAccounts } from "@/components/settings/ConnectedAccounts";
import { FacebookPagesLoginCard } from "@/components/settings/FacebookPagesLoginCard";
import { InstagramBusinessLoginCard } from "@/components/settings/InstagramBusinessLoginCard";
import { authService } from "@/services/auth";
import { accountService } from "@/services/accounts";
import type {
  AccountRecord,
  FacebookPagesLoginConfig,
  InstagramBusinessLoginConfig,
  NewAccountInput,
} from "@/types";
import { DatabaseZap, RefreshCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

const getConnectedCount = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [facebookConfig, setFacebookConfig] =
    useState<FacebookPagesLoginConfig | null>(null);
  const [facebookConfigLoading, setFacebookConfigLoading] = useState(true);
  const [facebookFlowError, setFacebookFlowError] = useState<string | null>(null);
  const [startingFacebookLogin, setStartingFacebookLogin] = useState(false);
  const [instagramConfig, setInstagramConfig] =
    useState<InstagramBusinessLoginConfig | null>(null);
  const [instagramConfigLoading, setInstagramConfigLoading] = useState(true);
  const [instagramFlowError, setInstagramFlowError] = useState<string | null>(null);
  const [startingInstagramLogin, setStartingInstagramLogin] = useState(false);
  const searchParams = useSearchParams();

  const facebookRedirectStatus = searchParams.get("facebook_pages_login");
  const facebookRedirectMessage = searchParams.get("message");
  const facebookConnectedCount = getConnectedCount(searchParams.get("connected"));
  const instagramRedirectStatus = searchParams.get("instagram_business_login");
  const instagramRedirectMessage = searchParams.get("message");
  const instagramConnectedCount = getConnectedCount(searchParams.get("connected"));

  const loadSettingsData = async () => {
    setLoading(true);
    setFacebookConfigLoading(true);
    setInstagramConfigLoading(true);
    setError(null);
    setFacebookFlowError(null);
    setInstagramFlowError(null);

    const [
      accountsResult,
      facebookConfigResult,
      instagramConfigResult,
    ] = await Promise.allSettled([
      accountService.list(),
      authService.getFacebookPagesLogin(),
      authService.getInstagramBusinessLogin(),
    ]);

    if (accountsResult.status === "fulfilled") {
      setAccounts(accountsResult.value);
    } else {
      setError(getErrorMessage(accountsResult.reason));
    }

    if (facebookConfigResult.status === "fulfilled") {
      setFacebookConfig(facebookConfigResult.value);
    } else {
      setFacebookFlowError(getErrorMessage(facebookConfigResult.reason));
    }

    if (instagramConfigResult.status === "fulfilled") {
      setInstagramConfig(instagramConfigResult.value);
    } else {
      setInstagramFlowError(getErrorMessage(instagramConfigResult.reason));
    }

    setLoading(false);
    setFacebookConfigLoading(false);
    setInstagramConfigLoading(false);
  };

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      const [
        accountsResult,
        facebookConfigResult,
        instagramConfigResult,
      ] = await Promise.allSettled([
        accountService.list(),
        authService.getFacebookPagesLogin(),
        authService.getInstagramBusinessLogin(),
      ]);

      if (!active) {
        return;
      }

      if (accountsResult.status === "fulfilled") {
        setAccounts(accountsResult.value);
      } else {
        setError(getErrorMessage(accountsResult.reason));
      }

      if (facebookConfigResult.status === "fulfilled") {
        setFacebookConfig(facebookConfigResult.value);
      } else {
        setFacebookFlowError(getErrorMessage(facebookConfigResult.reason));
      }

      if (instagramConfigResult.status === "fulfilled") {
        setInstagramConfig(instagramConfigResult.value);
      } else {
        setInstagramFlowError(getErrorMessage(instagramConfigResult.reason));
      }

      setLoading(false);
      setFacebookConfigLoading(false);
      setInstagramConfigLoading(false);
    };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const handleCreateAccount = async (payload: NewAccountInput) => {
    setCreating(true);

    try {
      const account = await accountService.create(payload);
      setAccounts((current) => [account, ...current.filter((item) => item._id !== account._id)]);
    } finally {
      setCreating(false);
    }
  };

  const handleStartFacebookPagesLogin = async () => {
    setFacebookFlowError(null);
    setStartingFacebookLogin(true);

    try {
      const response = await authService.startFacebookPagesLogin();
      window.location.assign(response.login_url);
    } catch (nextError) {
      setFacebookFlowError(getErrorMessage(nextError));
      setStartingFacebookLogin(false);
    }
  };

  const handleStartInstagramBusinessLogin = async () => {
    setInstagramFlowError(null);
    setStartingInstagramLogin(true);

    try {
      const response = await authService.startInstagramBusinessLogin();
      window.location.assign(response.login_url);
    } catch (nextError) {
      setInstagramFlowError(getErrorMessage(nextError));
      setStartingInstagramLogin(false);
    }
  };

  const handleToggleAI = async (accountId: string, aiEnabled: boolean) => {
    setPendingAccountId(accountId);

    try {
      const updated = await accountService.update(accountId, {
        ai_enabled: !aiEnabled,
      });

      setAccounts((current) =>
        current.map((account) =>
          account._id === accountId ? updated : account,
        ),
      );
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    setPendingAccountId(accountId);

    try {
      await accountService.remove(accountId);
      setAccounts((current) =>
        current.filter((account) => account._id !== accountId),
      );
    } finally {
      setPendingAccountId(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)]">
      <section className="glass-panel soft-ring rounded-[30px] border border-[var(--color-line)] p-5 md:p-6">
        <div className="flex flex-col gap-4 border-b border-[var(--color-line)] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
              Connected accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
              Manage channel credentials, account status, and default AI behavior
              for each storefront inbox.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSettingsData()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-5">
          <ConnectedAccounts
            accounts={accounts}
            loading={loading}
            pendingAccountId={pendingAccountId}
            onToggleAI={handleToggleAI}
            onDelete={handleDelete}
          />
        </div>
      </section>

      <div className="space-y-6">
        <FacebookPagesLoginCard
          callbackUrl={facebookConfig?.callback_url}
          webhookUrl={facebookConfig?.webhook_url}
          verifyTokenConfigured={facebookConfig?.verify_token_configured}
          loading={facebookConfigLoading}
          launching={startingFacebookLogin}
          ready={facebookConfig?.ready ?? false}
          missingConfiguration={facebookConfig?.missing_configuration ?? []}
          flowError={facebookFlowError}
          redirectStatus={
            facebookRedirectStatus === "success" ||
            facebookRedirectStatus === "error"
              ? facebookRedirectStatus
              : null
          }
          redirectMessage={facebookRedirectMessage}
          connectedCount={facebookConnectedCount}
          onStart={() => void handleStartFacebookPagesLogin()}
        />

        <InstagramBusinessLoginCard
          callbackUrl={instagramConfig?.callback_url}
          loading={instagramConfigLoading}
          launching={startingInstagramLogin}
          ready={instagramConfig?.ready ?? false}
          missingConfiguration={instagramConfig?.missing_configuration ?? []}
          flowError={instagramFlowError}
          redirectStatus={
            instagramRedirectStatus === "success" ||
            instagramRedirectStatus === "error"
              ? instagramRedirectStatus
              : null
          }
          redirectMessage={instagramRedirectMessage}
          connectedCount={instagramConnectedCount}
          onStart={() => void handleStartInstagramBusinessLogin()}
        />

        <AccountCreateForm
          creating={creating}
          onCreate={handleCreateAccount}
        />

        <section className="glass-panel soft-ring rounded-[30px] border border-[var(--color-line)] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
              <DatabaseZap size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
                Backend note
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">
                Knowledge sync is not exposed yet
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                The current server already supports auth, accounts, conversations,
                and replies. A knowledge-base sync endpoint is not present yet, so
                this frontend keeps the settings experience fully working without
                a dead button.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
