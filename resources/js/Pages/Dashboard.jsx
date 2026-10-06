/**
 * Dashboard.jsx — Treasurer view for "Rekap Uang Kas XI PPLG 2"
 *
 * Props (from TransactionController@index via Inertia):
 *   auth            { user: { name, email, role } }
 *   transactions    Laravel paginator object
 *   totalMasuk      integer (whole Rupiah)
 *   totalKeluar     integer (whole Rupiah)
 *   sisaSaldo       integer (whole Rupiah, may be negative)
 *   categories      string[]
 *   filters         { search?, category?, start_date?, end_date? }
 */

import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    ChevronDown,
    FileDown,
    LogOut,
    Plus,
    Printer,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';

// ─── Design tokens (mirrors tailwind.config.js brand palette) ─────────────────
// brand.navy   = #1E3A8A
// brand.blue   = #4B729F
// brand.yellow = #FACC15
// brand.ice    = #E0F2FE
// brand.bg     = #F8FAFC

const CATEGORIES = ['Kas Wajib', 'Konsumsi', 'ATK', 'Kegiatan', 'Lainnya'];

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Format whole-Rupiah integer → "Rp 1.250.000" (JetBrains Mono in JSX) */
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

/** Parse "1.250.000" back to integer for the amount field display */
function parseRupiahInput(raw) {
    return parseInt(raw.replace(/\D/g, ''), 10) || 0;
}

