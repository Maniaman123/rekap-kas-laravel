<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KasController extends Controller
{
    /**
     * Display the kas index page with summary data.
     */
    public function index()
    {
        $transactions = Transaction::latest()->get();

        $totalMasuk  = $transactions->where('type', 'masuk')->sum('amount');
        $totalKeluar = $transactions->where('type', 'keluar')->sum('amount');
        $saldo       = $totalMasuk - $totalKeluar;

        return Inertia::render('Kas/Index', [
            'transactions' => $transactions,
            'totalMasuk'   => $totalMasuk,
            'totalKeluar'  => $totalKeluar,
            'saldo'        => $saldo,
        ]);
    }

    /**
     * Store a newly created transaction.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'  => 'required|string|max:255',
            'amount' => 'required|integer|min:1',
            'type'   => 'required|in:masuk,keluar',
        ]);

        Transaction::create($validated);

        return redirect()->route('kas.index')->with('success', 'Transaksi berhasil ditambahkan.');
    }

    /**
     * Delete a transaction by ID.
     */
    public function destroy($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();

        return redirect()->route('kas.index')->with('success', 'Transaksi berhasil dihapus.');
    }
}
