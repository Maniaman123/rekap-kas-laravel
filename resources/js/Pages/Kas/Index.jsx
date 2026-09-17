import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    PlusCircle,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
    Check,
    X,
    Coins,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function KasIndex({ transactions = [], totalMasuk = 0, totalKeluar = 0, saldo = 0 }) {
    const [confirmDelete, setConfirmDelete] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        amount: '',
        type: 'masuk',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kas.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id) => {
        router.delete(route('kas.destroy', id), {
            onFinish: () => setConfirmDelete(null),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
            {/* ── Top Navigation / Header ────────────────────────────────────── */}
            <header className="border-b border-slate-200/80 bg-white shadow-xs">
                <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Brand & Title */}
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-white shadow-xs">
                                <Wallet className="h-5 w-5 text-[#FACC15]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                        Rekap Uang Kas
                                    </h1>
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#1E3A8A] border border-blue-200/60">
                                        XI PPLG 2
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Dashboard Keuangan & Transaksi Kelas
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Pill */}
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 text-xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="font-medium text-slate-600">Total Transaksi:</span>
                                <span className="font-mono font-semibold tabular-nums text-slate-900">
                                    {transactions.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Content Area ─────────────────────────────────────────── */}
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Summary Cards Grid ────────────────────────────────────── */}
                <section aria-label="Ringkasan Kas" className="mb-8 grid gap-4 sm:grid-cols-3">
                    {/* Card Total Saldo (Dominant SaaS Style) */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#1E3A8A] p-6 text-white shadow-md shadow-blue-950/10 border border-blue-900/40">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-blue-200/80">
                                Total Saldo Kas
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[#FACC15]">
                                <Coins className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-mono text-3xl font-extrabold tracking-tight tabular-nums text-white">
                                {formatRupiah(saldo)}
                            </p>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-200/90">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
                            <span>Saldo aktif kelas XI PPLG 2 saat ini</span>
                        </div>
                    </div>

                    {/* Card Total Pemasukan */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-slate-300">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                Total Pemasukan
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-mono text-2xl font-bold tracking-tight tabular-nums text-emerald-600">
                                {formatRupiah(totalMasuk)}
                            </p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Akumulasi masuk</span>
                        </div>
                    </div>

                    {/* Card Total Pengeluaran */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-slate-300">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                Total Pengeluaran
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                <TrendingDown className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-mono text-2xl font-bold tracking-tight tabular-nums text-rose-600">
                                {formatRupiah(totalKeluar)}
                            </p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                            <span>Akumulasi keluar</span>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* ── Form Section ───────────────────────────────────────── */}
                    <section aria-label="Input Transaksi Baru" className="lg:col-span-4">
                        <div className="sticky top-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                                    <PlusCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Tambah Transaksi
                                    </h2>
                                    <p className="text-xs text-slate-500">Catat pemasukan atau pengeluaran</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Title Input */}
                                <div>
                                    <label
                                        htmlFor="title"
                                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                                    >
                                        Keterangan Transaksi
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        placeholder="Misal: Kas Mingguan / Beli Spidol"
                                        className={`w-full rounded-xl border bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/5 ${
                                            errors.title ? 'border-rose-400 focus:ring-rose-400/10' : 'border-slate-200/80'
                                        }`}
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
                                    )}
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label
                                        htmlFor="amount"
                                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                                    >
                                        Nominal (Rp)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                                            Rp
                                        </span>
                                        <input
                                            id="amount"
                                            type="number"
                                            placeholder="0"
                                            min="1"
                                            className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-3.5 font-mono text-sm tabular-nums text-slate-900 transition focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/5 ${
                                                errors.amount ? 'border-rose-400 focus:ring-rose-400/10' : 'border-slate-200/80'
                                            }`}
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                        />
                                    </div>
                                    {errors.amount && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>
                                    )}
                                </div>

                                {/* Segmented Type Control */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Jenis Transaksi
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setData('type', 'masuk')}
                                            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                                                data.type === 'masuk'
                                                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                            Pemasukan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('type', 'keluar')}
                                            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                                                data.type === 'keluar'
                                                    ? 'bg-white text-rose-700 shadow-xs border border-rose-200/60'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                                            Pengeluaran
                                        </button>
                                    </div>
                                    {errors.type && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.type}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-yellow-400 active:scale-[0.99] disabled:opacity-50 shadow-xs"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>{processing ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* ── Table Section ───────────────────────────────────────── */}
                    <section aria-label="Daftar Riwayat Transaksi" className="lg:col-span-8">
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                            {/* Table Subheader */}
                            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-slate-500" />
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Riwayat Transaksi
                                    </h2>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                    {transactions.length} Item
                                </span>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <Receipt className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-3 text-sm font-semibold text-slate-800">
                                        Belum ada riwayat transaksi
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Gunakan form di samping untuk mencatat transaksi kas pertama.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200/80 bg-slate-100/70 text-slate-500 font-semibold uppercase tracking-wider">
                                                <th className="px-6 py-3">Keterangan</th>
                                                <th className="px-6 py-3">Jenis</th>
                                                <th className="px-6 py-3 text-right">Nominal</th>
                                                <th className="px-6 py-3">Tanggal</th>
                                                <th className="px-6 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {transactions.map((tx) => (
                                                <tr
                                                    key={tx.id}
                                                    className="group transition-colors hover:bg-slate-50/80"
                                                >
                                                    {/* Keterangan */}
                                                    <td className="px-6 py-3.5">
                                                        <span className="font-semibold text-slate-900">
                                                            {tx.title}
                                                        </span>
                                                    </td>

                                                    {/* Jenis Badge */}
                                                    <td className="px-6 py-3.5">
                                                        {tx.type === 'masuk' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                                                                Masuk
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                                                                <ArrowDownRight className="h-3 w-3 text-rose-600" />
                                                                Keluar
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Nominal (Monospace Tabular Nums) */}
                                                    <td className="px-6 py-3.5 text-right">
                                                        <span
                                                            className={`font-mono text-xs font-bold tabular-nums ${
                                                                tx.type === 'masuk'
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-600'
                                                            }`}
                                                        >
                                                            {tx.type === 'masuk' ? '+' : '-'}
                                                            {formatRupiah(tx.amount)}
                                                        </span>
                                                    </td>

                                                    {/* Tanggal */}
                                                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                                                        {formatDate(tx.created_at)}
                                                    </td>

                                                    {/* Aksi Hapus */}
                                                    <td className="px-6 py-3.5 text-right">
                                                        {confirmDelete === tx.id ? (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(tx.id)}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition"
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                    Hapus
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDelete(null)}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmDelete(tx.id)}
                                                                className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                                title="Hapus transaksi"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="mt-12 border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
                <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E3A8A]">XI PPLG 2</span>
                        <span>&bull;</span>
                        <span>Sistem Rekap Kas Kelas</span>
                    </div>
                    <p className="text-slate-400">
                        &copy; {new Date().getFullYear()} Rekap Kas. Built with Laravel & React.
                    </p>
                </div>
            </footer>
        </div>
    );
}