/** Debounce helper — returns a debounced function */
function useDebounce(fn, delay) {
    const timer = useRef(null);
    return (...args) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Build the export URL with active filter params appended.
 * format: 'csv' | 'print'
 * filters: { search, category, start_date, end_date }
 */
function buildExportUrl(format, filters = {}) {
    const params = new URLSearchParams({ format });
    Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
    });
    return `/transactions/export?${params.toString()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Metric summary card */
function MetricCard({ label, value, icon: Icon, variant = 'default' }) {
    const variants = {
        navy: 'bg-[#1E3A8A] border-[#1E3A8A]',
        emerald: 'bg-white border-slate-200/80',
        rose: 'bg-white border-slate-200/80',
        default: 'bg-white border-slate-200/80',
    };
    const valueClass = {
        navy: 'text-[#FACC15]',
        emerald: 'text-emerald-600',
        rose: 'text-rose-500',
        default: 'text-slate-900',
    };
    const labelClass = {
        navy: 'text-white/70',
        emerald: 'text-slate-500',
        rose: 'text-slate-500',
        default: 'text-slate-500',
    };
    const iconBg = {
        navy: 'bg-white/10 text-[#FACC15]',
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-500',
        default: 'bg-slate-100 text-slate-500',
    };

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${variants[variant]}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-widest ${labelClass[variant]}`}>
                        {label}
                    </p>
                    <p
                        className={`mt-2 font-mono tabular-nums text-2xl font-bold leading-none tracking-tight ${valueClass[variant]}`}
                    >
                        {formatRupiah(value)}
                    </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg[variant]}`}>
                    <Icon size={18} strokeWidth={2} />
                </div>
            </div>
        </div>
    );
}

/** Category badge pill */
function CategoryBadge({ category }) {
    const map = {
        'Kas Wajib': 'bg-blue-50 text-blue-700 ring-blue-200/60',
        Konsumsi:    'bg-orange-50 text-orange-700 ring-orange-200/60',
        ATK:         'bg-violet-50 text-violet-700 ring-violet-200/60',
        Kegiatan:    'bg-teal-50 text-teal-700 ring-teal-200/60',
        Lainnya:     'bg-slate-100 text-slate-600 ring-slate-200/60',
    };
    const cls = map[category] ?? 'bg-slate-100 text-slate-600 ring-slate-200/60';
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
            {category}
        </span>
    );
}

/** Inline field error */
function FieldError({ message }) {
    if (!message) return null;
    return (
        <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-rose-600">
            <AlertTriangle size={11} />
            {message}
        </p>
    );
}

// ─── Modal: Tambah Transaksi ──────────────────────────────────────────────────

function TambahTransaksiModal({ open, onClose, categories }) {
    const closeRef = useRef(null);

    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors, reset } = useForm({
        type:             'masuk',
        category:         '',
        amount:           '',
        transaction_date: today,
        description:      '',
    });

    // Display value for the amount input (formatted, not raw)
    const [amountDisplay, setAmountDisplay] = useState('');

    function handleAmountChange(e) {
        const raw = e.target.value.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        setAmountDisplay(num === 0 ? '' : num.toLocaleString('id-ID'));
        setData('amount', num === 0 ? '' : String(num));
    }

    function handleSubmit(e) {
        e.preventDefault();
        post(route('transactions.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setAmountDisplay('');
                onClose();
            },
        });
    }

    function handleClose() {
        reset();
        setAmountDisplay('');
        onClose();
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={handleClose}
                initialFocus={closeRef}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                {/* Panel */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="w-full overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-slate-200/80 sm:max-w-lg sm:rounded-2xl">
                                {/* Modal header */}
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <Dialog.Title className="text-[15px] font-bold text-slate-900">
                                        Tambah Transaksi
                                    </Dialog.Title>
                                    <button
                                        ref={closeRef}
                                        type="button"
                                        onClick={handleClose}
                                        aria-label="Tutup modal"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="space-y-5 px-6 py-5">

                                        {/* Type toggle — Pemasukan / Pengeluaran */}
                                        <fieldset>
                                            <legend className="mb-1.5 text-xs font-semibold text-slate-700">
                                                Jenis Transaksi <span className="text-rose-500">*</span>
                                            </legend>
                                            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group">
                                                {[
                                                    { value: 'masuk',  label: 'Pemasukan',   color: 'text-emerald-700 bg-white shadow-sm ring-1 ring-emerald-200/60' },
                                                    { value: 'keluar', label: 'Pengeluaran', color: 'text-rose-600 bg-white shadow-sm ring-1 ring-rose-200/60' },
                                                ].map(({ value, label, color }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={data.type === value}
                                                        onClick={() => setData('type', value)}
                                                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                                                            data.type === value
                                                                ? color
                                                                : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <FieldError message={errors.type} />
                                        </fieldset>

                                        {/* Category */}
                                        <div>
                                            <label
                                                htmlFor="modal-category"
                                                className="mb-1.5 block text-xs font-semibold text-slate-700"
                                            >
                                                Kategori <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="modal-category"
                                                    value={data.category}
                                                    onChange={(e) => setData('category', e.target.value)}
                                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                                >
                                                    <option value="">Pilih kategori…</option>
                                                    {categories.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    size={14}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                            </div>
                                            <FieldError message={errors.category} />
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label
                                                htmlFor="modal-amount"
                                                className="mb-1.5 block text-xs font-semibold text-slate-700"
                                            >
                                                Jumlah (Rp) <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-slate-400">
                                                    Rp
                                                </span>
                                                <input
                                                    id="modal-amount"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    placeholder="0"
                                                    value={amountDisplay}
                                                    onChange={handleAmountChange}
                                                    aria-invalid={!!errors.amount}
                                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 font-mono tabular-nums text-sm text-slate-900 shadow-sm transition focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                                />
                                            </div>
                                            <FieldError message={errors.amount} />
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label
                                                htmlFor="modal-date"
                                                className="mb-1.5 block text-xs font-semibold text-slate-700"
                                            >
                                                Tanggal <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="modal-date"
                                                type="date"
                                                value={data.transaction_date}
                                                onChange={(e) => setData('transaction_date', e.target.value)}
                                                aria-invalid={!!errors.transaction_date}
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                            />
                                            <FieldError message={errors.transaction_date} />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label
                                                htmlFor="modal-desc"
                                                className="mb-1.5 block text-xs font-semibold text-slate-700"
                                            >
                                                Keterangan{' '}
                                                <span className="font-normal text-slate-400">(opsional)</span>
                                            </label>
                                            <textarea
                                                id="modal-desc"
                                                rows={2}
                                                maxLength={255}
                                                placeholder="Deskripsi singkat transaksi…"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                            />
                                            <FieldError message={errors.description} />
                                        </div>
                                    </div>

                                    {/* Modal footer */}
                                    <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1e3a8a]/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Menyimpan…
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={15} />
                                                    Simpan Transaksi
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// ─── Modal: Delete Confirmation ───────────────────────────────────────────────

function DeleteConfirmModal({ transaction, onClose }) {
    const open        = transaction !== null;
    const cancelRef   = useRef(null);
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        if (!transaction) return;
        setDeleting(true);
        router.delete(route('transactions.destroy', transaction.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                onClose();
            },
        });
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => !deleting && onClose()}
                initialFocus={cancelRef}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                                <div className="p-6">
                                    {/* Warning icon */}
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-4 ring-rose-100">
                                        <AlertTriangle size={22} className="text-rose-500" />
                                    </div>

                                    <Dialog.Title className="text-center text-[15px] font-bold text-slate-900">
                                        Hapus Transaksi?
                                    </Dialog.Title>

                                    <Dialog.Description className="mt-2 text-center text-sm text-slate-500">
                                        Tindakan ini tidak dapat dibatalkan.
                                    </Dialog.Description>

                                    {/* Transaction preview card */}
                                    {transaction && (
                                        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-slate-800">
                                                        {transaction.description || transaction.category}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                        {transaction.category} ·{' '}
                                                        {new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
                                                            day:   'numeric',
                                                            month: 'long',
                                                            year:  'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 font-mono tabular-nums text-sm font-bold ${
                                                        transaction.type === 'masuk'
                                                            ? 'text-emerald-600'
                                                            : 'text-rose-600'
                                                    }`}
                                                >
                                                    {transaction.type === 'masuk' ? '+' : '−'}{' '}
                                                    {formatRupiah(transaction.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
                                    <button
                                        ref={cancelRef}
                                        type="button"
                                        onClick={onClose}
                                        disabled={deleting}
                                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                    >
                                        {deleting ? (
                                            <>
                                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Menghapus…
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={14} />
                                                Ya, Hapus
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// ─── Flash notification toast ─────────────────────────────────────────────────

function FlashToast({ flash }) {
    const [visible, setVisible] = useState(false);
    const message = flash?.success ?? flash?.error ?? null;

    useEffect(() => {
        if (!message) return;
        setVisible(true);
        const t = setTimeout(() => setVisible(false), 4000);
        return () => clearTimeout(t);
    }, [message]); // depend on the message string, not the flash object reference

    if (!visible || !message) return null;

    const isError = !!flash?.error;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 transition-all duration-300 ${
                isError
                    ? 'bg-rose-600 text-white ring-rose-700'
                    : 'bg-[#1E3A8A] text-white ring-[#1e3a8a]/80'
            }`}
        >
            {message}
            <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Tutup notifikasi"
                className="ml-1 rounded-md p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd, hasFilters = false }) {
    return (
        <div role="status" className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0F2FE]">
                <Wallet size={24} className="text-[#4B729F]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
                {hasFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
            </h3>
            <p className="mt-1 max-w-[24ch] text-xs text-slate-400 leading-relaxed">
                {hasFilters
                    ? 'Coba ubah kata kunci atau hapus filter yang aktif.'
                    : 'Mulai dengan menambahkan transaksi pertama.'}
            </p>
            {!hasFilters && (
                <button
                    type="button"
                    onClick={onAdd}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2 text-xs font-bold text-[#1E3A8A] transition hover:bg-[#f5c400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]"
                >
                    <Plus size={14} />
                    Tambah Transaksi
                </button>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard({
    auth,
    transactions,
    totalMasuk,
    totalKeluar,
    sisaSaldo,
    categories = CATEGORIES,
    filters = {},
}) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    // Modal state
    const [showAdd, setShowAdd]           = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Filter state — mirrors URL query params
    const [search,    setSearch]    = useState(filters.search     ?? '');
    const [category,  setCategory]  = useState(filters.category   ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate,   setEndDate]   = useState(filters.end_date   ?? '');

    // Debounced navigation
    const navigate = useDebounce((params) => {
        router.get(route('transactions.index'), params, {
            preserveState: true,
            replace:       true,
        });
    }, 350);

    function applyFilters(overrides = {}) {
        const params = {
            search:     search,
            category:   category,
            start_date: startDate,
            end_date:   endDate,
            ...overrides,
            page:       1, // always reset to page 1 when any filter changes
        };
        // Strip empty values
        Object.keys(params).forEach((k) => {
            if (!params[k]) delete params[k];
        });
        navigate(params);
    }

    function handleSearchChange(e) {
        setSearch(e.target.value);
        applyFilters({ search: e.target.value });
    }

    function handleCategoryChange(e) {
        const val = e.target.value;
        setCategory(val);
        applyFilters({ category: val });
    }

    function handleDateChange(field, value) {
        if (field === 'start') {
            setStartDate(value);
            applyFilters({ start_date: value });
        } else {
            setEndDate(value);
            applyFilters({ end_date: value });
        }
    }

    function clearFilters() {
        setSearch('');
        setCategory('');
        setStartDate('');
        setEndDate('');
        router.get(route('transactions.index'), {}, { preserveState: false, replace: true });
    }

    const hasActiveFilters = search || category || startDate || endDate;

    const txList = transactions?.data ?? [];

    return (
        <>
            <Head title="Dashboard Bendahara — Rekap Kas XI PPLG 2" />

            {/* Page-load entrance animation */}
            <style>{`
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: no-preference) {
                    .dash-enter    { animation: fade-up 400ms cubic-bezier(0.23,1,0.32,1) both; }
                    .dash-enter-d1 { animation-delay: 40ms;  }
                    .dash-enter-d2 { animation-delay: 100ms; }
                    .dash-enter-d3 { animation-delay: 160ms; }
                    .dash-enter-d4 { animation-delay: 220ms; }
                }
            `}</style>

            <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

                        {/* Branding */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A]">
                                <Wallet size={17} strokeWidth={2} className="text-[#FACC15]" />
                            </div>
                            <div className="leading-none">
                                <p className="text-sm font-bold tracking-tight text-[#1E3A8A]">
                                    Rekap Kas
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium text-[#4B729F]">
                                    XI PPLG 2
                                </p>
                            </div>
                        </div>

                        {/* Right: identity + logout */}
                        <div className="flex items-center gap-3">
                            {/* Treasurer identity pill */}
                            <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-[#E0F2FE] px-3 py-1.5 sm:flex">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-bold text-[#FACC15]">
                                    {auth?.user?.name?.[0]?.toUpperCase() ?? 'B'}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold leading-none text-[#1E3A8A]">
                                        {auth?.user?.name ?? 'Bendahara'}
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-none text-[#4B729F]">
                                        Bendahara
                                    </p>
                                </div>
                            </div>

                            <Link
                                method="post"
                                as="button"
                                href={route('logout')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            >
                                <LogOut size={13} />
                                <span>Keluar</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                    {/* ── METRIC CARDS ────────────────────────────────────── */}
                    <section aria-labelledby="metrics-heading" className="dash-enter dash-enter-d1">
                        <h1 id="metrics-heading" className="sr-only">Ringkasan Keuangan Kas</h1>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <MetricCard
                                label="Total Saldo"
                                value={sisaSaldo}
                                icon={Wallet}
                                variant="navy"
                            />
                            <MetricCard
                                label="Total Pemasukan"
                                value={totalMasuk}
                                icon={TrendingUp}
                                variant="emerald"
                            />
                            <MetricCard
                                label="Total Pengeluaran"
                                value={totalKeluar}
                                icon={TrendingDown}
                                variant="rose"
                            />
                        </div>
                    </section>

                    {/* ── FILTER TOOLBAR ──────────────────────────────────── */}
                    <section
                        aria-label="Filter dan Cari Transaksi"
                        className="dash-enter dash-enter-d2 mt-6"
                    >
                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:flex-wrap">

                            {/* Search */}
                            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                                <Search
                                    size={14}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="search"
                                    aria-label="Cari transaksi"
                                    placeholder="Cari keterangan atau kategori…"
                                    value={search}
                                    onChange={handleSearchChange}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                />
                            </div>

                            {/* Category filter */}
                            <div className="relative">
                                <select
                                    aria-label="Filter kategori"
                                    value={category}
                                    onChange={handleCategoryChange}
                                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-8 text-sm text-slate-700 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                >
                                    <option value="">Semua Kategori</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={13}
                                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>

                            {/* Date range */}
                            <div className="flex items-center gap-2">
                                <CalendarDays size={14} className="shrink-0 text-slate-400" />
                                <input
                                    type="date"
                                    aria-label="Dari tanggal"
                                    value={startDate}
                                    onChange={(e) => handleDateChange('start', e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                />
                                <span className="text-xs text-slate-400">–</span>
                                <input
                                    type="date"
                                    aria-label="Sampai tanggal"
                                    value={endDate}
                                    onChange={(e) => handleDateChange('end', e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                />
                            </div>

                            {/* Clear filters */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                    Reset
                                </button>
                            )}

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* ── Export + Add action group ─────────────────── */}
                            <div className="flex items-center gap-2">

                                {/* CSV download — direct href, carries active filters */}
                                <a
                                    href={buildExportUrl('csv', { search, category, start_date: startDate, end_date: endDate })}
                                    download
                                    aria-label="Unduh CSV"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#4B729F] hover:bg-[#E0F2FE] hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                >
                                    <FileDown size={14} strokeWidth={2} />
                                    CSV
                                </a>

                                {/* Print report — opens in new tab, auto-triggers print dialog */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        window.open(
                                            buildExportUrl('print', { search, category, start_date: startDate, end_date: endDate }),
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                    aria-label="Cetak laporan PDF"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#4B729F] hover:bg-[#E0F2FE] hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                >
                                    <Printer size={14} strokeWidth={2} />
                                    Cetak
                                </button>

                                {/* Primary add action */}
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#1E3A8A] shadow-sm transition hover:bg-[#f5c400] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]"
                                >
                                    <Plus size={15} strokeWidth={2.5} />
                                    Tambah
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ── LEDGER TABLE ────────────────────────────────────── */}
                    <section
                        aria-labelledby="ledger-heading"
                        className="dash-enter dash-enter-d3 mt-6"
                    >
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

                            {/* Table header */}
                            <div className="border-b border-[#E0F2FE] bg-[#E0F2FE]/60 px-6 py-3.5">
                                <h2 id="ledger-heading" className="text-sm font-bold text-[#1E3A8A]">
                                    Riwayat Transaksi
                                    {transactions?.total !== undefined && (
                                        <span className="ml-2 font-mono tabular-nums text-xs font-semibold text-[#4B729F]">
                                            ({transactions.total.toLocaleString('id-ID')} entri)
                                        </span>
                                    )}
                                </h2>
                            </div>

                            {/* Desktop table */}
                            <div className="overflow-x-auto">
                                <table className="hidden w-full border-collapse text-sm sm:table" role="grid">
                                    <thead>
                                        <tr className="border-b border-[#E0F2FE] bg-[#E0F2FE]/40">
                                            {['Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah', ''].map((h) => (
                                                <th
                                                    key={h}
                                                    scope="col"
                                                    className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E3A8A] ${
                                                        h === 'Jumlah' ? 'text-right' : ''
                                                    } ${h === '' ? 'w-14' : ''}`}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {txList.length === 0 ? (
                                            <tr>
                                                <td colSpan={6}>
                                                    <EmptyState
                                                        onAdd={() => setShowAdd(true)}
                                                        hasFilters={!!hasActiveFilters}
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            txList.map((tx) => (
                                                <tr
                                                    key={tx.id}
                                                    className="group transition-colors hover:bg-slate-50/60"
                                                >
                                                    {/* Date */}
                                                    <td className="whitespace-nowrap px-5 py-3.5 font-mono tabular-nums text-xs text-slate-500">
                                                        {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                                                            day:   '2-digit',
                                                            month: 'short',
                                                            year:  'numeric',
                                                        })}
                                                    </td>

                                                    {/* Category */}
                                                    <td className="whitespace-nowrap px-5 py-3.5">
                                                        <CategoryBadge category={tx.category} />
                                                    </td>

                                                    {/* Description */}
                                                    <td className="max-w-[240px] px-5 py-3.5">
                                                        <p className="truncate text-sm text-slate-700">
                                                            {tx.description || (
                                                                <span className="text-slate-400 italic">—</span>
                                                            )}
                                                        </p>
                                                    </td>

                                                    {/* Type */}
                                                    <td className="whitespace-nowrap px-5 py-3.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                                                                tx.type === 'masuk'
                                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                                                                    : 'bg-rose-50 text-rose-600 ring-rose-200/60'
                                                            }`}
                                                        >
                                                            {tx.type === 'masuk' ? 'Masuk' : 'Keluar'}
                                                        </span>
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                                        <span
                                                            className={`font-mono tabular-nums text-sm font-bold ${
                                                                tx.type === 'masuk'
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-500'
                                                            }`}
                                                        >
                                                            {tx.type === 'masuk' ? '+' : '−'}{' '}
                                                            {formatRupiah(tx.amount)}
                                                        </span>
                                                    </td>

                                                    {/* Delete action */}
                                                    <td className="px-5 py-3.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(tx)}
                                                            aria-label={`Hapus transaksi ${tx.description || tx.category}`}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Mobile card list */}
                                <ul className="divide-y divide-slate-100 sm:hidden">
                                    {txList.length === 0 ? (
                                        <li><EmptyState onAdd={() => setShowAdd(true)} hasFilters={!!hasActiveFilters} /></li>
                                    ) : (
                                        txList.map((tx) => (
                                            <li
                                                key={tx.id}
                                                className="flex items-start justify-between gap-3 px-5 py-4"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <CategoryBadge category={tx.category} />
                                                        <span className="font-mono tabular-nums text-[11px] text-slate-400">
                                                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    {tx.description && (
                                                        <p className="mt-1 truncate text-sm text-slate-700">
                                                            {tx.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span
                                                        className={`font-mono tabular-nums text-sm font-bold ${
                                                            tx.type === 'masuk' ? 'text-emerald-600' : 'text-rose-500'
                                                        }`}
                                                    >
                                                        {tx.type === 'masuk' ? '+' : '−'} {formatRupiah(tx.amount)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(tx)}
                                                        aria-label={`Hapus transaksi ${tx.description || tx.category}`}
                                                        className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>

                            {/* Pagination */}
                            {transactions && transactions.last_page > 1 && (
                                <Pagination meta={transactions} />
                            )}
                        </div>
                    </section>
                </main>
            </div>

            {/* ── MODALS ──────────────────────────────────────────────────── */}
            <TambahTransaksiModal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                categories={categories}
            />

            <DeleteConfirmModal
                transaction={deleteTarget}
                onClose={() => setDeleteTarget(null)}
            />

            {/* ── FLASH TOAST ─────────────────────────────────────────────── */}
            <FlashToast flash={flash} />
        </>
    );
}



function Pagination({ meta }) {
    function goTo(url) {
        if (!url) return;
        router.get(url, {}, { preserveState: true, replace: true });
    }

    return (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
            <p className="text-xs text-slate-500">
                Menampilkan{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {meta.from ?? 0}–{meta.to ?? 0}
                </span>{' '}
                dari{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {meta.total.toLocaleString('id-ID')}
                </span>{' '}
                entri
            </p>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => goTo(meta.prev_page_url)}
                    disabled={!meta.prev_page_url}
                    aria-label="Halaman sebelumnya"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                    <ArrowLeft size={14} />
                </button>

                <span className="font-mono tabular-nums rounded-lg border border-[#E0F2FE] bg-[#E0F2FE]/60 px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                    {meta.current_page} / {meta.last_page}
                </span>

                <button
                    type="button"
                    onClick={() => goTo(meta.next_page_url)}
                    disabled={!meta.next_page_url}
                    aria-label="Halaman berikutnya"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}
