import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Wallet,
    Eye,
    Zap,
    Users,
    Menu,
    X,
    ArrowRight,
    ChevronRight,
} from 'lucide-react';

// ─── Design-system tokens (matches tailwind.config.js brand palette) ─────────
// brand.navy  = #1E3A8A
// brand.blue  = #4B729F
// brand.yellow= #FACC15
// brand.ice   = #E0F2FE
// brand.bg    = #F8FAFC

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Format whole-Rupiah integer → "Rp 1.250.000" — safe on 0 / null / undefined */
const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const FEATURES = [
    {
        icon: Eye,
        title: 'Transparansi Penuh',
        desc: 'Semua siswa bisa melihat rekap kas kapan saja dan di perangkat apa saja — tidak ada lagi pertanyaan "uang kas habis buat apa?"',
    },
    {
        icon: Zap,
        title: 'Rekap Real-time',
        desc: 'Setiap transaksi yang dicatat bendahara langsung terlihat. Saldo terhitung otomatis — tidak perlu tunggu laporan bulanan.',
    },
    {
        icon: Users,
        title: 'Peran Ganda',
        desc: 'Bendahara mendapat akses penuh untuk mencatat dan mengelola. Siswa mendapat akses baca untuk memantau — semuanya dari satu sistem.',
    },
];

const STEPS = [
    {
        n: '1',
        title: 'Daftar dengan peranmu',
        desc: 'Buat akun sebagai Siswa — atau Bendahara jika kamu pegang kunci kelas.',
    },
    {
        n: '2',
        title: 'Bendahara catat transaksi',
        desc: 'Setiap pemasukan dan pengeluaran dicatat dengan deskripsi, kategori, dan tanggal.',
    },
    {
        n: '3',
        title: 'Semua bisa pantau',
        desc: 'Saldo dan riwayat transaksi terbuka untuk seluruh anggota kelas secara real-time.',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Wordmark used in both header and footer */
function Wordmark({ inverted = false }) {
    return (
        <div className="flex items-center gap-2.5">
            <div
                className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    inverted ? 'bg-white/15' : 'bg-brand-navy',
                ].join(' ')}
            >
                <Wallet
                    size={18}
                    strokeWidth={2}
                    className={inverted ? 'text-brand-yellow' : 'text-brand-yellow'}
                />
            </div>
            <div className="leading-none">
                <p
                    className={[
                        'text-sm font-bold tracking-tight',
                        inverted ? 'text-white' : 'text-brand-navy',
                    ].join(' ')}
                >
                    Rekap Kas
                </p>
                <p
                    className={[
                        'mt-0.5 text-[11px] font-medium',
                        inverted ? 'text-white/60' : 'text-brand-blue',
                    ].join(' ')}
                >
                    XI PPLG 2
                </p>
            </div>
        </div>
    );
}

/** Live badge with pulsing dot — pure CSS, no animation library */
function LiveBadge() {
    return (
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200/80">
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Live</span>
        </div>
    );
}

