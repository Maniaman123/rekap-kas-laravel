/**
 * KasSiswa.jsx — Read-only student cash monitor for "Rekap Uang Kas XI PPLG 2"
 *
 * Props (from TransactionController@index via Inertia — same shape as Dashboard):
 *   auth            { user: { name, email, role } }
 *   transactions    Laravel paginator object
 *   totalMasuk      integer (whole Rupiah)
 *   totalKeluar     integer (whole Rupiah)
 *   sisaSaldo       integer (whole Rupiah)
 *   categories      string[]
 *   filters         { search?, category?, start_date?, end_date? }
 *
 * Security guarantee: ZERO create / update / delete controls exist in this file.
 */

import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CalendarDays,
    ChevronRight,
    Clock,
    History,
    LogOut,
    Receipt,
    Search,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
// navy   = #1E3A8A   dominant — balance card, nav accents
// blue   = #4B729F   secondary — subtext, icons
// yellow = #FACC15   highlight — student badge, accents
// ice    = #E0F2FE   surface — header bg, pill bg, table thead
// canvas = #F8FAFC   page background

const CATEGORIES = [
    'Kas Wajib',
    'Kas Susulan',
    'Denda / Sanksi',
    'Konsumsi',
    'ATK',
    'Kegiatan',
    'Lainnya',
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
        style:                 'currency',
        currency:              'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const formatDateShort = (str) =>
    new Date(str).toLocaleDateString('id-ID', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
    });

const formatDateFull = (str) =>
    new Date(str).toLocaleDateString('id-ID', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
        year:    'numeric',
    });

function formatDatetime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

/** Debounce — returns a stable debounced function via ref */
function useDebounce(fn, delay) {
    const timer = useRef(null);
    return (...args) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => fn(...args), delay);
    };
}

// ─── Category badge ───────────────────────────────────────────────────────────

