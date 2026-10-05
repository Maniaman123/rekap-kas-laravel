import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Wallet, ArrowRight, LogOut } from 'lucide-react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-white shadow-xs">
                            <Wallet className="h-5 w-5 text-[#FACC15]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                    Dashboard Bendahara
                                </h1>
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#1E3A8A] border border-blue-200/60">
                                    XI PPLG 2
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Kelola pemasukan, pengeluaran, dan transparansi kas kelas.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <Link
                            method="post"
                            as="button"
                            href={route('logout')}
                            className="border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition rounded-xl text-xs font-semibold px-3.5 py-2 inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>Keluar</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard Bendahara — Rekap Kas XI PPLG 2" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Akses Pengelolaan Kas Kelas
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Buka buku kas untuk mencatat transaksi baru, merekap saldo, atau memverifikasi pembayaran siswa.
                                </p>
                            </div>
                            <Link
                                href={route('kas.index')}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1e3a8a]/90 min-h-[44px]"
                            >
                                <span>Buka Rekap Kas</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
