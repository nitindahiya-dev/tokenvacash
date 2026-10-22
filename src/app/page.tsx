"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownLeft,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type TransferStatus = "Completed" | "Pending" | "Failed";

type Transfer = {
  id: string;
  recipient: string;
  address: string;
  asset: string;
  amount: string;
  date: string;
  status: TransferStatus;
  direction: "sent" | "received";
};

const initialTransfers: Transfer[] = [
  {
    id: "TX-8A31F2",
    recipient: "Solana Foundation",
    address: "7xKX...9mQa",
    asset: "USDC",
    amount: "2,450.00",
    date: "Oct 22, 2026 · 10:42 AM",
    status: "Completed",
    direction: "sent",
  },
  {
    id: "TX-7C19D4",
    recipient: "Treasury wallet",
    address: "9pLm...4kRt",
    asset: "SOL",
    amount: "12.50",
    date: "Oct 22, 2026 · 09:18 AM",
    status: "Pending",
    direction: "sent",
  },
  {
    id: "TX-6B52A1",
    recipient: "Contributor payout",
    address: "3aNv...8wPd",
    asset: "USDC",
    amount: "850.00",
    date: "Oct 21, 2026 · 04:32 PM",
    status: "Completed",
    direction: "sent",
  },
  {
    id: "TX-5D28E7",
    recipient: "Operations wallet",
    address: "5mRq...2zJx",
    asset: "USDC",
    amount: "1,200.00",
    date: "Oct 21, 2026 · 02:05 PM",
    status: "Failed",
    direction: "received",
  },
  {
    id: "TX-4F83C6",
    recipient: "Dev fund",
    address: "8wTp...6nHs",
    asset: "SOL",
    amount: "4.25",
    date: "Oct 20, 2026 · 11:20 AM",
    status: "Completed",
    direction: "sent",
  },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Transfers", icon: ArrowDownUp },
  { label: "Recipients", icon: Wallet },
  { label: "Activity", icon: Activity },
];

const secondaryNavigation = [
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings2 },
];

function StatusBadge({ status }: { status: TransferStatus }) {
  const styles: Record<TransferStatus, string> = {
    Completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    Pending: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    Failed: "border-red-500/20 bg-red-500/10 text-red-400",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      <span className={`size-1.5 rounded-full ${status === "Completed" ? "bg-emerald-400" : status === "Pending" ? "bg-amber-400" : "bg-red-400"}`} />
      {status}
    </span>
  );
}

