<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TreasurerController extends Controller
{
    /**
     * POST /treasurer/handover
     *
     * Validates the current bendahara's password + the recipient's id,
     * then atomically swaps roles inside a transaction.
     */
    public function handover(Request $request): RedirectResponse
    {
        // Defence-in-depth gate (middleware already guards the route)
        if (Auth::user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat melakukan serah terima jabatan.');
        }

        $validated = $request->validate([
            'new_treasurer_id' => [
                'required',
                'integer',
                'exists:users,id',
                // Must currently be a student — cannot hand over to another bendahara
                function (string $attribute, mixed $value, \Closure $fail) {
                    $target = User::find($value);
                    if (! $target || $target->role !== 'pelajar') {
                        $fail('Penerima jabatan harus seorang pelajar aktif.');
                    }
                    if ((int) $value === Auth::id()) {
                        $fail('Tidak dapat menyerahkan jabatan kepada diri sendiri.');
                    }
                },
            ],
            'password' => ['required', 'string'],
        ]);

        // Verify current user's password before allowing role mutation
        if (! Hash::check($validated['password'], Auth::user()->password)) {
            throw ValidationException::withMessages([
                'password' => ['Kata sandi tidak sesuai.'],
            ]);
        }

        DB::transaction(function () use ($validated): void {
            $newTreasurer = User::lockForUpdate()->findOrFail($validated['new_treasurer_id']);
            $currentUser  = User::lockForUpdate()->findOrFail(Auth::id());

            // Promote recipient
            $newTreasurer->update(['role' => 'bendahara']);

            // Demote current treasurer
            $currentUser->update(['role' => 'pelajar']);
        });

        // Log out and redirect — current session is now invalid for treasurer routes
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')
            ->with('success', 'Jabatan Bendahara berhasil diserahkan. Silakan masuk kembali.');
    }
}

