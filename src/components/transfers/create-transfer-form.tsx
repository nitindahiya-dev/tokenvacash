"use client";

import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  CircleAlert,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const DEFAULT_SOL_MINT = "So11111111111111111111111111111111111111112";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101114] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/70";

type TransferResult = Record<string, unknown>;

export function CreateTransferForm() {
  const { connected, publicKey } = useWallet();

  const [tokenMint, setTokenMint] = useState(DEFAULT_SOL_MINT);
  const [tokenSymbol, setTokenSymbol] = useState("SOL");
  const [amount, setAmount] = useState("1");
  const [decimals, setDecimals] = useState("9");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [hops, setHops] = useState("7");
  const [arrivalSeconds, setArrivalSeconds] = useState("300");
  const [externalId, setExternalId] = useState("");
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const senderAddress = publicKey?.toBase58() ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!connected || !publicKey) {
      setError("Connect your Solana wallet before creating a transfer.");
      return;
    }

    if (senderAddress === recipientWallet.trim()) {
      setError("Sender and recipient wallets must be different.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenMint: tokenMint.trim(),
          tokenSymbol: tokenSymbol.trim(),
          amount: amount.trim(),
          tokenDecimals: Number(decimals),
          sourceOwner: senderAddress,
          recipientWallet: recipientWallet.trim(),
          hops: Number(hops),
          arrivalSeconds: Number(arrivalSeconds),
          ...(externalId.trim() ? { externalId: externalId.trim() } : {}),
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
            : "Unable to create the transfer request.";

        throw new Error(message);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("transfer" in data) ||
        typeof data.transfer !== "object" ||
        data.transfer === null
      ) {
        throw new Error("The server returned an unexpected transfer response.");
      }

      setResult(data.transfer as TransferResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the transfer request.",
      );
    } finally {
      setLoading(false);
    }
  }

  const transferId =
    result && typeof result.id === "string" ? result.id : null;

  const transferStatus =
    result && typeof result.status === "string" ? result.status : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151619] p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Create transfer request
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">
          Your connected wallet supplies the sender address. Review all
          details carefully before submitting the request.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="size-4 text-violet-300" />
            <p className="text-sm font-medium text-zinc-200">
              Connected sender wallet
            </p>
          </div>

          {connected && publicKey ? (
            <div>
              <p className="break-all font-mono text-xs leading-6 text-emerald-200">
                {senderAddress}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Taken directly from your connected wallet.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-amber-200">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              Connect your Solana wallet using the wallet button above before
              creating a transfer.
            </div>
          )}
        </div>

        <div>
          <label htmlFor="create-mint" className="text-sm text-zinc-300">
            Token mint
          </label>
          <input
            id="create-mint"
            className={fieldClass}
            value={tokenMint}
            onChange={(event) => setTokenMint(event.target.value)}
            minLength={32}
            maxLength={44}
            required
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="create-symbol" className="text-sm text-zinc-300">
              Token symbol
            </label>
            <input
              id="create-symbol"
              className={fieldClass}
              value={tokenSymbol}
              onChange={(event) => setTokenSymbol(event.target.value)}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label htmlFor="create-amount" className="text-sm text-zinc-300">
              Amount
            </label>
            <input
              id="create-amount"
              className={fieldClass}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="create-decimals" className="text-sm text-zinc-300">
            Token decimals
          </label>
          <input
            id="create-decimals"
            className={fieldClass}
            type="number"
            min="0"
            max="18"
            step="1"
            value={decimals}
            onChange={(event) => setDecimals(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="recipient-wallet" className="text-sm text-zinc-300">
            Recipient wallet address
          </label>
          <input
            id="recipient-wallet"
            className={fieldClass}
            value={recipientWallet}
            onChange={(event) => setRecipientWallet(event.target.value)}
            minLength={32}
            maxLength={44}
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="create-hops" className="text-sm text-zinc-300">
              Hop count
            </label>
            <input
              id="create-hops"
              className={fieldClass}
              type="number"
              min="1"
              step="1"
              value={hops}
              onChange={(event) => setHops(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="arrival-seconds" className="text-sm text-zinc-300">
              Arrival time (seconds)
            </label>
            <input
              id="arrival-seconds"
              className={fieldClass}
              type="number"
              min="1"
              step="1"
              value={arrivalSeconds}
              onChange={(event) => setArrivalSeconds(event.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="external-id" className="text-sm text-zinc-300">
            Your reference ID (optional)
          </label>
          <input
            id="external-id"
            className={fieldClass}
            value={externalId}
            onChange={(event) => setExternalId(event.target.value)}
            maxLength={100}
            placeholder="e.g. payroll-oct-001"
          />
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

        {result && (
          <div
            role="status"
            className="space-y-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm"
          >
            <p className="font-semibold text-emerald-200">
              MultiHopper returned a response
            </p>

            {transferId && (
              <p className="break-all text-zinc-300">
                Transfer ID: <span className="font-mono">{transferId}</span>
              </p>
            )}

            {transferStatus && (
              <p className="text-zinc-300">Status: {transferStatus}</p>
            )}

            <p className="text-xs leading-5 text-zinc-400">
              A transfer request is not a completed transaction. No wallet
              signing or transaction broadcasting happens in this form.
            </p>

            {!transferId && (
              <pre className="overflow-auto whitespace-pre-wrap break-words text-xs text-zinc-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-violet-300" />
            <p className="text-xs leading-5 text-zinc-400">
              Never share your seed phrase or private key. Connecting a wallet
              does not automatically authorize or sign a transaction.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !connected || !publicKey}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Creating request...
            </>
          ) : (
            <>
              Create transfer request
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
