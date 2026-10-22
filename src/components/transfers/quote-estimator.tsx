"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type Quote = {
  tier: string;
  percentFeeBps: number;
  totalFlatFeeLamports: number;
  usdEquivalent: number;
};

const DEFAULT_SOL_MINT = "So11111111111111111111111111111111111111112";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101114] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/10";

function formatNumber(value: number, maximumFractionDigits = 4) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function QuoteEstimator() {
  const [tokenMint, setTokenMint] = useState(DEFAULT_SOL_MINT);
  const [amount, setAmount] = useState("1");
  const [tokenDecimals, setTokenDecimals] = useState("9");
  const [hops, setHops] = useState("7");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setQuote(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenMint: tokenMint.trim(),
          amount: amount.trim(),
          tokenDecimals: Number(tokenDecimals),
          hops: Number(hops),
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to get a quote. Please try again.";

        throw new Error(message);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("quote" in data) ||
        typeof data.quote !== "object" ||
        data.quote === null
      ) {
        throw new Error("The server returned an invalid quote.");
      }

      const result = data.quote as Record<string, unknown>;

      if (
        typeof result.tier !== "string" ||
        typeof result.percentFeeBps !== "number" ||
        typeof result.totalFlatFeeLamports !== "number" ||
        typeof result.usdEquivalent !== "number" ||
        !Number.isFinite(result.percentFeeBps) ||
        !Number.isFinite(result.totalFlatFeeLamports) ||
        !Number.isFinite(result.usdEquivalent)
      ) {
        throw new Error("The quote response is missing expected fields.");
      }

      setQuote({
        tier: result.tier,
        percentFeeBps: result.percentFeeBps,
        totalFlatFeeLamports: result.totalFlatFeeLamports,
        usdEquivalent: result.usdEquivalent,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to get a quote. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
          <ShieldCheck className="size-3.5" />
          MultiHopper · Devnet
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Transfers
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Estimate transfer costs before creating a transfer. No wallet
          signature or blockchain transaction is requested by this form.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-[#151619] p-5 sm:p-7"
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Quote parameters
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter values for the token on the selected network.
            </p>
          </div>

          <div>
            <label
              htmlFor="tokenMint"
              className="text-sm font-medium text-zinc-300"
            >
              Token mint address
            </label>
            <input
              id="tokenMint"
              className={inputClass}
              value={tokenMint}
              onChange={(event) => setTokenMint(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
              minLength={32}
              maxLength={44}
              placeholder="Solana token mint address"
            />
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              The default is the wrapped SOL mint used in MultiHopper&apos;s
              documented estimate example. Confirm the mint is supported on
              devnet before requesting a quote.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="amount"
                className="text-sm font-medium text-zinc-300"
              >
                Amount in tokens
              </label>
              <input
                id="amount"
                className={inputClass}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder="1.00"
                required
              />
            </div>

            <div>
              <label
                htmlFor="decimals"
                className="text-sm font-medium text-zinc-300"
              >
                Token decimals
              </label>
              <input
                id="decimals"
                className={inputClass}
                type="number"
                min="0"
                max="18"
                step="1"
                value={tokenDecimals}
                onChange={(event) => setTokenDecimals(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="hops"
              className="text-sm font-medium text-zinc-300"
            >
              Hop count
            </label>
            <input
              id="hops"
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={hops}
              onChange={(event) => setHops(event.target.value)}
              required
            />
            <p className="mt-2 text-xs text-zinc-500">
              MultiHopper validates whether the requested route is supported.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Requesting quote...
              </>
            ) : (
              <>
                Get fee estimate
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#151619] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Quote result</h2>
              {quote && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="size-3.5" />
                  Received
                </span>
              )}
            </div>

            {!quote ? (
              <div className="flex min-h-64 flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <RefreshCw className="size-5 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-300">
                  Your estimate will appear here
                </p>
                <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-500">
                  Submit the form to request a live estimate from the configured
                  MultiHopper environment.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                  <p className="text-xs text-zinc-400">Quote tier</p>
                  <p className="mt-1 text-2xl font-semibold capitalize text-white">
                    {quote.tier}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-zinc-400">
                      Percentage fee
                    </span>
                    <span className="text-right text-sm font-medium text-white">
                      {formatNumber(quote.percentFeeBps / 100, 4)}%
                      <span className="block text-xs font-normal text-zinc-500">
                        {formatNumber(quote.percentFeeBps, 2)} basis points
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-zinc-400">
                      Flat fee
                    </span>
                    <span className="text-right text-sm font-medium text-white">
                      {formatNumber(quote.totalFlatFeeLamports, 0)} lamports
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-zinc-400">
                      USD equivalent
                    </span>
                    <span className="text-right text-sm font-medium text-white">
                      ${formatNumber(quote.usdEquivalent, 2)}
                    </span>
                  </div>
                </div>

                <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-zinc-400">
                  These are the values returned by MultiHopper. The USD
                  equivalent is not labelled as the fee total because the
                  provider response example does not establish that meaning.
                  Review the provider&apos;s quote details before proceeding.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-violet-300" />
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Quote only — no funds move
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Transfer creation, wallet approval, transaction broadcast,
                  and confirmation are separate steps and are not performed
                  by this estimator.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
