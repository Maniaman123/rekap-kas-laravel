import { Head, Link } from '@inertiajs/react';

// ─── Static preview data — swap for real Inertia props when wiring to backend ─
const PREVIEW_STATS = [
    { label: 'Total Kas Terkumpul', value: 'Rp 3.750.000', sub: 'Sejak awal semester' },
    { label: 'Jumlah Transaksi', value: '47', sub: 'Pemasukan & pengeluaran' },
    { label: 'Anggota Aktif', value: '32', sub: 'Dari 36 siswa' },
];

const FEATURES = [
    {
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        ),
        title: 'Transparansi Penuh',
        desc: 'Setiap siswa dapat melihat riwayat transaksi secara real-time. Tidak ada lagi informasi yang tertutup atau pertanyaan "uang kas dipakai buat apa?"',
    },
    {
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
        title: 'Rekap Real-time',
        desc: 'Saldo kas selalu terhitung otomatis. Bendahara cukup input transaksi — dashboard langsung memperbarui total pemasukan, pengeluaran, dan saldo bersih.',
    },
    {
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
        ),
        title: 'Peran Ganda',
        desc: 'Bendahara mendapat akses penuh untuk kelola transaksi dan ekspor laporan. Siswa mendapat akses baca untuk memantau keuangan kelas kapan saja.',
    },
];

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Rekap Uang Kas XI PPLG 2" />

            <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
                {/* ── Header ──────────────────────────────────────────────────── */}
                <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
                        {/* Wordmark */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A8A]">
                                <svg className="h-4.5 w-4.5 text-[#FACC15]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                                </svg>
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-bold tracking-tight text-slate-900">Rekap Kas</p>
                                <p className="text-[10px] font-medium text-[#4B729F]">XI PPLG 2</p>
                            </div>
                        </div>

                        {/* Nav */}
                        <nav className="flex items-center gap-2">
                            {auth?.user ? (
                                <Link
                                    href={route('kas.index')}
                                    className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#1e3a8a]/90 active:scale-[0.97]"
                                >
                                    Buka Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#1e3a8a]/90 active:scale-[0.97]"
                                    >
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
                    {/* ── Hero ────────────────────────────────────────────────── */}
                    <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            {/* Copy */}
                            <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E0F2FE] bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#4B729F]" />
                                    Keuangan Kelas Digital
                                </span>

                                <h1 className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
                                    Kelola uang kas kelas{' '}
                                    <span className="text-[#1E3A8A]">dengan jelas</span>{' '}
                                    dan{' '}
                                    <span className="relative inline-block">
                                        transparan
                                        <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded bg-[#FACC15]" />
                                    </span>
                                </h1>

                                <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
                                    Rekap Kas XI PPLG 2 menggantikan buku kas manual dengan sistem digital yang bisa dipantau seluruh anggota kelas — kapan saja, di perangkat apa saja.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href={route('register')}
                                        className="rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#1e3a8a]/90 active:scale-[0.97]"
                                    >
                                        Mulai Sekarang
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl border border-slate-200/80 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
                                    >
                                        Sudah punya akun? Masuk
                                    </Link>
                                </div>
                            </div>

                            {/* Preview stats card */}
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">Ringkasan Keuangan Kelas</p>
                                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        Live
                                    </span>
                                </div>

                                <div className="grid gap-4">
                                    {PREVIEW_STATS.map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="flex items-center justify-between rounded-xl bg-[#E0F2FE]/60 px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-xs font-medium text-[#4B729F]">{stat.label}</p>
                                                <p className="text-[11px] text-slate-400">{stat.sub}</p>
                                            </div>
                                            <p className="font-mono text-base font-bold tabular-nums text-slate-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-4 text-center text-[11px] text-slate-400">
                                    Data ilustratif — angka nyata tersedia setelah login
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ── Features ────────────────────────────────────────────── */}
                    <section className="border-t border-slate-200/80 bg-white">
                        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#4B729F]">
                                Dirancang untuk kelas
                            </p>
                            <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Semua yang dibutuhkan ada di sini
                            </h2>

                            <div className="mt-10 grid gap-6 sm:grid-cols-3">
                                {FEATURES.map((f) => (
                                    <div
                                        key={f.title}
                                        className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-6 transition-shadow duration-200 hover:shadow-md"
                                    >
                                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-[#FACC15]">
                                            {f.icon}
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                {/* ── Footer ──────────────────────────────────────────────────── */}
                <footer className="border-t border-slate-200/80 bg-[#F8FAFC]">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
                        <p>
                            &copy; {new Date().getFullYear()} Rekap Kas &mdash; XI PPLG 2
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href={route('login')} className="transition-colors hover:text-slate-600">
                                Masuk
                            </Link>
                            <Link href={route('register')} className="transition-colors hover:text-slate-600">
                                Daftar
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
