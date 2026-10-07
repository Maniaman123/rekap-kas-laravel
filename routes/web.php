<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root redirect
|--------------------------------------------------------------------------
| Authenticated users are routed to their role-specific landing page by
| the post-login redirect in the auth controllers. Unauthenticated visitors
| see the Welcome landing page.
*/
Route::get('/', function () {
    $metrics = \App\Models\Transaction::query()
        ->selectRaw("
            COALESCE(SUM(CASE WHEN type = 'masuk'  THEN amount ELSE 0 END), 0) AS total_masuk,
            COALESCE(SUM(CASE WHEN type = 'keluar' THEN amount ELSE 0 END), 0) AS total_keluar,
            COUNT(*) AS total_transaksi
        ")
        ->first();

    $totalMasuk  = (int) ($metrics->total_masuk  ?? 0);
    $totalKeluar = (int) ($metrics->total_keluar  ?? 0);

    return Inertia::render('Welcome', [
        'auth'       => ['user' => auth()->user()],
        'kasSummary' => [
            'totalSaldo'       => $totalMasuk - $totalKeluar,
            'totalMasuk'       => $totalMasuk,
            'totalKeluar'      => $totalKeluar,
            'totalTransaksi'   => (int) ($metrics->total_transaksi ?? 0),
        ],
    ]);
})->name('home');

Route::get('/welcome', function () {
    return redirect()->route('home');
})->name('welcome');

/*
|--------------------------------------------------------------------------
| Transaction module — shared read, role-gated mutations
|--------------------------------------------------------------------------
|
| GET  /transactions          → TransactionController@index
|                               Renders 'Dashboard' for bendahara,
|                               'KasSiswa' for pelajar (role branching in controller).
|
| POST /transactions          → TransactionController@store     (bendahara only)
| DELETE /transactions/{id}   → TransactionController@destroy   (bendahara only)
*/
Route::middleware('auth')->group(function () {
    // Read — all authenticated users
    Route::get('/transactions', [TransactionController::class, 'index'])
        ->name('transactions.index');

    // Mutations + export — bendahara only (middleware + controller double-gate)
    Route::middleware('role:bendahara')->group(function () {
        // Export MUST be registered before the /{transaction} wildcard
        Route::get('/transactions/export', [TransactionController::class, 'export'])
            ->name('transactions.export');

        Route::post('/transactions', [TransactionController::class, 'store'])
            ->name('transactions.store');

        Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])
            ->name('transactions.destroy');
    });
});


/*
|--------------------------------------------------------------------------
| Treasurer dashboard
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', [TransactionController::class, 'index'])
    ->middleware(['auth', 'role:bendahara'])
    ->name('dashboard');

/*
|--------------------------------------------------------------------------
| Profile (shared across roles)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
