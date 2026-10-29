<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TreasurerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root — Welcome landing page with live SQL-aggregated kasSummary
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    $metrics = \App\Models\Transaction::query()
        ->whereNull('deleted_at')
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
            'totalSaldo'     => $totalMasuk - $totalKeluar,
            'totalMasuk'     => $totalMasuk,
            'totalKeluar'    => $totalKeluar,
            'totalTransaksi' => (int) ($metrics->total_transaksi ?? 0),
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
*/
Route::middleware('auth')->group(function () {

    // Read — all authenticated users
    Route::get('/transactions', [TransactionController::class, 'index'])
        ->name('transactions.index');

    // Mutations — bendahara only
    Route::middleware('role:bendahara')->group(function () {
        // Export MUST be before /{transaction} wildcard
        Route::get('/transactions/export', [TransactionController::class, 'export'])
            ->name('transactions.export');

        Route::post('/transactions', [TransactionController::class, 'store'])
            ->name('transactions.store');

        Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])
            ->name('transactions.update');

        Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])
            ->name('transactions.destroy');

        // Soft-delete restore
        Route::post('/transactions/{id}/restore', [TransactionController::class, 'restore'])
            ->name('transactions.restore');

        // Hard delete (force delete) a single trashed transaction
        Route::delete('/transactions/{id}/force', [TransactionController::class, 'forceDelete'])
            ->name('transactions.forceDelete');

        // Empty entire trash (force delete all soft-deleted)
        Route::delete('/transactions/trash/empty', [TransactionController::class, 'emptyTrash'])
            ->name('transactions.emptyTrash');
    });
});

/*
|--------------------------------------------------------------------------
| Treasurer role handover
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:bendahara'])->group(function () {
    Route::post('/treasurer/handover', [TreasurerController::class, 'handover'])
        ->name('treasurer.handover');
});

/*
|--------------------------------------------------------------------------
| Treasurer dashboard alias
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
