/**
 * Dashboard.jsx — Treasurer view for "Rekap Uang Kas XI PPLG 2"
 *
 * Props (from TransactionController@index via Inertia):
 *   auth         { user: { name, email, role } }
 *   transactions Laravel paginator object
 *   totalMasuk   integer (whole Rupiah, always excludes soft-deleted)
 *   totalKeluar  integer (whole Rupiah, always excludes soft-deleted)
 *   sisaSaldo    integer (whole Rupiah)
 *   categories   string[]
 *   filters      { search?, category?, start_date?, end_date?, tab? }
 *   activeTab    'active' | 'trash'
 *   students     { id, name, email }[]  — pelajar list for handover modal
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
    Check,
    ChevronDown,
    Clock,
    FileDown,
    History,
    LogOut,
    Pencil,
    Plus,
    Printer,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    TrendingDown,
    TrendingUp,
    UserCheck,
    Wallet,
    X,
    Zap,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
    'Kas Wajib',
    'Kas Susulan',
    'Denda / Sanksi',
    'Konsumsi',
    'ATK',
    'Kegiatan',
    'Lainnya',
];

const CAT_COLORS = {
    'Kas Wajib':     'bg-blue-50 text-blue-700 ring-blue-200/60',
    'Kas Susulan':   'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
    'Denda / Sanksi':'bg-amber-50 text-amber-700 ring-amber-200/60',
    Konsumsi:        'bg-orange-50 text-orange-700 ring-orange-200/60',
    ATK:             'bg-violet-50 text-violet-700 ring-violet-200/60',
    Kegiatan:        'bg-teal-50 text-teal-700 ring-teal-200/60',
    Lainnya:         'bg-slate-100 text-slate-600 ring-slate-200/60',
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style:                 'currency',
        currency:              'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

function useDebounce(fn, delay) {
    const timer = useRef(null);
    return (...args) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => fn(...args), delay);
    };
}

function buildExportUrl(format, filters = {}) {
    const params = new URLSearchParams({ format });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/transactions/export?${params.toString()}`;
}

function formatDatetime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, variant = 'default' }) {
    const variants = {
        navy:    'bg-[#1E3A8A] border-[#1E3A8A]',
        emerald: 'bg-white border-slate-200/80',
        rose:    'bg-white border-slate-200/80',
        default: 'bg-white border-slate-200/80',
    };
    const valueClass = {
        navy:    'text-[#FACC15]',
        emerald: 'text-emerald-600',
        rose:    'text-rose-500',
        default: 'text-slate-900',
    };
    const labelClass = {
        navy:    'text-white/70',
        emerald: 'text-slate-500',
        rose:    'text-slate-500',
        default: 'text-slate-500',
    };
    const iconBg = {
        navy:    'bg-white/10 text-[#FACC15]',
        emerald: 'bg-emerald-50 text-emerald-600',
        rose:    'bg-rose-50 text-rose-500',
        default: 'bg-slate-100 text-slate-500',
    };
    return (
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${variants[variant]}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-widest ${labelClass[variant]}`}>{label}</p>
                    <p className={`mt-2 font-mono tabular-nums text-2xl font-bold leading-none tracking-tight ${valueClass[variant]}`}>
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

function CategoryBadge({ category }) {
    const cls = CAT_COLORS[category] ?? CAT_COLORS['Lainnya'];
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
            {category}
        </span>
    );
}

function FieldError({ message }) {
    if (!message) return null;
    return (
        <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-rose-600">
            <AlertTriangle size={11} />{message}
        </p>
    );
}

// ─── Modal: Riwayat Perubahan Data (Edit Audit Trail) ─────────────────────────

function EditHistoryModal({ transaction, onClose }) {
    const open  = transaction !== null;
    const edits = transaction?.edits ?? [];

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95"
                        >
                            <Dialog.Panel className="w-full overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-slate-200/80 sm:max-w-lg sm:rounded-2xl">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <History size={15} />
                                        </div>
                                        <Dialog.Title className="text-[15px] font-bold text-slate-900">
                                            Riwayat Perubahan Data
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Tutup modal"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                    >
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
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {edit.user?.name ?? 'Unknown'}
                                                            </span>
                                                            <time className="font-mono tabular-nums text-[10px] text-slate-400">
                                                                {formatDatetime(edit.created_at)}
                                                            </time>
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
                                                            {edit.old_type !== edit.new_type && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-16 shrink-0 text-slate-500">Jenis</span>
                                                                    <span className="text-rose-500 line-through">{edit.old_type}</span>
                                                                    <ArrowRight size={10} className="shrink-0 text-slate-400" />
                                                                    <span className="font-semibold text-slate-700">{edit.new_type}</span>
                                                                </div>
                                                            )}
                                                            {edit.old_category !== edit.new_category && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-16 shrink-0 text-slate-500">Kategori</span>
                                                                    <span className="text-rose-500 line-through">{edit.old_category}</span>
                                                                    <ArrowRight size={10} className="shrink-0 text-slate-400" />
                                                                    <span className="font-semibold text-slate-700">{edit.new_category}</span>
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
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                    >
                                        Tutup
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

// ─── Modal: Tambah Transaksi (with Preset pill bar) ───────────────────────────

const PRESETS = [
    {
        id:       'kas-rutin',
        label:    'Kas Rutin',
        icon:     Wallet,
        type:     'masuk',
        category: 'Kas Wajib',
        lockedCategory: false,
        chips: [],
        descTemplate: '',
        autoFocusDate: false,
    },
    {
        id:       'denda',
        label:    'Denda Siswa',
        icon:     AlertTriangle,
        type:     'masuk',
        category: 'Denda / Sanksi',
        lockedCategory: true,
        chips: [2000, 5000, 10000],
        descTemplate: 'Denda keterlambatan kas a.n. [Nama]',
        autoFocusDate: false,
    },
    {
        id:       'tunggakan',
        label:    'Tunggakan',
        icon:     Clock,
        type:     'masuk',
        category: 'Kas Susulan',
        lockedCategory: true,
        chips: [],
        descTemplate: 'Pelunasan tunggakan kas bulan [Bulan] a.n. [Nama]',
        autoFocusDate: true,
    },
    {
        id:       'keluar',
        label:    'Pengeluaran',
        icon:     TrendingDown,
        type:     'keluar',
        category: 'Konsumsi',
        lockedCategory: false,
        chips: [],
        descTemplate: '',
        autoFocusDate: false,
    },
];

function TambahTransaksiModal({ open, onClose, categories }) {
    const closeRef  = useRef(null);
    const dateRef   = useRef(null);
    const today     = new Date().toISOString().split('T')[0];

    const [activePreset, setActivePreset] = useState(PRESETS[0]);
    const [amountDisplay, setAmountDisplay] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        type:             'masuk',
        category:         'Kas Wajib',
        amount:           '',
        transaction_date: today,
        description:      '',
    });

    function applyPreset(preset) {
        setActivePreset(preset);
        setAmountDisplay('');
        setData({
            type:             preset.type,
            category:         preset.category,
            amount:           '',
            transaction_date: today,
            description:      preset.descTemplate,
        });
        if (preset.autoFocusDate) {
            setTimeout(() => dateRef.current?.focus(), 50);
        }
    }

    function applyChip(value) {
        setAmountDisplay(value.toLocaleString('id-ID'));
        setData('amount', String(value));
    }

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
            onSuccess: () => { reset(); setAmountDisplay(''); setActivePreset(PRESETS[0]); onClose(); },
        });
    }

    function handleClose() {
        reset();
        setAmountDisplay('');
        setActivePreset(PRESETS[0]);
        onClose();
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose} initialFocus={closeRef}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95"
                        >
                            <Dialog.Panel className="w-full overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-slate-200/80 sm:max-w-lg sm:rounded-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <Dialog.Title className="text-[15px] font-bold text-slate-900">
                                        Tambah Transaksi
                                    </Dialog.Title>
                                    <button
                                        ref={closeRef}
                                        type="button"
                                        onClick={handleClose}
                                        aria-label="Tutup modal"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Preset pill bar */}
                                <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3">
                                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        <Zap size={11} />
                                        Mode Input Cepat
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESETS.map((preset) => {
                                            const Icon    = preset.icon;
                                            const active  = activePreset.id === preset.id;
                                            const isMasuk = preset.type === 'masuk';
                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => applyPreset(preset)}
                                                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${
                                                        active
                                                            ? isMasuk
                                                                ? 'bg-emerald-600 text-white ring-emerald-600 shadow-sm'
                                                                : 'bg-rose-600 text-white ring-rose-600 shadow-sm'
                                                            : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <Icon size={12} />
                                                    {preset.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="space-y-5 px-6 py-5">

                                        {/* Type toggle */}
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
                                                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${
                                                            data.type === value ? color : 'text-slate-500 hover:text-slate-700'
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
                                            <label htmlFor="modal-category" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Kategori <span className="text-rose-500">*</span>
                                                {activePreset.lockedCategory && (
                                                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">terkunci preset</span>
                                                )}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="modal-category"
                                                    value={data.category}
                                                    onChange={(e) => setData('category', e.target.value)}
                                                    disabled={activePreset.lockedCategory}
                                                    className={`w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F] ${activePreset.lockedCategory ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    <option value="">Pilih kategori…</option>
                                                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            <FieldError message={errors.category} />
                                        </div>

                                        {/* Quick amount chips (Denda preset) */}
                                        {activePreset.chips.length > 0 && (
                                            <div>
                                                <p className="mb-1.5 text-xs font-semibold text-slate-700">Nominal Cepat</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {activePreset.chips.map((chip) => (
                                                        <button
                                                            key={chip}
                                                            type="button"
                                                            onClick={() => applyChip(chip)}
                                                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${
                                                                data.amount === String(chip)
                                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            +{formatRupiah(chip)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Amount */}
                                        <div>
                                            <label htmlFor="modal-amount" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Jumlah (Rp) <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-slate-400">Rp</span>
                                                <input
                                                    id="modal-amount"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    placeholder="0"
                                                    value={amountDisplay}
                                                    onChange={handleAmountChange}
                                                    aria-invalid={!!errors.amount}
                                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 font-mono tabular-nums text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                                />
                                            </div>
                                            <FieldError message={errors.amount} />
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label htmlFor="modal-date" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Tanggal <span className="text-rose-500">*</span>
                                                {activePreset.autoFocusDate && (
                                                    <span className="ml-2 rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">pilih tanggal mundur</span>
                                                )}
                                            </label>
                                            <input
                                                ref={dateRef}
                                                id="modal-date"
                                                type="date"
                                                value={data.transaction_date}
                                                onChange={(e) => setData('transaction_date', e.target.value)}
                                                aria-invalid={!!errors.transaction_date}
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                            />
                                            <FieldError message={errors.transaction_date} />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label htmlFor="modal-desc" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Keterangan{' '}
                                                <span className="font-normal text-slate-400">(opsional)</span>
                                            </label>
                                            <textarea
                                                id="modal-desc"
                                                rows={2}
                                                maxLength={255}
                                                placeholder={activePreset.descTemplate || 'Deskripsi singkat transaksi…'}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                            />
                                            <FieldError message={errors.description} />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1e3a8a]/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                                        >
                                            {processing ? (
                                                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan…</>
                                            ) : (
                                                <><Plus size={15} />Simpan Transaksi</>
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

// ─── Modal: Edit Transaksi ─────────────────────────────────────────────────────

function EditTransaksiModal({ transaction, onClose, categories }) {
    const open     = transaction !== null;
    const closeRef = useRef(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        type: 'masuk', category: '', amount: '', transaction_date: '', description: '', edit_reason: '',
    });

    const [amountDisplay, setAmountDisplay] = useState('');

    useEffect(() => {
        if (transaction) {
            const rawDate = typeof transaction.transaction_date === 'string'
                ? transaction.transaction_date.substring(0, 10) : '';
            const num = parseInt(transaction.amount, 10) || 0;
            setData({
                type:             transaction.type || 'masuk',
                category:         transaction.category || '',
                amount:           String(num || ''),
                transaction_date: rawDate,
                description:      transaction.description || '',
                edit_reason:      '',
            });
            setAmountDisplay(num === 0 ? '' : num.toLocaleString('id-ID'));
        }
    }, [transaction]);

    function handleAmountChange(e) {
        const raw = e.target.value.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        setAmountDisplay(num === 0 ? '' : num.toLocaleString('id-ID'));
        setData('amount', num === 0 ? '' : String(num));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!transaction) return;
        put(route('transactions.update', transaction.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); setAmountDisplay(''); onClose(); },
        });
    }

    function handleClose() { reset(); setAmountDisplay(''); onClose(); }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose} initialFocus={closeRef}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                            <Dialog.Panel className="w-full overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-slate-200/80 sm:max-w-lg sm:rounded-2xl">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Pencil size={15} /></div>
                                        <Dialog.Title className="text-[15px] font-bold text-slate-900">Edit Transaksi</Dialog.Title>
                                    </div>
                                    <button ref={closeRef} type="button" onClick={handleClose} aria-label="Tutup modal" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"><X size={16} /></button>
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="space-y-5 px-6 py-5">
                                        {/* Type */}
                                        <fieldset>
                                            <legend className="mb-1.5 text-xs font-semibold text-slate-700">Jenis Transaksi <span className="text-rose-500">*</span></legend>
                                            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group">
                                                {[{ value: 'masuk', label: 'Pemasukan', color: 'text-emerald-700 bg-white shadow-sm ring-1 ring-emerald-200/60' }, { value: 'keluar', label: 'Pengeluaran', color: 'text-rose-600 bg-white shadow-sm ring-1 ring-rose-200/60' }].map(({ value, label, color }) => (
                                                    <button key={value} type="button" role="radio" aria-checked={data.type === value} onClick={() => setData('type', value)} className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${data.type === value ? color : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
                                                ))}
                                            </div>
                                            <FieldError message={errors.type} />
                                        </fieldset>

                                        {/* Category */}
                                        <div>
                                            <label htmlFor="edit-modal-category" className="mb-1.5 block text-xs font-semibold text-slate-700">Kategori <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <select id="edit-modal-category" value={data.category} onChange={(e) => setData('category', e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]">
                                                    <option value="">Pilih kategori…</option>
                                                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            <FieldError message={errors.category} />
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label htmlFor="edit-modal-amount" className="mb-1.5 block text-xs font-semibold text-slate-700">Jumlah (Rp) <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-slate-400">Rp</span>
                                                <input id="edit-modal-amount" type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={amountDisplay} onChange={handleAmountChange} aria-invalid={!!errors.amount} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 font-mono tabular-nums text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                                            </div>
                                            <FieldError message={errors.amount} />
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label htmlFor="edit-modal-date" className="mb-1.5 block text-xs font-semibold text-slate-700">Tanggal <span className="text-rose-500">*</span></label>
                                            <input id="edit-modal-date" type="date" value={data.transaction_date} onChange={(e) => setData('transaction_date', e.target.value)} aria-invalid={!!errors.transaction_date} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                                            <FieldError message={errors.transaction_date} />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label htmlFor="edit-modal-desc" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Keterangan <span className="font-normal text-slate-400">(opsional)</span>
                                            </label>
                                            <textarea id="edit-modal-desc" rows={2} maxLength={255} placeholder="Deskripsi singkat transaksi…" value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                                            <FieldError message={errors.description} />
                                        </div>

                                        {/* Edit reason */}
                                        <div>
                                            <label htmlFor="edit-reason" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Alasan Perubahan <span className="font-normal text-slate-400">(opsional, max 150 karakter)</span>
                                            </label>
                                            <input id="edit-reason" type="text" maxLength={150} placeholder="Misal: koreksi nominal dari slip fisik…" value={data.edit_reason} onChange={(e) => setData('edit_reason', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                                            <FieldError message={errors.edit_reason} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                                        <button type="button" onClick={handleClose} className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">Batal</button>
                                        <button type="submit" disabled={processing} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1e3a8a]/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                            {processing ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan…</> : <><Check size={15} />Simpan Perubahan</>}
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

// ─── Modal: Delete Confirmation ────────────────────────────────────────────────

function DeleteConfirmModal({ transaction, onClose }) {
    const open      = transaction !== null;
    const cancelRef = useRef(null);
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        if (!transaction) return;
        setDeleting(true);
        router.delete(route('transactions.destroy', transaction.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); onClose(); },
        });
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !deleting && onClose()} initialFocus={cancelRef}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                                <div className="p-6">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-4 ring-rose-100">
                                        <AlertTriangle size={22} className="text-rose-500" />
                                    </div>
                                    <Dialog.Title className="text-center text-[15px] font-bold text-slate-900">Pindahkan ke Trash?</Dialog.Title>
                                    <Dialog.Description className="mt-2 text-center text-sm text-slate-500">
                                        Transaksi akan disimpan di Trash dan bisa dipulihkan nanti.
                                    </Dialog.Description>
                                    {transaction && (
                                        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/60 text-sm">
                                            <div className="flex items-center justify-between">
                                                <CategoryBadge category={transaction.category} />
                                                <span className={`font-mono tabular-nums font-bold ${transaction.type === 'masuk' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {transaction.type === 'masuk' ? '+' : '−'} {formatRupiah(transaction.amount)}
                                                </span>
                                            </div>
                                            {transaction.description && (
                                                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{transaction.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
                                    <button ref={cancelRef} type="button" onClick={onClose} disabled={deleting} className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">Batal</button>
                                    <button type="button" onClick={handleDelete} disabled={deleting} className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                                        {deleting ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menghapus…</> : <><Trash2 size={14} />Ya, Pindahkan</>}
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

// ─── Modal: Force Delete (Hapus Permanen) ─────────────────────────────────────

function ForceDeleteConfirmModal({ transaction, onClose, onConfirm }) {
    const open      = transaction !== null;
    const cancelRef = useRef(null);
    const [busy, setBusy] = useState(false);

    function handleConfirm() {
        if (!transaction) return;
        setBusy(true);
        router.delete(route('transactions.forceDelete', transaction.id), {
            preserveScroll: true,
            onFinish: () => { setBusy(false); onClose(); },
        });
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !busy && onClose()} initialFocus={cancelRef}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                                <div className="p-6">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-4 ring-rose-100">
                                        <Trash2 size={22} className="text-rose-600" />
                                    </div>
                                    <Dialog.Title className="text-center text-[15px] font-bold text-slate-900">Hapus Permanen?</Dialog.Title>
                                    <Dialog.Description className="mt-2 text-center text-sm text-slate-500">
                                        Tindakan ini <strong className="text-slate-700">tidak dapat dibatalkan</strong>. Data akan hilang selamanya.
                                    </Dialog.Description>
                                    {transaction && (
                                        <div className="mt-4 rounded-xl bg-rose-50 p-3.5 ring-1 ring-rose-200/60 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-rose-700">{transaction.category}</span>
                                                <span className={`font-mono tabular-nums font-bold ${transaction.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {transaction.type === 'masuk' ? '+' : '−'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(transaction.amount)}
                                                </span>
                                            </div>
                                            {transaction.description && (
                                                <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">{transaction.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
                                    <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">Batal</button>
                                    <button type="button" onClick={handleConfirm} disabled={busy} className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                                        {busy ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menghapus…</> : <><Trash2 size={14} />Hapus Permanen</>}
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

// ─── Modal: Empty Trash Confirmation ──────────────────────────────────────────

function EmptyTrashConfirmModal({ open, onClose }) {
    const cancelRef = useRef(null);
    const [busy, setBusy] = useState(false);

    function handleConfirm() {
        setBusy(true);
        router.delete(route('transactions.emptyTrash'), {
            preserveScroll: true,
            onFinish: () => { setBusy(false); onClose(); },
        });
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !busy && onClose()} initialFocus={cancelRef}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                                <div className="p-6">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-4 ring-rose-100">
                                        <AlertTriangle size={22} className="text-rose-600" />
                                    </div>
                                    <Dialog.Title className="text-center text-[15px] font-bold text-slate-900">Kosongkan Keranjang Sampah?</Dialog.Title>
                                    <Dialog.Description className="mt-2 text-center text-sm text-slate-500">
                                        Semua transaksi di Trash akan dihapus <strong className="text-slate-700">selamanya</strong>. Tidak ada cara untuk memulihkan data ini.
                                    </Dialog.Description>
                                    <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200/60">
                                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                                        <p className="text-xs leading-relaxed text-amber-800">Tindakan ini bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
                                    <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">Batal</button>
                                    <button type="button" onClick={handleConfirm} disabled={busy} className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                                        {busy ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Mengosongkan…</> : <><Trash2 size={14} />Ya, Kosongkan</>}
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

// ─── Modal: Serah Terima Jabatan ──────────────────────────────────────────────

function HandoverModal({ open, onClose, students = [] }) {
    const closeRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        new_treasurer_id: '',
        password:         '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('treasurer.handover'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    function handleClose() { reset(); onClose(); }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose} initialFocus={closeRef}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80">
                                {/* Header */}
                                <div className="border-b border-slate-100 bg-[#E0F2FE]/50 px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-[#FACC15]">
                                                <UserCheck size={18} />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-[15px] font-bold text-[#0F172A]">
                                                    Serah Terima Jabatan
                                                </Dialog.Title>
                                                <p className="mt-0.5 text-xs text-slate-500">Bendahara aktif akan diturunkan ke Pelajar</p>
                                            </div>
                                        </div>
                                        <button ref={closeRef} type="button" onClick={handleClose} aria-label="Tutup modal" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"><X size={16} /></button>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="space-y-5 px-6 py-5">
                                        {/* Warning */}
                                        <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200/60">
                                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                            <p className="text-xs leading-relaxed text-amber-800">
                                                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Akun Anda akan otomatis keluar setelah serah terima berhasil.
                                            </p>
                                        </div>

                                        {/* New treasurer selector */}
                                        <div>
                                            <label htmlFor="handover-student" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Bendahara Baru <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="handover-student"
                                                    value={data.new_treasurer_id}
                                                    onChange={(e) => setData('new_treasurer_id', e.target.value)}
                                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                                >
                                                    <option value="">Pilih pelajar…</option>
                                                    {students.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            <FieldError message={errors.new_treasurer_id} />
                                        </div>

                                        {/* Password confirmation */}
                                        <div>
                                            <label htmlFor="handover-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Konfirmasi Kata Sandi Anda <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="handover-password"
                                                type="password"
                                                autoComplete="current-password"
                                                placeholder="Masukkan kata sandi aktif…"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                aria-invalid={!!errors.password}
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-[#4B729F] focus:outline-none focus:ring-1 focus:ring-[#4B729F]"
                                            />
                                            <FieldError message={errors.password} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
                                        <button type="button" onClick={handleClose} disabled={processing} className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">Batal</button>
                                        <button type="submit" disabled={processing} className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] py-2 text-sm font-bold text-white transition hover:bg-[#1e3a8a]/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                            {processing ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Memproses…</> : <><ShieldCheck size={15} />Serahkan Jabatan</>}
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

// ─── Flash Toast ───────────────────────────────────────────────────────────────

function FlashToast({ flash }) {
    const [visible, setVisible] = useState(false);
    const message = flash?.success ?? flash?.error ?? null;

    useEffect(() => {
        if (!message) return;
        setVisible(true);
        const t = setTimeout(() => setVisible(false), 4500);
        return () => clearTimeout(t);
    }, [message]);

    if (!visible || !message) return null;
    const isError = !!flash?.error;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 transition-all duration-300 ${
                isError ? 'bg-rose-600 text-white ring-rose-700' : 'bg-[#1E3A8A] text-white ring-[#1e3a8a]/80'
            }`}
        >
            {message}
            <button type="button" onClick={() => setVisible(false)} aria-label="Tutup notifikasi" className="ml-1 rounded-md p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd, hasFilters = false, isTrash = false }) {
    return (
        <div role="status" className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isTrash ? 'bg-rose-50' : 'bg-[#E0F2FE]'}`}>
                {isTrash ? <Trash2 size={24} className="text-rose-400" /> : <Wallet size={24} className="text-[#4B729F]" />}
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
                {isTrash ? 'Trash kosong' : hasFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
            </h3>
            <p className="mt-1 max-w-[24ch] text-xs text-slate-400 leading-relaxed">
                {isTrash
                    ? 'Tidak ada transaksi yang dihapus.'
                    : hasFilters
                        ? 'Coba ubah kata kunci atau hapus filter yang aktif.'
                        : 'Mulai dengan menambahkan transaksi pertama.'}
            </p>
            {!hasFilters && !isTrash && (
                <button type="button" onClick={onAdd} className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2 text-xs font-bold text-[#1E3A8A] transition hover:bg-[#f5c400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]">
                    <Plus size={14} />Tambah Transaksi
                </button>
            )}
        </div>
    );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ meta }) {
    const { from, to, total, current_page, last_page, links = [] } = meta;

    // Convert Laravel paginator links → rendered buttons
    const pageLinks = links.map((link) => {
        const isFirst = link.label.includes('Previous') || link.label.includes('laquo');
        const isLast  = link.label.includes('Next')     || link.label.includes('raquo');
        return {
            url:    link.url,
            label:  isFirst ? 'Sebelumnya' : isLast ? 'Selanjutnya' : link.label,
            active: link.active,
            isFirst,
            isLast,
        };
    });

    function goTo(url) {
        if (!url) return;
        router.get(url, {}, { preserveScroll: true, preserveState: true, replace: true });
    }

    if (last_page <= 1) {
        return (
            <div className="flex items-center justify-center border-t border-slate-100 px-5 py-3.5">
                <p className="text-xs text-slate-500">
                    Menampilkan{' '}
                    <span className="font-mono tabular-nums font-semibold text-slate-700">{from ?? 0}–{to ?? 0}</span>{' '}
                    dari <span className="font-mono tabular-nums font-semibold text-slate-700">{total?.toLocaleString('id-ID') ?? 0}</span> transaksi
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-between">
            {/* Count summary */}
            <p className="text-xs text-slate-500">
                Menampilkan{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-700">{from ?? 0}–{to ?? 0}</span>{' '}
                dari <span className="font-mono tabular-nums font-semibold text-slate-700">{total?.toLocaleString('id-ID') ?? 0}</span> transaksi
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-1" role="navigation" aria-label="Navigasi halaman">
                {pageLinks.map((link, i) => {
                    const isDisabled = !link.url;
                    const isNav      = link.isFirst || link.isLast;

                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goTo(link.url)}
                            disabled={isDisabled}
                            aria-label={link.isFirst ? 'Halaman sebelumnya' : link.isLast ? 'Halaman berikutnya' : `Halaman ${link.label}`}
                            aria-current={link.active ? 'page' : undefined}
                            className={[
                                'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]',
                                isDisabled
                                    ? 'cursor-not-allowed opacity-40 border-slate-200 bg-white text-slate-400'
                                    : link.active
                                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white font-bold shadow-sm cursor-default'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300',
                                isNav ? 'px-3 text-[11px]' : '',
                            ].join(' ')}
                        >
                            {link.isFirst ? <ArrowLeft size={13} /> : link.isLast ? <ArrowRight size={13} /> : link.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard({
    auth,
    transactions,
    totalMasuk,
    totalKeluar,
    sisaSaldo,
    categories = CATEGORIES,
    filters    = {},
    activeTab  = 'active',
    students   = [],
}) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    // Modal state
    const [showAdd,             setShowAdd]             = useState(false);
    const [editTarget,          setEditTarget]          = useState(null);
    const [deleteTarget,        setDeleteTarget]        = useState(null);
    const [historyTarget,       setHistoryTarget]       = useState(null);
    const [showHandover,        setShowHandover]        = useState(false);
    const [forceDeleteTarget,   setForceDeleteTarget]   = useState(null);   // single hard-delete
    const [showEmptyTrash,      setShowEmptyTrash]      = useState(false);  // empty all trash

    // Filter state
    const [search,    setSearch]    = useState(filters.search     ?? '');
    const [category,  setCategory]  = useState(filters.category   ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate,   setEndDate]   = useState(filters.end_date   ?? '');

    const navigate = useDebounce((params) => {
        router.get(route('transactions.index'), params, { preserveState: true, replace: true });
    }, 350);

    function applyFilters(overrides = {}) {
        const params = { search, category, start_date: startDate, end_date: endDate, tab: activeTab, ...overrides, page: 1 };
        Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
        navigate(params);
    }

    function switchTab(tab) {
        router.get(route('transactions.index'), { tab }, { preserveState: false, replace: true });
    }

    function handleSearchChange(e) { setSearch(e.target.value); applyFilters({ search: e.target.value }); }
    function handleCategoryChange(e) { const v = e.target.value; setCategory(v); applyFilters({ category: v }); }
    function handleDateChange(field, value) {
        if (field === 'start') { setStartDate(value); applyFilters({ start_date: value }); }
        else { setEndDate(value); applyFilters({ end_date: value }); }
    }
    function clearFilters() {
        setSearch(''); setCategory(''); setStartDate(''); setEndDate('');
        router.get(route('transactions.index'), { tab: activeTab }, { preserveState: false, replace: true });
    }

    function handleRestore(id) {
        router.post(route('transactions.restore', id), {}, {
            preserveScroll: true,
            onSuccess: () => {},
        });
    }

    function handleForceDelete(id) {
        router.delete(route('transactions.forceDelete', id), {
            preserveScroll: true,
            onSuccess: () => setForceDeleteTarget(null),
        });
    }

    function handleEmptyTrash() {
        router.delete(route('transactions.emptyTrash'), {
            preserveScroll: true,
            onSuccess: () => setShowEmptyTrash(false),
        });
    }

    const hasActiveFilters = search || category || startDate || endDate;
    const isTrash          = activeTab === 'trash';
    const txList           = transactions?.data ?? [];

    return (
        <>
            <Head title="Dashboard Bendahara — Rekap Kas XI PPLG 2" />

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

                {/* ── HEADER ── */}
                <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

                        {/* Branding */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('home')}
                                aria-label="Kembali ke Beranda"
                                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] sm:inline-flex"
                            >
                                <ArrowLeft size={12} />
                                Beranda
                            </Link>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A]">
                                <Wallet size={17} strokeWidth={2} className="text-[#FACC15]" />
                            </div>
                            <div className="leading-none">
                                <p className="text-sm font-bold tracking-tight text-[#1E3A8A]">Rekap Kas</p>
                                <p className="mt-0.5 text-[11px] font-medium text-[#4B729F]">XI PPLG 2</p>
                            </div>
                        </div>

                        {/* Right: identity + handover + logout */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Identity pill */}
                            <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-[#E0F2FE] px-3 py-1.5 sm:flex">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-bold text-[#FACC15]">
                                    {auth?.user?.name?.[0]?.toUpperCase() ?? 'B'}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold leading-none text-[#1E3A8A]">{auth?.user?.name ?? 'Bendahara'}</p>
                                    <p className="mt-0.5 text-[10px] leading-none text-[#4B729F]">Bendahara</p>
                                </div>
                            </div>

                            {/* Handover button */}
                            <button
                                type="button"
                                onClick={() => setShowHandover(true)}
                                aria-label="Serah terima jabatan bendahara"
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-[#4B729F] hover:bg-[#E0F2FE] hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]"
                            >
                                <UserCheck size={13} />
                                <span className="hidden sm:inline">Serah Terima</span>
                            </button>

                            <Link
                                method="post"
                                as="button"
                                href={route('logout')}
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            >
                                <LogOut size={13} />
                                <span className="hidden sm:inline">Keluar</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                    {/* ── METRIC CARDS (always active-only data) ── */}
                    <section aria-labelledby="metrics-heading" className="dash-enter dash-enter-d1">
                        <h1 id="metrics-heading" className="sr-only">Ringkasan Keuangan Kas</h1>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <MetricCard label="Total Saldo"      value={sisaSaldo}   icon={Wallet}      variant="navy"    />
                            <MetricCard label="Total Pemasukan"  value={totalMasuk}  icon={TrendingUp}  variant="emerald" />
                            <MetricCard label="Total Pengeluaran" value={totalKeluar} icon={TrendingDown} variant="rose"    />
                        </div>
                    </section>

                    {/* ── FILTER TOOLBAR ── */}
                    <section aria-label="Filter dan Cari Transaksi" className="dash-enter dash-enter-d2 mt-6">
                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:flex-wrap">
                            {/* Search */}
                            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
                                <select aria-label="Filter kategori" value={category} onChange={handleCategoryChange} className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-8 text-sm text-slate-700 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]">
                                    <option value="">Semua Kategori</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>

                            {/* Date range */}
                            <div className="flex items-center gap-2">
                                <CalendarDays size={14} className="shrink-0 text-slate-400" />
                                <input type="date" aria-label="Dari tanggal" value={startDate} onChange={(e) => handleDateChange('start', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                                <span className="text-xs text-slate-400">–</span>
                                <input type="date" aria-label="Sampai tanggal" value={endDate} onChange={(e) => handleDateChange('end', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 transition focus:border-[#4B729F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B729F]" />
                            </div>

                            {hasActiveFilters && (
                                <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                    Reset
                                </button>
                            )}

                            <div className="flex-1" />

                            {/* Export + Add */}
                            <div className="flex items-center gap-2">
                                {isTrash ? (
                                    /* Trash-mode toolbar: empty trash */
                                    txList.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowEmptyTrash(true)}
                                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                        >
                                            <Trash2 size={14} strokeWidth={2} />
                                            Kosongkan Sampah
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <a href={buildExportUrl('csv', { search, category, start_date: startDate, end_date: endDate })} download aria-label="Unduh CSV" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#4B729F] hover:bg-[#E0F2FE] hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                            <FileDown size={14} strokeWidth={2} />CSV
                                        </a>
                                        <button type="button" onClick={() => window.open(buildExportUrl('print', { search, category, start_date: startDate, end_date: endDate }), '_blank', 'noopener,noreferrer')} aria-label="Cetak laporan" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#4B729F] hover:bg-[#E0F2FE] hover:text-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F]">
                                            <Printer size={14} strokeWidth={2} />Cetak
                                        </button>
                                        <button type="button" onClick={() => setShowAdd(true)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#1E3A8A] shadow-sm transition hover:bg-[#f5c400] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]">
                                            <Plus size={15} strokeWidth={2.5} />Tambah
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── LEDGER TABLE ── */}
                    <section aria-labelledby="ledger-heading" className="dash-enter dash-enter-d3 mt-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

                            {/* Tab switcher + heading */}
                            <div className="border-b border-slate-200/80">
                                <div className="flex items-center justify-between px-6 pt-4">
                                    <h2 id="ledger-heading" className="text-sm font-bold text-[#1E3A8A]">
                                        {isTrash ? 'Riwayat Dihapus (Trash)' : 'Riwayat Transaksi'}
                                        {transactions?.total !== undefined && (
                                            <span className="ml-2 font-mono tabular-nums text-xs font-semibold text-[#4B729F]">
                                                ({transactions.total.toLocaleString('id-ID')} entri)
                                            </span>
                                        )}
                                    </h2>
                                </div>

                                {/* Segmented tabs */}
                                <div className="flex gap-1 px-6 pb-0 pt-2" role="tablist">
                                    {[
                                        { key: 'active', label: 'Transaksi Aktif',          icon: Check  },
                                        { key: 'trash',  label: 'Riwayat Dihapus (Trash)',  icon: Trash2 },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            role="tab"
                                            aria-selected={activeTab === key}
                                            type="button"
                                            onClick={() => switchTab(key)}
                                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-t-xl border-b-2 px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B729F] ${
                                                activeTab === key
                                                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            <Icon size={12} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop table */}
                            <div className="overflow-x-auto">
                                <table className="hidden w-full border-collapse text-sm sm:table" role="grid">
                                    <thead>
                                        <tr className="border-b border-[#E0F2FE] bg-[#E0F2FE]/40">
                                            {(isTrash
                                                ? ['Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah', 'Dihapus', 'Aksi']
                                                : ['Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah', 'Aksi']
                                            ).map((h) => (
                                                <th
                                                    key={h}
                                                    scope="col"
                                                    className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E3A8A] ${h === 'Jumlah' ? 'text-right' : ''} ${h === 'Aksi' ? 'w-28 text-right pr-6' : ''}`}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {txList.length === 0 ? (
                                            <tr>
                                                <td colSpan={isTrash ? 7 : 6}>
                                                    <EmptyState onAdd={() => setShowAdd(true)} hasFilters={!!hasActiveFilters} isTrash={isTrash} />
                                                </td>
                                            </tr>
                                        ) : (
                                            txList.map((tx) => (
                                                <tr key={tx.id} className="group transition-colors hover:bg-slate-50/60">
                                                    {/* Date */}
                                                    <td className="whitespace-nowrap px-5 py-3.5 font-mono tabular-nums text-xs text-slate-500">
                                                        {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>

                                                    {/* Category */}
                                                    <td className="whitespace-nowrap px-5 py-3.5">
                                                        <CategoryBadge category={tx.category} />
                                                    </td>

                                                    {/* Description + edit badge */}
                                                    <td className="max-w-[220px] px-5 py-3.5">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <p className="truncate text-sm text-slate-700">
                                                                {tx.description || <span className="italic text-slate-400">—</span>}
                                                            </p>
                                                            {tx.edits?.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setHistoryTarget(tx)}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-200/60 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                                    aria-label={`Lihat ${tx.edits.length} riwayat edit`}
                                                                >
                                                                    <History size={9} />
                                                                    Diedit ({tx.edits.length})
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Type */}
                                                    <td className="whitespace-nowrap px-5 py-3.5">
                                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${tx.type === 'masuk' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60' : 'bg-rose-50 text-rose-600 ring-rose-200/60'}`}>
                                                            {tx.type === 'masuk' ? 'Masuk' : 'Keluar'}
                                                        </span>
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                                        <span className={`font-mono tabular-nums text-sm font-bold ${tx.type === 'masuk' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                            {tx.type === 'masuk' ? '+' : '−'} {formatRupiah(tx.amount)}
                                                        </span>
                                                    </td>

                                                    {/* Deleted at (trash view) */}
                                                    {isTrash && (
                                                        <td className="whitespace-nowrap px-5 py-3.5">
                                                            <span className="font-mono tabular-nums text-[11px] text-slate-400">{formatDatetime(tx.deleted_at)}</span>
                                                        </td>
                                                    )}

                                                    {/* Actions */}
                                                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {isTrash ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRestore(tx.id)}
                                                                        aria-label={`Pulihkan transaksi ${tx.description || tx.category}`}
                                                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                                    >
                                                                        <RefreshCw size={13} />Pulihkan
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setForceDeleteTarget(tx)}
                                                                        aria-label={`Hapus permanen transaksi ${tx.description || tx.category}`}
                                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button type="button" onClick={() => setEditTarget(tx)} aria-label={`Edit transaksi ${tx.description || tx.category}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                                                        <Pencil size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => setDeleteTarget(tx)} aria-label={`Hapus transaksi ${tx.description || tx.category}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Mobile card list */}
                                <ul className="divide-y divide-slate-100 sm:hidden">
                                    {txList.length === 0 ? (
                                        <li><EmptyState onAdd={() => setShowAdd(true)} hasFilters={!!hasActiveFilters} isTrash={isTrash} /></li>
                                    ) : (
                                        txList.map((tx) => (
                                            <li key={tx.id} className="flex items-start justify-between gap-3 px-5 py-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <CategoryBadge category={tx.category} />
                                                        <span className="font-mono tabular-nums text-[11px] text-slate-400">
                                                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        {tx.edits?.length > 0 && (
                                                            <button type="button" onClick={() => setHistoryTarget(tx)} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-200/60 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                                                <History size={9} />Diedit ({tx.edits.length})
                                                            </button>
                                                        )}
                                                    </div>
                                                    {tx.description && <p className="mt-1 truncate text-sm text-slate-700">{tx.description}</p>}
                                                    {isTrash && <p className="mt-0.5 text-[10px] text-slate-400">Dihapus: {formatDatetime(tx.deleted_at)}</p>}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    <span className={`font-mono tabular-nums text-sm font-bold mr-1 ${tx.type === 'masuk' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {tx.type === 'masuk' ? '+' : '−'} {formatRupiah(tx.amount)}
                                                    </span>
                                                    {isTrash ? (
                                                        <>
                                                            <button type="button" onClick={() => handleRestore(tx.id)} aria-label="Pulihkan transaksi" className="flex min-h-[44px] items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                                                                <RefreshCw size={13} />
                                                            </button>
                                                            <button type="button" onClick={() => setForceDeleteTarget(tx)} aria-label="Hapus permanen" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button type="button" onClick={() => setEditTarget(tx)} aria-label="Edit" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Pencil size={15} /></button>
                                                            <button type="button" onClick={() => setDeleteTarget(tx)} aria-label="Hapus" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"><Trash2 size={15} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>

                            {transactions && <Pagination meta={transactions} />}
                        </div>
                    </section>
                </main>
            </div>

            {/* ── MODALS ── */}
            <TambahTransaksiModal open={showAdd} onClose={() => setShowAdd(false)} categories={categories} />
            <EditTransaksiModal   transaction={editTarget}      onClose={() => setEditTarget(null)}      categories={categories} />
            <DeleteConfirmModal   transaction={deleteTarget}    onClose={() => setDeleteTarget(null)} />
            <EditHistoryModal     transaction={historyTarget}   onClose={() => setHistoryTarget(null)} />
            <HandoverModal        open={showHandover}           onClose={() => setShowHandover(false)} students={students} />
            <ForceDeleteConfirmModal transaction={forceDeleteTarget} onClose={() => setForceDeleteTarget(null)} />
            <EmptyTrashConfirmModal  open={showEmptyTrash}          onClose={() => setShowEmptyTrash(false)} />
            <FlashToast flash={flash} />
        </>
    );
}
