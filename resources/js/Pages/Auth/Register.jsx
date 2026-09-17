import { Head, Link, useForm } from '@inertiajs/react';

// ─── Field ──────────────────────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {string}  props.id
 * @param {string}  props.label
 * @param {string}  [props.type]
 * @param {string}  props.value
 * @param {string}  [props.autoComplete]
 * @param {boolean} [props.autoFocus]
 * @param {string}  [props.placeholder]
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange
 * @param {string}  [props.error]
 * @param {React.ReactNode} [props.hint]
 */
function Field({ id, label, type = 'text', value, autoComplete, autoFocus, placeholder, onChange, error, hint }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
            <input
                id={id}
                type={type}
                name={id}
                value={value}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                placeholder={placeholder}
                onChange={onChange}
                className={[
                    'mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs',
                    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B729F]/40',
                    'transition-colors duration-150',
                    error
                        ? 'border-red-400 bg-red-50/40 focus:ring-red-400/30'
                        : 'border-slate-200/80 bg-white hover:border-slate-300',
                ].join(' ')}
            />
            {error && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
            )}
        </div>
    );
}

// ─── Role Segmented Control ──────────────────────────────────────────────────
/**
 * @param {{ value: 'pelajar'|'bendahara', onChange: (v: string) => void }} props
 */
function RoleSelector({ value, onChange }) {
    const roles = [
        { key: 'pelajar',   label: 'Siswa',     sub: 'Akses baca' },
        { key: 'bendahara', label: 'Bendahara',  sub: 'Akses penuh' },
    ];

    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Daftar sebagai</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pilih peran">
                {roles.map((r) => {
                    const active = value === r.key;
                    return (
                        <button
                            key={r.key}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onChange(r.key)}
                            className={[
                                'flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all duration-150',
                                'focus:outline-none focus:ring-2 focus:ring-[#4B729F]/40',
                                active
                                    ? 'border-[#4B729F] bg-[#E0F2FE] text-[#1E3A8A]'
                                    : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300',
                            ].join(' ')}
                        >
                            <span className="text-sm font-semibold">{r.label}</span>
                            <span className={['text-xs', active ? 'text-[#4B729F]' : 'text-slate-400'].join(' ')}>
                                {r.sub}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'pelajar',
        secret_key: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation', 'secret_key'),
        });
    };

    const isBendahara = data.role === 'bendahara';

    return (
        <>
            <Head title="Daftar — Rekap Kas XI PPLG 2" />

            <div className="flex min-h-screen items-start justify-center bg-[#F8FAFC] px-4 py-12 font-sans antialiased sm:items-center">
                <div className="w-full max-w-md">
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
                        <h2 className="mb-1 text-xl font-bold text-slate-900">Buat akun baru</h2>
                        <p className="mb-6 text-sm text-slate-500">Bergabung untuk memantau keuangan kelas secara transparan.</p>

                        <form onSubmit={submit} noValidate>
                            <div className="space-y-4">
                                {/* Role selector */}
                                <RoleSelector
                                    value={data.role}
                                    onChange={(v) => setData('role', v)}
                                />
                                {errors.role && (
                                    <p className="text-xs font-medium text-red-600">{errors.role}</p>
                                )}

                                <Field
                                    id="name"
                                    label="Nama Lengkap"
                                    value={data.name}
                                    autoComplete="name"
                                    autoFocus
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                />

                                <Field
                                    id="email"
                                    label="Alamat Email"
                                    type="email"
                                    value={data.email}
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />

                                <Field
                                    id="password"
                                    label="Password"
                                    type="password"
                                    value={data.password}
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                />

                                <Field
                                    id="password_confirmation"
                                    label="Konfirmasi Password"
                                    type="password"
                                    value={data.password_confirmation}
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                />

                                {/* Secret key — conditionally revealed for bendahara */}
                                <div
                                    style={{
                                        // Use max-height transition for smooth reveal without layout jump.
                                        maxHeight: isBendahara ? '120px' : '0px',
                                        overflow: 'hidden',
                                        transition: 'max-height 220ms cubic-bezier(0.23, 1, 0.32, 1)',
                                    }}
                                >
                                    <Field
                                        id="secret_key"
                                        label="Kunci Bendahara"
                                        type="password"
                                        value={data.secret_key}
                                        autoComplete="off"
                                        placeholder="Minta kunci dari ketua kelas"
                                        onChange={(e) => setData('secret_key', e.target.value)}
                                        error={errors.secret_key}
                                        hint="Hanya untuk calon bendahara. Kunci ini diverifikasi di server."
                                    />
                                </div>
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
                                        Mendaftar...
                                    </>
                                ) : (
                                    'Buat Akun'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Login link */}
                    <p className="mt-5 text-center text-sm text-slate-500">
                        Sudah punya akun?{' '}
                        <Link href={route('login')} className="font-semibold text-[#4B729F] hover:text-[#1E3A8A] transition-colors">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
