import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// ─── Field ──────────────────────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {string}  props.id
 * @param {string}  props.label
 * @param {string}  props.type
 * @param {string}  props.value
 * @param {string}  [props.autoComplete]
 * @param {boolean} [props.autoFocus]
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange
 * @param {string}  [props.error]
 */
function Field({ id, label, type = 'text', value, autoComplete, autoFocus, onChange, error }) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            <div className="relative mt-1.5">
                <input
                    id={id}
                    type={inputType}
                    name={id}
                    value={value}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    onChange={onChange}
                    className={[
                        'block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs',
                        isPassword ? 'pr-11' : '',
                        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B729F]/40',
                        'transition-colors duration-150',
                        error
                            ? 'border-red-400 bg-red-50/40 focus:ring-red-400/30'
                            : 'border-slate-200/80 bg-white hover:border-slate-300',
                    ].join(' ')}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-3.5 text-slate-400 hover:text-[#1E3A8A] focus:outline-none transition-colors min-h-[44px] min-w-[44px]"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
            )}
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {string}  [props.status]
 * @param {boolean} props.canResetPassword
 */
export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk — Rekap Kas XI PPLG 2" />

            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-12 font-sans antialiased">
                <div className="w-full max-w-md">
                    {/* Top-level back navigation */}
                    <div className="mb-6">
                        <Link
                            href={route().has('home') ? route('home') : '/'}
                            className="text-slate-500 hover:text-[#1E3A8A] transition py-1 px-2 rounded-lg hover:bg-slate-100 inline-flex items-center gap-2 text-xs font-semibold min-h-[44px]"
                        >
                            <span aria-hidden="true">&larr;</span> Kembali ke Beranda
                        </Link>
                    </div>

                    {/* Brand mark */}
                    <div className="mb-8 flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E3A8A] shadow-md">
                            <svg className="h-6 w-6 text-[#FACC15]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">Rekap Uang Kas</h1>
                            <p className="text-sm text-[#4B729F]">XI PPLG 2</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
                        <h2 className="mb-1 text-xl font-bold text-slate-900">Selamat datang kembali</h2>
                        <p className="mb-6 text-sm text-slate-500">Masuk ke akun kamu untuk memantau kas kelas.</p>

                        {/* Status (e.g., password reset success) */}
                        {status && (
                            <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} noValidate>
                            <div className="space-y-4">
                                <Field
                                    id="email"
                                    label="Alamat Email"
                                    type="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />

                                <Field
                                    id="password"
                                    label="Password"
                                    type="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                />
                            </div>

                            {/* Remember + forgot */}
                            <div className="mt-4 flex items-center justify-between">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#4B729F]/40"
                                    />
                                    <span className="text-sm text-slate-600">Ingat saya</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-medium text-[#4B729F] hover:text-[#1E3A8A] transition-colors"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#1e3a8a]/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Register link */}
                    <p className="mt-5 text-center text-sm text-slate-500">
                        Belum punya akun?{' '}
                        <Link href={route('register')} className="font-semibold text-[#4B729F] hover:text-[#1E3A8A] transition-colors">
                            Daftar sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
