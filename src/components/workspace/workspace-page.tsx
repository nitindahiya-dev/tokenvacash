import Link from "next/link";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  FileText,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";

const sections = {
  Transfers: {
    description: "Prepare and track transfers through a clear, auditable workflow.",
    icon: ArrowDownUp,
    items: [
      ["Transfer setup", "Configure an asset, amount, recipient and supported route."],
      ["Quote review", "Review fees and expected receipt before authorizing a transaction."],
      ["Transaction tracking", "Follow transaction status and investigate failures."],
    ],
  },
  Recipients: {
    description: "Organize recipient addresses for your transfer workflows.",
    icon: Users,
    items: [
      ["Saved recipients", "Store verified public wallet addresses and labels."],
      ["Address verification", "Validate address format before preparing a transfer."],
      ["Recipient controls", "Plan allowlists and approval controls for business accounts."],
    ],
  },
  Activity: {
    description: "Review operational events and transfer lifecycle changes.",
    icon: Activity,
    items: [
      ["Transfer events", "Review prepared, submitted, confirmed and failed operations."],
      ["Audit history", "Record important user actions and changes."],
      ["Recovery", "Identify transfers requiring attention or reconciliation."],
    ],
  },
  Reports: {
    description: "Prepare business records for reconciliation and bookkeeping.",
    icon: FileText,
    items: [
      ["Transfer summaries", "Organize transfer amounts, assets and timestamps."],
      ["Reconciliation", "Compare application records with confirmed transaction results."],
      ["Exports", "Provide CSV exports from verified persisted records."],
    ],
  },
  Settings: {
    description: "Configure your workspace, security and integration preferences.",
    icon: Settings2,
    items: [
      ["Workspace", "Manage workspace preferences and organization details."],
      ["Security", "Configure authentication, authorization and audit policies."],
      ["Integrations", "Manage server-side provider configuration and health checks."],
    ],
  },
} as const;

type SectionName = keyof typeof sections;

export function WorkspacePage({ section }: { section: SectionName }) {
  const data = sections[section];
  const Icon = data.icon;

  return (
    <main className="min-h-screen bg-[#090b10] px-4 py-8 text-slate-200 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-emerald-300">Overview</Link>
          <span>/</span>
          <span className="text-slate-300">{section}</span>
        </div>

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
              <Icon size={21} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{section}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{data.description}</p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-300" />
            Integration in progress
          </span>
        </div>

        <div className="mt-8 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <p className="text-sm font-medium text-amber-100">Development workspace</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            These are implementation areas, not completed live services. No real transfers,
            database records or integration health checks are represented here.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {data.items.map(([title, description]) => (
            <article key={title} className="rounded-xl border border-white/[0.07] bg-[#10141d] p-5">
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="mt-3 text-xs leading-6 text-slate-400">{description}</p>
              <div className="mt-5 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">
                Planned workflow
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/[0.07] bg-[#10141d] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Continue exploring</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Return to the overview or open another workspace section.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-[#07120d] hover:bg-emerald-300">
              Back to overview <ArrowRight size={14} />
            </Link>
            <Link href="/transfers" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04]">
              Open transfers <Wallet size={14} />
            </Link>
          </div>
        </div>

        <footer className="mt-10 border-t border-white/[0.06] pt-5 text-[10px] text-slate-600">
          TokenvaCash · A Tokenva product · Development environment
        </footer>
      </div>
    </main>
  );
}
