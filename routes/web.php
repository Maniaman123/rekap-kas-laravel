<?php

use App\Http\Controllers\KasController;
use App\Http\Controllers\ProfileController;
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
| Student view — authenticated, pelajar role
|--------------------------------------------------------------------------
| Named `kas.index` so the role-redirect helpers in both auth controllers
| can reference a single canonical name.
*/
Route::get('/kas', [KasController::class, 'index'])
    ->middleware(['auth'])
    ->name('kas.index');

/*
|--------------------------------------------------------------------------
| Treasurer-only mutation routes — require bendahara role
|--------------------------------------------------------------------------
*/
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
