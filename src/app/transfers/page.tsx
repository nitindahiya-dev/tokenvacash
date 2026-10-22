import type { Metadata } from "next";
import { CreateTransferForm } from "@/components/transfers/create-transfer-form";
import { QuoteEstimator } from "@/components/transfers/quote-estimator";
import { WalletConnectButton } from "@/components/solana/wallet-connect-button";
import { WalletSignIn } from "@/components/auth/wallet-sign-in";

export const metadata: Metadata = {
  title: "Transfers",
  description: "Estimate fees and create transfer requests with MultiHopper.",
};

export default function TransfersPage() {
  return (
    <main className="min-h-screen bg-[#0c0d0f] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-white/10 bg-[#151619] p-5">
        <h2 className="mb-2 text-base font-semibold text-white">
          Solana wallet
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Connect your wallet before preparing a transfer.
        </p>
        <WalletConnectButton />
      </section>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <WalletSignIn />
        <QuoteEstimator />
        <CreateTransferForm />
      </div>
    </main>
  );
}
