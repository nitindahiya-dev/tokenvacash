"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

type SessionState = {
  authenticated: boolean;
  address?: string;
  expiresAt?: string;
};

export function WalletSignIn() {
  const { connected, publicKey, signMessage } = useWallet();
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setError("");
    setLoading(true);

    try {
      if (!connected || !publicKey) {
        throw new Error("Connect your wallet first.");
      }

      if (!signMessage) {
        throw new Error(
          "This wallet does not support message signing. Choose a compatible wallet.",
        );
      }

      const address = publicKey.toBase58();

      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        cache: "no-store",
      });

      const challengeData: unknown = await challengeResponse.json();

      if (
        !challengeResponse.ok ||
        typeof challengeData !== "object" ||
        challengeData === null ||
        !("message" in challengeData) ||
        typeof challengeData.message !== "string" ||
        !("nonce" in challengeData) ||
        typeof challengeData.nonce !== "string"
      ) {
        throw new Error("Unable to obtain an authentication challenge.");
      }

      const signature = await signMessage(
        new TextEncoder().encode(challengeData.message),
      );

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nonce: challengeData.nonce,
          signature: btoa(String.fromCharCode(...signature)),
        }),
        cache: "no-store",
      });

      const verifyData: unknown = await verifyResponse.json();

      if (
        !verifyResponse.ok ||
        typeof verifyData !== "object" ||
        verifyData === null ||
        !("authenticated" in verifyData) ||
        verifyData.authenticated !== true ||
        !("address" in verifyData) ||
        verifyData.address !== address
      ) {
        const message =
          typeof verifyData === "object" &&
          verifyData !== null &&
          "error" in verifyData &&
          typeof verifyData.error === "string"
            ? verifyData.error
            : "Wallet authentication failed.";

        throw new Error(message);
      }

      const sessionResponse = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const sessionData = (await sessionResponse.json()) as SessionState;

      if (!sessionResponse.ok || !sessionData.authenticated) {
        throw new Error("The server did not confirm the new session.");
      }

      setSession(sessionData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wallet authentication failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out.");
      }

      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#151619] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 size-5 shrink-0 text-violet-300" />
        <div>
          <h2 className="font-semibold text-white">Wallet authentication</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Sign a one-time message to prove wallet ownership. This is not a
            blockchain transaction and does not move funds.
          </p>
        </div>
      </div>

      {session?.authenticated ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <CheckCircle2 className="size-4" />
            Wallet authenticated
          </div>
          <p className="break-all font-mono text-xs text-zinc-400">
            {session.address}
          </p>
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/5 disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={signIn}
          disabled={loading || !connected || !publicKey}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Verifying wallet...
            </>
          ) : (
            "Sign message to authenticate"
          )}
        </button>
      )}

      {!connected && !session?.authenticated && (
        <p className="text-xs text-zinc-500">
          Connect your Solana wallet before signing in.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-300"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </section>
  );
}
