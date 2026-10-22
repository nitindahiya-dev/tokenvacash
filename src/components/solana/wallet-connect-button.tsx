"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CheckCircle2, CircleAlert } from "lucide-react";

export function WalletConnectButton() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="space-y-2">
      <WalletMultiButton
        style={{
          background: "#8b5cf6",
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: 600,
          height: "44px",
        }}
      />

      {connected && publicKey && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-200">
              Wallet connected
            </p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-400">
              {publicKey.toBase58()}
            </p>
          </div>
        </div>
      )}

      {!connected && (
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <CircleAlert className="size-3.5 shrink-0" />
          Connect a Solana wallet on the configured network.
        </p>
      )}
    </div>
  );
}