const CAT_COLORS = {
    'Kas Wajib':     { bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200/60'   },
    'Kas Susulan':   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   ring: 'ring-cyan-200/60'   },
    'Denda / Sanksi':{ bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200/60'  },
    Konsumsi:        { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200/60' },
    ATK:             { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200/60' },
    Kegiatan:        { bg: 'bg-teal-50',   text: 'text-teal-700',   ring: 'ring-teal-200/60'   },
    Lainnya:         { bg: 'bg-slate-100', text: 'text-slate-600',  ring: 'ring-slate-200/60'  },
};

function CategoryBadge({ category, size = 'sm' }) {
    const c = CAT_COLORS[category] ?? CAT_COLORS['Lainnya'];
    return (
        <span className={`inline-flex shrink-0 items-center rounded-md ring-1 font-semibold ${c.bg} ${c.text} ${c.ring} ${
            size === 'xs' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]'
        }`}>
            {category}
        </span>
    );
}

// ─── Edit History Modal ───────────────────────────────────────────────────────

function EditHistoryModal({ transaction, onClose }) {
    const open  = transaction !== null;
    const edits = transaction?.edits ?? [];

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                            <Dialog.Panel className="w-full overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-slate-200/80 sm:max-w-lg sm:rounded-2xl">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><History size={15} /></div>
                                        <Dialog.Title className="text-[15px] font-bold text-slate-900">Riwayat Perubahan Data</Dialog.Title>
                                    </div>
                                    <button type="button" onClick={onClose} aria-label="Tutup modal" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                                    {edits.length === 0 ? (
                                        <p className="text-center text-sm text-slate-400 py-6">Belum ada riwayat perubahan.</p>
                                    ) : (
                                        <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                                            {edits.map((edit) => (
                                                <li key={edit.id} className="relative">
                                                    <span className="absolute -left-[1.4rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 ring-2 ring-white">
                                                        <Clock size={10} className="text-indigo-500" />
                                                    </span>
                                                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                                                        <div className="mb-2 flex items-center justify-between gap-2">
                                                            <span className="text-xs font-semibold text-slate-700">{edit.user?.name ?? 'Unknown'}</span>
                                                            <time className="font-mono tabular-nums text-[10px] text-slate-400">{formatDatetime(edit.created_at)}</time>
                                                        </div>
                                                        <div className="space-y-1.5 text-xs">
                                                            {edit.old_amount !== edit.new_amount && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-16 shrink-0 text-slate-500">Nominal</span>
                                                                    <span className="font-mono text-rose-500 line-through">{formatRupiah(edit.old_amount)}</span>
                                                                    <ArrowRight size={10} className="shrink-0 text-slate-400" />
                                                                    <span className="font-mono font-semibold text-emerald-600">{formatRupiah(edit.new_amount)}</span>
                                                                </div>
                                                            )}
                                                            {edit.old_description !== edit.new_description && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="w-16 shrink-0 text-slate-500">Ket.</span>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-rose-500 line-through">{edit.old_description || '—'}</span>
                                                                        <span className="font-semibold text-slate-700">{edit.new_description || '—'}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {edit.edit_reason && (
                                                                <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-amber-800 ring-1 ring-amber-200/60">
                                                                    <span className="font-semibold">Alasan: </span>{edit.edit_reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                                <div className="border-t border-slate-100 px-6 py-3.5 text-right">
                                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">Tutup</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniCard({ label, value, icon: Icon, type }) {
    const isMasuk = type === 'masuk';
    return (
        <div className={`flex flex-1 flex-col gap-2 rounded-2xl border p-4 ${
            isMasuk ? 'border-emerald-100 bg-emerald-50/60' : 'border-rose-100 bg-rose-50/60'
        }`}>
            <div className="flex items-center justify-between">
                <p className={`text-[11px] font-semibold uppercase tracking-widest ${isMasuk ? 'text-emerald-700' : 'text-rose-600'}`}>{label}</p>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isMasuk ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                    <Icon size={13} strokeWidth={2.5} />
                </div>
            </div>
            <p className={`font-mono tabular-nums text-base font-bold leading-none ${isMasuk ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatRupiah(value)}
            </p>
        </div>
    );
}

function TxCard({ tx, onShowHistory }) {
    const isMasuk = tx.type === 'masuk';
    return (
        <article className="flex gap-3 px-4 py-4">
            <div className="flex flex-col items-center pt-0.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white ${
                    isMasuk ? 'bg-emerald-100 text-emerald-600 ring-emerald-100' : 'bg-rose-100 text-rose-500 ring-rose-100'
                }`}>
                    {isMasuk ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                </div>
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <CategoryBadge category={tx.category} size="xs" />
                            <time dateTime={tx.transaction_date} className="font-mono tabular-nums text-[10px] text-slate-400">
                                {formatDateShort(tx.transaction_date)}
                            </time>
                            {tx.edits?.length > 0 && (
                                <button type="button" onClick={() => onShowHistory(tx)} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-200/60 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                    <History size={9} />Diedit ({tx.edits.length})
                                </button>
                            )}
                        </div>
                        {tx.description && <p className="mt-1 text-sm leading-snug text-slate-700 line-clamp-2">{tx.description}</p>}
                        {!tx.description && <p className="mt-1 text-sm text-slate-400 italic">Tidak ada keterangan</p>}
                    </div>
                    <div className="shrink-0 text-right">
                        <p className={`font-mono tabular-nums text-sm font-bold leading-none ${isMasuk ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isMasuk ? '+' : '−'} {formatRupiah(tx.amount)}
                        </p>
                        <p className={`mt-1 text-[10px] font-semibold ${isMasuk ? 'text-emerald-600/70' : 'text-rose-500/70'}`}>
                            {isMasuk ? 'Masuk' : 'Keluar'}
                        </p>
                    </div>
                </div>
                {tx.user?.name && (
                    <p className="mt-1.5 text-[10px] text-slate-400">
                        Dicatat oleh <span className="font-medium text-slate-500">{tx.user.name}</span>
                    </p>
                )}
            </div>
        </article>
    );
}

function TxRow({ tx, onShowHistory }) {
    const isMasuk = tx.type === 'masuk';
    return (
        <tr className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-[#E0F2FE]/20">
            <td className="px-5 py-3.5">
                <time dateTime={tx.transaction_date} className="font-mono tabular-nums text-xs text-slate-500" title={formatDateFull(tx.transaction_date)}>
                    {formatDateShort(tx.transaction_date)}
                </time>
            </td>
            <td className="px-5 py-3.5"><CategoryBadge category={tx.category} /></td>
            <td className="max-w-[220px] px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm text-slate-700">
                        {tx.description || <span className="italic text-slate-400">—</span>}
                    </p>
                    {tx.edits?.length > 0 && (
                        <button type="button" onClick={() => onShowHistory(tx)} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-200/60 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={`Lihat ${tx.edits.length} riwayat edit`}>
                            <History size={9} />Diedit ({tx.edits.length})
                        </button>
                    )}
                </div>
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                    isMasuk ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60' : 'bg-rose-50 text-rose-600 ring-rose-200/60'
                }`}>
                    {isMasuk ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isMasuk ? 'Masuk' : 'Keluar'}
                </span>
            </td>
            <td className="whitespace-nowrap px-5 py-3.5 text-right">
                <span className={`font-mono tabular-nums text-sm font-bold ${isMasuk ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isMasuk ? '+' : '−'} {formatRupiah(tx.amount)}
                </span>
            </td>
        </tr>
    );
}

function EmptyState({ hasFilters, onClear }) {
    return (
        <div role="status" className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0F2FE]">
                {hasFilters ? <Search size={22} className="text-[#4B729F]" /> : <Receipt size={22} className="text-[#4B729F]" />}
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
                {hasFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
            </h3>
            <p className="mt-1 max-w-[22ch] text-xs text-slate-400 leading-relaxed">
                {hasFilters
                    ? 'Coba ubah kata kunci atau hapus filter yang aktif.'
                    : 'Transaksi kas kelas akan muncul di sini setelah dicatat oleh bendahara.'}
            </p>
            {hasFilters && (
                <button type="button" onClick={onClear} className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                    <X size={12} />Hapus filter
                </button>
            )}
        </div>
    );
}

function Pagination({ meta }) {
    function goTo(url) {
        if (!url) return;
        router.get(url, {}, { preserveState: true, replace: true, preserveScroll: false });
        document.getElementById('ledger-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-500">
                <span className="font-mono tabular-nums font-semibold text-slate-700">{meta.from ?? 0}–{meta.to ?? 0}</span>
                {' '}dari{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-700">{(meta.total ?? 0).toLocaleString('id-ID')}</span>
                {' '}transaksi
            </p>
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => goTo(meta.prev_page_url)} disabled={!meta.prev_page_url} aria-label="Halaman sebelumnya" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                    <ArrowLeft size={14} />
                </button>
                <span className="min-w-[4rem] rounded-lg border border-[#E0F2FE] bg-[#E0F2FE]/60 px-2 py-1 text-center font-mono tabular-nums text-xs font-semibold text-[#1E3A8A]">
                    {meta.current_page} / {meta.last_page}
                </span>
                <button type="button" onClick={() => goTo(meta.next_page_url)} disabled={!meta.next_page_url} aria-label="Halaman berikutnya" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KasSiswa({
    auth,
    transactions,
    totalMasuk  = 0,
    totalKeluar = 0,
    sisaSaldo   = 0,
    categories  = CATEGORIES,
    filters     = {},
}) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [search,        setSearch]        = useState(filters.search     ?? '');
    const [activecat,     setActivecat]     = useState(filters.category   ?? '');
    const [startDate,     setStartDate]     = useState(filters.start_date ?? '');
    const [endDate,       setEndDate]       = useState(filters.end_date   ?? '');
    const [historyTarget, setHistoryTarget] = useState(null);
    const [flashVisible,  setFlashVisible]  = useState(false);
    const flashMessage = flash?.success ?? null;

    useEffect(() => {
        if (!flashMessage) return;
        setFlashVisible(true);
        const t = setTimeout(() => setFlashVisible(false), 4000);
        return () => clearTimeout(t);
    }, [flashMessage]);

    const txList           = transactions?.data ?? [];
    const hasActiveFilters = search || activecat || startDate || endDate;

    const navigate = useDebounce((params) => {
        const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
        router.get(route('transactions.index'), clean, { preserveState: true, replace: true, preserveScroll: true });
    }, 350);

    function applyFilters(overrides = {}) {
        navigate({ search, category: activecat, start_date: startDate, end_date: endDate, ...overrides });
    }

    function handleSearch(e) { setSearch(e.target.value); applyFilters({ search: e.target.value }); }

    function selectCategory(cat) {
        const next = activecat === cat ? '' : cat;
        setActivecat(next);
        applyFilters({ category: next });
    }

    function clearFilters() {
        setSearch(''); setActivecat(''); setStartDate(''); setEndDate('');
        router.get(route('transactions.index'), {}, { preserveState: false, replace: true });
    }

    return (
        <>
            <Head title="Kas Kelas — XI PPLG 2" />

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: no-preference) {
                    .ks-enter    { animation: slide-up 350ms cubic-bezier(0.22,1,0.36,1) both; }
                    .ks-enter-d1 { animation-delay: 30ms;  }
                    .ks-enter-d2 { animation-delay: 80ms;  }
                    .ks-enter-d3 { animation-delay: 130ms; }
                    .ks-enter-d4 { animation-delay: 180ms; }
                }
                .pills-scroll::-webkit-scrollbar { display: none; }
                .pills-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">

                {/* ── HEADER ── */}
                <header className="sticky top-0 z-40 border-b border-[#E0F2FE] bg-white/95 backdrop-blur-md">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A]">
                                <Wallet size={15} strokeWidth={2} className="text-[#FACC15]" />
                            </div>
                            <div className="leading-none">
                                <p className="text-[13px] font-bold tracking-tight text-[#1E3A8A]">XI PPLG 2 Kas</p>
                                <p className="mt-0.5 text-[10px] font-medium text-[#4B729F]">Rekap Uang Kelas</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden items-center gap-2 rounded-full bg-[#E0F2FE] px-3 py-1.5 sm:flex">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-[9px] font-bold text-[#FACC15]">
                                    {auth?.user?.name?.[0]?.toUpperCase() ?? 'S'}
                                </div>
                                <div className="leading-none">
                                    <p className="text-[11px] font-semibold text-[#1E3A8A] leading-none">{auth?.user?.name ?? 'Siswa'}</p>
                                    <p className="mt-0.5 text-[9px] text-[#4B729F]">Pelajar</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-[#FACC15]/20 px-2.5 py-1 sm:hidden">
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-[8px] font-bold text-[#FACC15]">
                                    {auth?.user?.name?.[0]?.toUpperCase() ?? 'S'}
                                </div>
                                <span className="text-[10px] font-semibold text-[#1E3A8A]">Pelajar</span>
                            </div>
                            <Link
                                method="post"
                                as="button"
                                href={route('logout')}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:min-h-0 sm:min-w-0"
                                aria-label="Keluar dari akun"
                            >
                                <LogOut size={13} />
                                <span className="hidden sm:inline">Keluar</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6">

                    {/* ── BALANCE CARD ── */}
                    <section aria-label="Saldo Kas" className="ks-enter ks-enter-d1 mb-4">
                        <div
                            className="relative overflow-hidden rounded-2xl bg-[#1E3A8A] px-5 py-6 shadow-lg shadow-[#1E3A8A]/20"
                            style={sisaSaldo < 0 ? { background: 'linear-gradient(135deg,#7f1d1d,#991b1b)' } : {}}
                        >
                            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full border-[20px] border-white/5" />
                            <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full border-[14px] border-white/5" />
                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Saldo Bersama</p>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                                        <BookOpen size={13} strokeWidth={2} className="text-[#FACC15]" />
                                    </div>
                                </div>
                                <p className="mt-3 font-mono tabular-nums text-[2rem] font-extrabold leading-none tracking-tight text-white sm:text-4xl">
                                    {formatRupiah(sisaSaldo)}
                                </p>
                                {sisaSaldo < 0 && (
                                    <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-rose-200">
                                        ⚠ Saldo defisit — pengeluaran melebihi pemasukan
                                    </p>
                                )}
                                <p className="mt-2 flex items-center gap-1 text-[11px] text-white/50">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
                                    Saldo aktif kas XI PPLG 2
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex gap-3">
                            <MiniCard label="Pemasukan"  value={totalMasuk}  icon={TrendingUp}   type="masuk"  />
                            <MiniCard label="Pengeluaran" value={totalKeluar} icon={TrendingDown} type="keluar" />
                        </div>
                    </section>

                    {/* ── FILTER & SEARCH ── */}
                    <section aria-label="Filter Transaksi" className="ks-enter ks-enter-d2 mb-4">
                        <div className="relative">
                            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                aria-label="Cari transaksi"
                                placeholder="Cari keterangan atau kategori…"
                                value={search}
                                onChange={handleSearch}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                            />
                            {search && (
                                <button type="button" onClick={() => { setSearch(''); applyFilters({ search: '' }); }} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="pills-scroll mt-2.5 flex gap-2 overflow-x-auto pb-1 pt-0.5">
                            <button type="button" onClick={() => selectCategory('')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${activecat === '' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                Semua
                            </button>
                            {CATEGORIES.map((cat) => {
                                const active = activecat === cat;
                                const c = CAT_COLORS[cat] ?? CAT_COLORS['Lainnya'];
                                return (
                                    <button key={cat} type="button" onClick={() => selectCategory(cat)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${active ? `${c.bg} ${c.text} ${c.ring} shadow-sm` : 'border border-slate-200 bg-white text-slate-600 ring-transparent hover:border-slate-300 hover:bg-slate-50'}`}>
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <CalendarDays size={13} className="shrink-0 text-slate-400" />
                            <input type="date" aria-label="Dari tanggal" value={startDate} onChange={(e) => { setStartDate(e.target.value); applyFilters({ start_date: e.target.value }); }} className="min-h-[36px] rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                            <span className="text-xs text-slate-400">—</span>
                            <input type="date" aria-label="Sampai tanggal" value={endDate} onChange={(e) => { setEndDate(e.target.value); applyFilters({ end_date: e.target.value }); }} className="min-h-[36px] rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                            {hasActiveFilters && (
                                <button type="button" onClick={clearFilters} className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                    <X size={11} />Reset
                                </button>
                            )}
                        </div>
                    </section>

                    {/* ── LEDGER ── */}
                    <section id="ledger-section" aria-labelledby="ledger-heading" className="ks-enter ks-enter-d3">
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#E0F2FE] bg-[#E0F2FE]/50 px-4 py-3 sm:px-5">
                                <h2 id="ledger-heading" className="flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
                                    <Receipt size={14} strokeWidth={2} />Riwayat Transaksi
                                </h2>
                                {transactions?.total !== undefined && (
                                    <span className="font-mono tabular-nums text-xs font-semibold text-[#4B729F]">
                                        {transactions.total.toLocaleString('id-ID')} entri
                                    </span>
                                )}
                            </div>

                            {txList.length === 0 ? (
                                <EmptyState hasFilters={!!hasActiveFilters} onClear={clearFilters} />
                            ) : (
                                <>
                                    {/* Mobile timeline */}
                                    <ul aria-label="Daftar transaksi" className="divide-y divide-slate-100 sm:hidden">
                                        {txList.map((tx, idx) => (
                                            <li key={tx.id} className={`relative ${
                                                idx < txList.length - 1
                                                    ? 'before:absolute before:left-[1.94rem] before:top-12 before:h-[calc(100%-3rem)] before:w-px before:bg-slate-100'
                                                    : ''
                                            }`}>
                                                <TxCard tx={tx} onShowHistory={setHistoryTarget} />
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Desktop table */}
                                    <div className="hidden overflow-x-auto sm:block">
                                        <table className="w-full border-collapse text-sm" role="grid" aria-label="Tabel transaksi kas">
                                            <thead>
                                                <tr className="border-b border-[#E0F2FE] bg-[#E0F2FE]/30">
                                                    {['Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah'].map((h) => (
                                                        <th key={h} scope="col" className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E3A8A] ${h === 'Jumlah' ? 'text-right' : ''}`}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {txList.map((tx) => (
                                                    <TxRow key={tx.id} tx={tx} onShowHistory={setHistoryTarget} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {transactions && transactions.last_page > 1 && <Pagination meta={transactions} />}
                        </div>
                    </section>

                    {/* ── FOOTER ── */}
                    <footer className="ks-enter ks-enter-d4 mt-10 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                            <span className="font-semibold text-[#1E3A8A]">XI PPLG 2</span>
                            {' · '}Rekap Kas Kelas
                        </span>
                        <a href={route('home')} className="flex items-center gap-1 text-[#4B729F] transition hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] rounded">
                            Beranda<ChevronRight size={12} />
                        </a>
                    </footer>
                </main>
            </div>

            {/* ── MODALS ── */}
            <EditHistoryModal transaction={historyTarget} onClose={() => setHistoryTarget(null)} />

            {/* ── FLASH TOAST ── */}
            {flashVisible && flashMessage && (
                <div role="status" aria-live="polite" className="fixed bottom-5 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white shadow-lg sm:left-auto sm:right-6 sm:max-w-xs">
                    <span className="flex-1 text-xs">{flashMessage}</span>
                    <button type="button" onClick={() => setFlashVisible(false)} aria-label="Tutup notifikasi" className="rounded-md p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                        <X size={14} />
                    </button>
                </div>
            )}
        </>
    );
}