/** Single stat row inside the preview card */
function StatRow({ label, value, isNumeric }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3.5 ring-1 ring-slate-200/60">
            <span className="text-xs font-medium leading-tight text-slate-500">{label}</span>
            <span
                className={[
                    'shrink-0 text-lg font-bold tabular-nums text-brand-navy',
                    isNumeric ? 'font-mono' : 'font-mono',
                ].join(' ')}
            >
                {value}
            </span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
/**
 * @param {{ auth?: { user?: object } }} props
 */
export default function Welcome({ auth, kasSummary = {} }) {
    const kas = {
        totalSaldo:     kasSummary.totalSaldo     ?? 0,
        totalMasuk:     kasSummary.totalMasuk     ?? 0,
        totalKeluar:    kasSummary.totalKeluar    ?? 0,
        totalTransaksi: kasSummary.totalTransaksi ?? 0,
    };

    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <Head title="Rekap Uang Kas XI PPLG 2 — Transparansi Keuangan Kelas" />

            {/*
             * Page-load entrance: hero content fades and slides up.
             * CSS animation — runs off main thread, stays smooth while Inertia
             * finishes hydrating. Rare / first-time tier → delight budget justified.
             * prefers-reduced-motion strips the transform so only opacity remains.
             */}
            <style>{`
                @keyframes enter {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: no-preference) {
                    .anim-enter {
                        animation: enter 500ms cubic-bezier(0.23,1,0.32,1) both;
                    }
                    .anim-enter-d1 { animation-delay: 60ms;  }
                    .anim-enter-d2 { animation-delay: 130ms; }
                    .anim-enter-d3 { animation-delay: 200ms; }
                    .anim-enter-d4 { animation-delay: 280ms; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .anim-enter { animation: none; }
                }
            `}</style>

            <div className="min-h-screen bg-brand-bg font-sans antialiased">

                {/* ── HEADER ─────────────────────────────────────────────────── */}
                <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                        <Link href={route('welcome')} aria-label="Beranda Rekap Kas">
                            <Wordmark />
                        </Link>

                        {/* Desktop nav */}
                        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
                            <a
                                href="#fitur"
                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                                Fitur
                            </a>
                            <a
                                href="#cara-kerja"
                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                                Cara Kerja
                            </a>
                        </nav>

                        {/* Auth buttons */}
                        <div className="hidden items-center gap-2 md:flex">
                            {auth?.user ? (
                                <Link
                                    href={route('transactions.index')}
                                    className="flex items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-navy/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                    Buka Dashboard <ArrowRight size={14} />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue transition-all duration-150 hover:bg-brand-ice active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-navy active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen((o) => !o)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition-colors hover:bg-slate-100 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>

                    {/* Mobile menu */}
                    {mobileOpen && (
                        <div className="border-t border-slate-200/80 bg-white px-4 pb-4 pt-2 md:hidden">
                            <nav className="mb-4 flex flex-col gap-1" aria-label="Navigasi mobile">
                                <a
                                    href="#fitur"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Fitur
                                </a>
                                <a
                                    href="#cara-kerja"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Cara Kerja
                                </a>
                            </nav>
                            {auth?.user ? (
                                <Link
                                    href={route('transactions.index')}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white"
                                >
                                    Buka Dashboard <ArrowRight size={14} />
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Link
                                        href={route('login')}
                                        className="flex w-full items-center justify-center rounded-xl border border-brand-blue py-2.5 text-sm font-semibold text-brand-blue"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="flex w-full items-center justify-center rounded-xl bg-brand-blue py-2.5 text-sm font-semibold text-white"
                                    >
                                        Daftar
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </header>

                <main>
                    {/* ── HERO ───────────────────────────────────────────────── */}
                    <section
                        aria-labelledby="hero-heading"
                        className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24"
                    >
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            {/* Left: copy */}
                            <div>
                                <p className="anim-enter anim-enter-d1 mb-4 text-sm font-semibold text-brand-blue">
                                    Keuangan kelas XI PPLG 2
                                </p>

                                <h1
                                    id="hero-heading"
                                    className="anim-enter anim-enter-d2 text-4xl font-bold leading-[1.12] tracking-tight text-brand-navy sm:text-5xl"
                                >
                                    Kas kelas yang{' '}
                                    <span className="relative inline-block">
                                        transparan
                                        {/* Star Accent Yellow — used once, as underline only */}
                                        <span
                                            aria-hidden="true"
                                            className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-brand-yellow"
                                        />
                                    </span>
                                    {' '}dan bisa dipantau siapa saja
                                </h1>

                                <p className="anim-enter anim-enter-d3 mt-5 max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
                                    Rekap Kas XI PPLG 2 menggantikan buku manual dengan sistem digital yang bisa diakses seluruh anggota kelas — kapan saja, dari perangkat apa saja.
                                </p>

                                <div className="anim-enter anim-enter-d4 mt-8 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={route('register')}
                                        className="flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-navy/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        Daftar Sekarang <ArrowRight size={15} />
                                    </Link>
                                    <a
                                        href="#cara-kerja"
                                        className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        Lihat Cara Kerja <ChevronRight size={15} className="text-slate-400" />
                                    </a>
                                </div>
                            </div>

                            {/* Right: stats preview card */}
                            <div className="anim-enter anim-enter-d3">
                                <div className="rounded-2xl border border-slate-200/80 bg-brand-ice p-6 shadow-md">
                                    {/* Card header */}
                                    <div className="mb-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-brand-navy">Ringkasan Kas Kelas</p>
                                            <p className="text-xs text-slate-400">Data ilustratif — tampil nyata setelah login</p>
                                        </div>
                                        <LiveBadge />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-col gap-2.5">
                                        <StatRow label="Saldo Kas" value={formatRupiah(kas.totalSaldo)} isNumeric />
                                        <StatRow label="Total Pemasukan" value={formatRupiah(kas.totalMasuk)} isNumeric />
                                        <StatRow label="Total Pengeluaran" value={formatRupiah(kas.totalKeluar)} isNumeric />
                                        <StatRow label="Jumlah Transaksi" value={`${kas.totalTransaksi} transaksi`} />
                                    </div>

                                    {/* Card footer */}
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-4">
                                        <span className="text-xs text-slate-400">Diperbarui real-time</span>
                                        <Link
                                            href={route('login')}
                                            className="flex items-center gap-1 text-xs font-semibold text-brand-blue transition-colors hover:text-brand-navy"
                                        >
                                            Lihat lengkap <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── FEATURES ───────────────────────────────────────────── */}
                    <section
                        id="fitur"
                        aria-labelledby="features-heading"
                        className="border-t border-slate-200/80 bg-white"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
                            <div className="mb-12 max-w-xl">
                                <h2
                                    id="features-heading"
                                    className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl"
                                >
                                    Semua yang kamu butuhkan, sudah ada
                                </h2>
                                <p className="mt-3 text-base text-slate-500">
                                    Dirancang khusus untuk kebutuhan kas kelas — tidak lebih, tidak kurang.
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                {FEATURES.map((f) => {
                                    const Icon = f.icon;
                                    return (
                                        <div
                                            key={f.title}
                                            className="rounded-2xl border border-slate-200/80 bg-brand-bg p-6 transition-shadow duration-200 hover:shadow-md"
                                        >
                                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-ice text-brand-blue ring-1 ring-slate-200/60">
                                                <Icon size={18} strokeWidth={1.8} />
                                            </div>
                                            <h3 className="mb-2 text-[15px] font-semibold text-brand-navy">
                                                {f.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ── HOW IT WORKS ───────────────────────────────────────── */}
                    <section
                        id="cara-kerja"
                        aria-labelledby="how-heading"
                        className="bg-brand-bg"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
                            <div className="mb-12 max-w-xl">
                                <h2
                                    id="how-heading"
                                    className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl"
                                >
                                    Tiga langkah, selesai
                                </h2>
                                <p className="mt-3 text-base text-slate-500">
                                    Mulai dari daftar sampai seluruh kelas bisa pantau kas — prosesnya singkat.
                                </p>
                            </div>

                            {/* Steps: vertical on mobile, horizontal on md+ */}
                            <ol className="relative flex flex-col gap-0 md:flex-row">
                                {STEPS.map((step, idx) => (
                                    <li
                                        key={step.n}
                                        className="relative flex flex-1 flex-col md:items-start"
                                    >
                                        {/* Connector line between steps (desktop only) */}
                                        {idx < STEPS.length - 1 && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute left-[calc(50%+28px)] top-5 hidden h-px w-[calc(100%-56px)] bg-slate-200 md:block"
                                            />
                                        )}

                                        {/* Step content */}
                                        <div className="flex items-start gap-4 pb-8 md:flex-col md:items-start md:gap-3 md:pb-0 md:pe-8">
                                            {/* Number badge */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy font-mono text-sm font-bold tabular-nums text-white ring-4 ring-brand-bg">
                                                {step.n}
                                            </div>

                                            <div>
                                                <h3 className="text-[15px] font-semibold text-slate-900">
                                                    {step.title}
                                                </h3>
                                                <p className="mt-1 max-w-[22ch] text-sm leading-relaxed text-slate-500 md:max-w-none">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>

                            <div className="mt-12">
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-navy/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                    Mulai Sekarang <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ── FOOTER ─────────────────────────────────────────────────── */}
                <footer className="bg-brand-navy">
                    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            {/* Left: wordmark + credit */}
                            <div>
                                <Wordmark inverted />
                                <p className="mt-3 text-sm text-slate-400">
                                    Dibuat oleh Kelas XI PPLG 2
                                </p>
                            </div>

                            {/* Right: links */}
                            <div className="flex items-center gap-5">
                                <Link
                                    href={route('login')}
                                    className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                    Daftar
                                </Link>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-white/10 pt-6">
                            <p className="text-xs text-slate-500">
                                &copy; {new Date().getFullYear()} Rekap Uang Kas XI PPLG 2. Hak cipta dilindungi.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
