<?php

use App\Http\Controllers\KasController;
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
    return Inertia::render('Welcome', [
        'auth' => ['user' => auth()->user()],
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

    // Mutations — bendahara only (middleware + controller double-gate)
    Route::middleware('role:bendahara')->group(function () {
        Route::post('/transactions', [TransactionController::class, 'store'])
            ->name('transactions.store');

        Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])
            ->name('transactions.destroy');
    });
});

/*
|--------------------------------------------------------------------------
| Legacy KasController routes (kept for backward-compatibility)
|--------------------------------------------------------------------------
*/
Route::get('/kas', [KasController::class, 'index'])
    ->middleware(['auth'])
    ->name('kas.index');

Route::middleware(['auth', 'role:bendahara'])->group(function () {
    Route::post('/kas', [KasController::class, 'store'])->name('kas.store');
    Route::delete('/kas/{id}', [KasController::class, 'destroy'])->name('kas.destroy');
});

/*
|--------------------------------------------------------------------------
| Treasurer dashboard
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'role:bendahara'])->name('dashboard');

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
