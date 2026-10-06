<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * Validation rules:
     *  - `role` must be one of the two valid enum values.
     *  - `secret_key` is required only when `role` is 'bendahara'; it is
     *    validated server-side against the BENDAHARA_SECRET_KEY env variable.
     *    A client-side-only check is never sufficient — the key is never
     *    exposed to the browser.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password'              => ['required', 'confirmed', Rules\Password::defaults()],
            'role'                  => ['required', 'in:bendahara,pelajar'],
            'secret_key'            => [
                'nullable',
                'string',
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    if ($request->input('role') !== 'bendahara') {
                        return; // secret_key is irrelevant for pelajar
                    }

                    // Use config() — env() returns null when config is cached in production.
                    $expected = config('app.bendahara_secret_key', env('BENDAHARA_SECRET_KEY'));

                    if (empty($expected)) {
                        $fail('Kunci bendahara belum dikonfigurasi di server. Hubungi administrator.');
                        return;
                    }

                    if ($value !== $expected) {
                        $fail('Kunci bendahara tidak valid. Periksa kembali kunci yang diberikan oleh ketua kelas.');
                    }
                },
            ],
        ]);

        // Enforce that bendahara registrations always have a non-empty secret_key field.
        if ($request->input('role') === 'bendahara' && empty($request->input('secret_key'))) {
            throw ValidationException::withMessages([
                'secret_key' => 'Kunci bendahara wajib diisi untuk mendaftar sebagai bendahara.',
            ]);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return $this->redirectBasedOnRole($user);
    }

    /**
     * Centralised role-based redirect helper.
     *
     * Mirrors the implementation in AuthenticatedSessionController so the
     * redirect target is consistent across both auth flows.
     *
     * @param  User  $user
     * @return RedirectResponse
     */
    private function redirectBasedOnRole(User $user): RedirectResponse
    {
        return $user->isBendahara()
            ? redirect()->route('dashboard')
            : redirect()->route('transactions.index');
    }
}