function AssetIcon({ asset }: { asset: string }) {
  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${asset === "SOL" ? "border-violet-400/20 bg-violet-400/10 text-violet-300" : "border-blue-400/20 bg-blue-400/10 text-blue-300"}`}>
      {asset === "SOL" ? "◎" : "$"}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold tracking-wide text-white">{children}</h2>;
}

export default function Home() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [asset, setAsset] = useState("USDC");
  const [notice, setNotice] = useState("");

  const filteredTransfers = useMemo(() => {
    return initialTransfers.filter((transfer) => {
      const matchesFilter = filter === "All" || transfer.status === filter;
      const term = search.toLowerCase();
      const matchesSearch =
        transfer.recipient.toLowerCase().includes(term) ||
        transfer.id.toLowerCase().includes(term) ||
        transfer.address.toLowerCase().includes(term) ||
        transfer.asset.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  function selectNav(label: string) {
    const routes: Record<string, string> = {
      Overview: "/",
      Transfers: "/transfers",
      Recipients: "/recipients",
      Activity: "/activity",
      Reports: "/reports",
      Settings: "/settings",
    };

    setActiveNav(label);
    setMobileMenu(false);
    setNotice("");

    const route = routes[label];
    if (route) router.push(route);
  }

  function copyDemoAddress() {
    void navigator.clipboard?.writeText("7xKX...9mQa").then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }).catch(() => {
      setNotice("Clipboard access is unavailable in this browser.");
    });
  }

  function handleTransferSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      "Demo only: no quote was requested and no transaction was created. MultiHopper and wallet signing are not connected yet.",
    );
    setShowTransfer(false);
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-slate-200">
      <div className="flex min-h-screen">
        {mobileMenu && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileMenu(false)}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/[0.07] bg-[#0d1017] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-5">
            <button onClick={() => selectNav("Overview")} className="flex items-center gap-3 text-left">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400 text-[#08120f] shadow-[0_0_24px_rgba(52,211,153,0.13)]">
                <ArrowDownUp size={20} strokeWidth={2.5} />
              </span>
              <span>
                <span className="block text-[17px] font-bold tracking-tight text-white">Tokenva<span className="text-emerald-400">Cash</span></span>
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.19em] text-slate-500">Treasury workspace</span>
              </span>
            </button>
            <button onClick={() => setMobileMenu(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden" aria-label="Close menu">
              <X size={18} />
            </button>
          </div>

          <div className="px-4 pt-6">
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</div>
            <button className="flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-sm">
              <span className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">T</span>
                <span className="text-left">
                  <span className="block font-medium text-slate-200">Tokenva Treasury</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Personal workspace</span>
                </span>
              </span>
              <ChevronDown size={15} className="text-slate-500" />
            </button>
          </div>

          <nav className="mt-8 px-3" aria-label="Main navigation">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Manage</div>
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => selectNav(label)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${activeNav === label ? "border border-emerald-400/15 bg-emerald-400/[0.09] font-medium text-emerald-300" : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                {label}
                {label === "Transfers" && <span className="ml-auto rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] text-slate-400">05</span>}
              </button>
            ))}
          </nav>

          <nav className="mt-7 px-3" aria-label="Additional navigation">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace tools</div>
            {secondaryNavigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => selectNav(label)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${activeNav === label ? "bg-emerald-400/[0.09] text-emerald-300" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4">
            <div className="rounded-xl border border-emerald-400/10 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-4">
              <div className="mb-3 flex size-8 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                <ShieldCheck size={17} />
              </div>
              <div className="text-xs font-semibold text-white">You stay in control</div>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-400">Your wallet authorizes transactions. TokenvaCash never needs your recovery phrase.</p>
              <button onClick={() => setNotice("Security information: wallet signing and transaction execution will be enabled after integration and security testing.")} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200">
                Security overview <ArrowRight size={13} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold text-slate-300">N</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-slate-200">Workspace owner</span>
                <span className="mt-1 block text-[10px] text-slate-500">Local preview</span>
              </span>
              <button aria-label="Help" onClick={() => setNotice("Help center will be added with the production support workflow.")} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200">
                <LifeBuoy size={16} />
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#090b10]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileMenu(true)} aria-label="Open navigation" className="rounded-lg border border-white/[0.08] p-2 text-slate-300 lg:hidden">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Workspace</span><span>/</span><span className="text-slate-300">{activeNav}</span>
                </div>
                <h1 className="mt-1 truncate text-base font-semibold tracking-tight text-white">{activeNav}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-400 md:flex">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Solana Devnet
                <ChevronDown size={13} />
              </div>
              <button aria-label="Help center" onClick={() => setNotice("Help center is coming with the production support workflow.")} className="hidden rounded-lg border border-white/[0.07] p-2.5 text-slate-400 hover:bg-white/5 sm:block">
                <CircleHelp size={16} />
              </button>
              <button aria-label="Notifications" onClick={() => setNotice("You have no new notifications in this local preview.")} className="relative rounded-lg border border-white/[0.07] p-2.5 text-slate-400 hover:bg-white/5">
                <Bell size={16} />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-emerald-400" />
              </button>
              <span className="hidden h-7 w-px bg-white/[0.08] sm:block" />
              <span className="flex size-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-xs font-bold text-emerald-300">T</span>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
            {notice && (
              <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                <p className="flex-1 leading-6">{notice}</p>
                <button onClick={() => setNotice("")} aria-label="Dismiss message" className="text-emerald-200/60 hover:text-emerald-100"><X size={16} /></button>
              </div>
            )}

            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex size-5 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]"><Command size={11} /></span>
                  Thursday, October 22, 2026
                </div>
                <h2 className="text-[26px] font-semibold tracking-tight text-white sm:text-[32px]">Good morning<span className="text-emerald-400">.</span></h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Your transfer operations, all in one place. Here's your workspace at a glance.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button onClick={() => setNotice("This workspace currently uses illustrative demo data. Report export will be enabled with persisted transfer records.")} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.025] px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]">
                  <Download size={15} /> Export report
                </button>
                <button onClick={() => { setShowTransfer(true); setNotice(""); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-[#07120d] shadow-[0_4px_20px_rgba(52,211,153,0.12)] transition hover:bg-emerald-300">
                  <Plus size={16} strokeWidth={2.5} /> New transfer
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.045] px-4 py-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><Globe2 size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-amber-100">Development environment</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">This dashboard contains illustrative data. No wallet is connected, no live balances are loaded, and transfers cannot be submitted yet.</p>
              </div>
              <span className="hidden rounded-full border border-amber-400/20 px-2 py-1 text-[10px] font-medium text-amber-300 sm:inline-flex">DEVNET</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141d] p-5">
                <div className="absolute -right-8 -top-10 size-32 rounded-full bg-emerald-400/[0.045] blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total balance</span>
                  <button aria-label={showBalance ? "Hide demo balance" : "Show demo balance"} onClick={() => setShowBalance(!showBalance)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300">
                    {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
                <div className="relative mt-4 flex items-baseline gap-2">
                  <span className="text-[27px] font-semibold tracking-tight text-white">{showBalance ? "$24,680.50" : "••••••••"}</span>
                  <span className="text-[10px] text-slate-500">USD</span>
                </div>
                <div className="relative mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-400"><ArrowUpRight size={13} /> 8.2%</span>
                  illustrative change · not live
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#10141d] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Transfer volume</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300"><ArrowDownUp size={16} /></span>
                </div>
                <div className="mt-4 text-[27px] font-semibold tracking-tight text-white">$18,420.00</div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
                  <span className="text-slate-300">Last 30 days</span> · demo figures
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#10141d] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total transfers</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><Activity size={16} /></span>
                </div>
                <div className="mt-4 text-[27px] font-semibold tracking-tight text-white">128</div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
                  <span className="text-slate-300">Demo count</span> · not on-chain activity
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#10141d] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Pending transfers</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><Clock3 size={16} /></span>
                </div>
                <div className="mt-4 text-[27px] font-semibold tracking-tight text-white">02</div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
                  <span className="text-amber-300">Demo status</span> · requires integration
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
              <section className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141d]">
                <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionTitle>Recent transfers</SectionTitle>
                    <p className="mt-1.5 text-xs text-slate-500">Review your latest transfer activity</p>
                  </div>
                  <button onClick={() => selectNav("Transfers")} className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-emerald-300 hover:text-emerald-200 sm:self-auto">
                    View all <ArrowRight size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transfers..." aria-label="Search transfers" className="h-9 w-full rounded-lg border border-white/[0.07] bg-[#0b0e15] pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-400/40" />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {["All", "Completed", "Pending", "Failed"].map((status) => (
                      <button key={status} onClick={() => setFilter(status)} className={`whitespace-nowrap rounded-md px-2.5 py-2 text-[11px] transition ${filter === status ? "bg-white/[0.09] font-medium text-white" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"}`}>
                        {status}
                      </button>
                    ))}
                    <button aria-label="Filter options" onClick={() => setNotice("Additional transfer filters will be available when live transfer records are connected.")} className="rounded-md p-2 text-slate-500 hover:bg-white/[0.04]"><Filter size={14} /></button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[630px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        <th className="px-5 py-3.5">Recipient</th>
                        <th className="px-4 py-3.5">Amount</th>
                        <th className="px-4 py-3.5">Date</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransfers.map((transfer) => (
                        <tr key={transfer.id} className="border-b border-white/[0.045] transition last:border-0 hover:bg-white/[0.018]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <AssetIcon asset={transfer.asset} />
                              <div>
                                <div className="whitespace-nowrap text-xs font-medium text-slate-200">{transfer.recipient}</div>
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">{transfer.id}<span className="text-slate-700">·</span>{transfer.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="whitespace-nowrap text-xs font-medium text-slate-200">{transfer.direction === "sent" ? "−" : "+"}{transfer.amount} <span className="text-slate-400">{transfer.asset}</span></div>
                            <div className="mt-1 text-[10px] text-slate-600">{transfer.direction === "sent" ? "Outgoing" : "Incoming"}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[10px] text-slate-400">{transfer.date}</td>
                          <td className="px-4 py-4"><StatusBadge status={transfer.status} /></td>
                          <td className="px-4 py-4">
                            <button aria-label={`Details for ${transfer.id}`} onClick={() => setNotice(`${transfer.id}: illustrative ${transfer.status.toLowerCase()} record. On-chain signature and authoritative status are not available in this demo.`)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"><MoreHorizontal size={16} /></button>
                          </td>
                        </tr>
                      ))}
                      {filteredTransfers.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-12 text-center">
                          <Search size={20} className="mx-auto mb-3 text-slate-600" />
                          <p className="text-xs font-medium text-slate-300">No matching transfers</p>
                          <p className="mt-1 text-[11px] text-slate-500">Try another search or status filter.</p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5">
                  <span className="text-[10px] text-slate-500">Illustrative records · not live blockchain data</span>
                  <button onClick={() => { setSearch(""); setFilter("All"); }} className="text-[11px] font-medium text-slate-400 hover:text-white">Reset filters</button>
                </div>
              </section>

              <div className="flex flex-col gap-6">
                <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141d]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
                    <div>
                      <SectionTitle>Quick actions</SectionTitle>
                      <p className="mt-1.5 text-xs text-slate-500">Shortcuts for your workflow</p>
                    </div>
                    <Zap size={17} className="text-emerald-300" />
                  </div>
                  <div className="space-y-2 p-3">
                    <button onClick={() => { setShowTransfer(true); setNotice(""); }} className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 text-left transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.035]">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><ArrowUpRight size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-200">Send a transfer</span><span className="mt-1 block text-[10px] text-slate-500">Configure a new transfer</span></span>
                      <ArrowRight size={15} className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-300" />
                    </button>
                    <button onClick={() => selectNav("Recipients")} className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.035]">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300"><Wallet size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-200">Manage recipients</span><span className="mt-1 block text-[10px] text-slate-500">Saved wallet addresses</span></span>
                      <ArrowRight size={15} className="text-slate-600 transition group-hover:translate-x-0.5" />
                    </button>
                    <button onClick={() => selectNav("Reports")} className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.035]">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><FileText size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-200">Transfer reports</span><span className="mt-1 block text-[10px] text-slate-500">Records and reconciliation</span></span>
                      <ArrowRight size={15} className="text-slate-600 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141d] p-5">
                  <div className="absolute -right-12 -top-12 size-36 rounded-full bg-emerald-400/[0.06] blur-3xl" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-300" /><SectionTitle>Network status</SectionTitle></div>
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[10px] text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-400" />UI ready</span>
                  </div>
                  <p className="relative mt-2 text-xs leading-5 text-slate-400">The interface is running locally. Blockchain connectivity and MultiHopper service health have not been checked.</p>
                  <div className="relative mt-4 space-y-3 border-t border-white/[0.06] pt-4">
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Application</span><span className="text-emerald-300">Running locally</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Wallet connection</span><span className="text-slate-500">Not connected</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-400">MultiHopper API</span><span className="text-slate-500">Not configured</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Live transaction data</span><span className="text-slate-500">Unavailable</span></div>
                  </div>
                  <button onClick={() => setNotice("Integration health checks will report real API, RPC, database, and wallet states after these services are configured.")} className="relative mt-5 inline-flex items-center gap-2 text-xs font-medium text-emerald-300 hover:text-emerald-200">View integration details <ExternalLink size={13} /></button>
                </section>
              </div>
            </div>

            <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>© 2026 TokenvaCash · A Tokenva product</span>
              <span className="flex items-center gap-2"><ShieldCheck size={12} /> Non-custodial design · Devnet preview</span>
            </footer>
          </div>
        </section>
      </div>

      {showTransfer && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTransfer(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[#10141d] p-5 shadow-2xl sm:rounded-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><ArrowDownUp size={18} /></div>
                <h2 id="transfer-title" className="text-lg font-semibold text-white">New transfer</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-400">Prepare a transfer for review. Live quoting and submission are not enabled.</p>
              </div>
              <button onClick={() => setShowTransfer(false)} aria-label="Close transfer form" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={17} /></button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-5">
              <div>
                <label htmlFor="asset" className="mb-2 block text-xs font-medium text-slate-300">Asset</label>
                <select id="asset" value={asset} onChange={(event) => setAsset(event.target.value)} className="h-11 w-full rounded-lg border border-white/[0.09] bg-[#0b0e15] px-3 text-sm text-white outline-none focus:border-emerald-400/40">
                  <option value="USDC">USDC · USD Coin</option>
                  <option value="SOL">SOL · Solana</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="mb-2 block text-xs font-medium text-slate-300">Amount</label>
                <div className="relative">
                  <input id="amount" inputMode="decimal" required minLength={1} maxLength={30} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="h-12 w-full rounded-lg border border-white/[0.09] bg-[#0b0e15] px-3 pr-20 text-lg text-white outline-none placeholder:text-slate-700 focus:border-emerald-400/40" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{asset}</span>
                </div>
              </div>
              <div>
                <label htmlFor="recipient" className="mb-2 block text-xs font-medium text-slate-300">Recipient wallet address</label>
                <input id="recipient" required minLength={32} maxLength={64} value={recipient} onChange={(event) => setRecipient(event.target.value.trim())} placeholder="Enter a Solana public key" className="h-11 w-full rounded-lg border border-white/[0.09] bg-[#0b0e15] px-3 font-mono text-xs text-white outline-none placeholder:font-sans placeholder:text-slate-600 focus:border-emerald-400/40" />
                <p className="mt-2 text-[10px] leading-5 text-slate-500">This preview does not yet validate addresses on-chain or verify asset balances.</p>
              </div>
              <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.045] p-3.5">
                <div className="flex gap-2.5">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-300" />
                  <p className="text-[11px] leading-5 text-slate-400">No funds will move. The next integration step is to obtain a live quote from MultiHopper, validate fees, and request explicit wallet authorization.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowTransfer(false)} className="h-11 flex-1 rounded-lg border border-white/[0.09] text-xs font-medium text-slate-300 transition hover:bg-white/[0.04]">Cancel</button>
                <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 text-xs font-semibold text-[#07120d] transition hover:bg-emerald-300">Review transfer <ArrowRight size={15} /></button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
