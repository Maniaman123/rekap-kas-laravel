<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionEdit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TransactionController extends Controller
{
    // -------------------------------------------------------------------------
    // index
    // -------------------------------------------------------------------------

    /**
     * Display the cash-ledger page with filters, aggregations, and pagination.
     *
     * Supports ?tab=active (default) and ?tab=trash (bendahara only).
     * Summary cards ALWAYS reflect active (non-deleted) transactions only.
     */
    public function index(Request $request): InertiaResponse
    {
        $tab = $request->query('tab', 'active');

        // ------------------------------------------------------------------
        // ALWAYS-ACTIVE aggregations for summary cards (excludes soft-deleted)
        // ------------------------------------------------------------------
        $summaryAgg = Transaction::query()
            ->whereNull('deleted_at')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'masuk'  THEN amount ELSE 0 END), 0) AS total_masuk,
                COALESCE(SUM(CASE WHEN type = 'keluar' THEN amount ELSE 0 END), 0) AS total_keluar
            ")
            ->first();

        $totalMasuk  = (int) $summaryAgg->total_masuk;
        $totalKeluar = (int) $summaryAgg->total_keluar;
        $sisaSaldo   = $totalMasuk - $totalKeluar;

        // ------------------------------------------------------------------
        // Build filterable base query (tab-aware)
        // ------------------------------------------------------------------
        $isBendahara = auth()->user()->isBendahara();

        if ($tab === 'trash' && $isBendahara) {
            $baseQuery = Transaction::onlyTrashed()
                ->with(['user:id,name', 'edits.user:id,name']);
        } else {
            $baseQuery = Transaction::query()
                ->with(['user:id,name', 'edits.user:id,name']);
        }

        $baseQuery
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->search . '%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('description', 'like', $term)
                          ->orWhere('category', 'like', $term);
                });
            })
            ->when($request->filled('category'), fn ($q) =>
                $q->where('category', $request->category)
            )
            ->when($request->filled('start_date'), fn ($q) =>
                $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when($request->filled('end_date'), fn ($q) =>
                $q->whereDate('transaction_date', '<=', $request->end_date)
            );

        // ------------------------------------------------------------------
        // Paginated transaction list
        // ------------------------------------------------------------------
        $transactions = $baseQuery
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        // ------------------------------------------------------------------
        // Role-based view routing
        // ------------------------------------------------------------------
        $component = $isBendahara ? 'Dashboard' : 'KasSiswa';

        $props = [
            'transactions' => $transactions,
            'totalMasuk'   => $totalMasuk,
            'totalKeluar'  => $totalKeluar,
            'sisaSaldo'    => $sisaSaldo,
            'categories'   => Transaction::CATEGORIES,
            'filters'      => $request->only(['search', 'category', 'start_date', 'end_date', 'tab']),
            'activeTab'    => $tab,
        ];

        // Pass student list for handover modal (bendahara only)
        if ($isBendahara) {
            $props['students'] = User::where('role', 'pelajar')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();
        }

        return Inertia::render($component, $props);
    }

    // -------------------------------------------------------------------------
    // export
    // -------------------------------------------------------------------------

    /**
     * Export filtered transactions as CSV or printable HTML.
     *
     * Route: GET /transactions/export  (role:bendahara middleware + controller gate)
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat mengekspor laporan.');
        }

        $request->validate([
            'format' => ['required', 'in:csv,print'],
        ]);

        $query = Transaction::with('user')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->search . '%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('description', 'like', $term)
                          ->orWhere('category', 'like', $term);
                });
            })
            ->when($request->filled('category'), fn ($q) =>
                $q->where('category', $request->category)
            )
            ->when($request->filled('start_date'), fn ($q) =>
                $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when($request->filled('end_date'), fn ($q) =>
                $q->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->orderBy('transaction_date', 'asc')
            ->orderBy('id', 'asc');

        $aggregates = (clone $query)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'masuk'  THEN amount ELSE 0 END), 0) AS total_masuk,
                COALESCE(SUM(CASE WHEN type = 'keluar' THEN amount ELSE 0 END), 0) AS total_keluar
            ")
            ->first();

        $totalMasuk  = (int) $aggregates->total_masuk;
        $totalKeluar = (int) $aggregates->total_keluar;
        $sisaSaldo   = $totalMasuk - $totalKeluar;

        if ($request->query('format') === 'csv') {
            $filename = 'rekap-kas-xi-pplg2-' . now()->format('Ymd-His') . '.csv';
            $rows     = $query->get();

            return response()->stream(function () use ($rows, $totalMasuk, $totalKeluar, $sisaSaldo): void {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, ['No', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Dicatat Oleh']);
                foreach ($rows as $i => $tx) {
                    fputcsv($handle, [
                        $i + 1,
                        $tx->transaction_date->format('d/m/Y'),
                        $tx->type === 'masuk' ? 'Masuk' : 'Keluar',
                        $tx->category,
                        $tx->amount,
                        $tx->description ?? '',
                        $tx->user?->name ?? '',
                    ]);
                }
                fputcsv($handle, []);
                fputcsv($handle, ['', '', '', '', 'Total Pemasukan', $totalMasuk, '']);
                fputcsv($handle, ['', '', '', '', 'Total Pengeluaran', $totalKeluar, '']);
                fputcsv($handle, ['', '', '', '', 'Saldo Kas', $sisaSaldo, '']);
                fclose($handle);
            }, 200, [
                'Content-Type'        => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                'Cache-Control'       => 'no-store, no-cache, must-revalidate',
                'Pragma'              => 'no-cache',
            ]);
        }

        $rows        = $query->get();
        $filterLabels = collect([
            $request->filled('search')     ? "Kata kunci: \"{$request->search}\""  : null,
            $request->filled('category')   ? "Kategori: {$request->category}"      : null,
            $request->filled('start_date') ? "Dari: {$request->start_date}"        : null,
            $request->filled('end_date')   ? "Sampai: {$request->end_date}"        : null,
        ])->filter()->values();

        return response()->make(
            view('reports.kas-print', [
                'rows'         => $rows,
                'totalMasuk'   => $totalMasuk,
                'totalKeluar'  => $totalKeluar,
                'sisaSaldo'    => $sisaSaldo,
                'filterLabels' => $filterLabels,
                'bendahara'    => auth()->user()->name,
                'printedAt'    => now()->locale('id')->isoFormat('dddd, D MMMM YYYY \p\u\k\u\l HH:mm'),
            ])->render(),
            200,
            ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'no-store']
        );
    }

    // -------------------------------------------------------------------------
    // store
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat menambah transaksi.');
        }

        $validated = $request->validate([
            'type'             => ['required', 'in:masuk,keluar'],
            'category'         => ['required', 'string', 'in:' . implode(',', Transaction::CATEGORIES)],
            'amount'           => ['required', 'integer', 'min:1'],
            'transaction_date' => ['required', 'date'],
            'description'      => ['nullable', 'string', 'max:255'],
        ]);

        Transaction::create([
            'user_id'          => auth()->id(),
            'type'             => $validated['type'],
            'category'         => $validated['category'],
            'amount'           => (int) $validated['amount'],
            'transaction_date' => $validated['transaction_date'],
            'description'      => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Transaksi berhasil ditambahkan.');
    }

    // -------------------------------------------------------------------------
    // update
    // -------------------------------------------------------------------------

    public function update(Request $request, Transaction $transaction): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat memperbarui transaksi.');
        }

        $validated = $request->validate([
            'type'             => ['required', 'in:masuk,keluar'],
            'category'         => ['required', 'string', 'in:' . implode(',', Transaction::CATEGORIES)],
            'amount'           => ['required', 'integer', 'min:1'],
            'transaction_date' => ['required', 'date'],
            'description'      => ['nullable', 'string', 'max:255'],
            'edit_reason'      => ['nullable', 'string', 'max:150'],
        ]);

        DB::transaction(function () use ($validated, $transaction): void {
            // Record audit BEFORE applying changes
            TransactionEdit::create([
                'transaction_id'  => $transaction->id,
                'user_id'         => auth()->id(),
                'old_amount'      => $transaction->amount,
                'new_amount'      => (int) $validated['amount'],
                'old_type'        => $transaction->type,
                'new_type'        => $validated['type'],
                'old_category'    => $transaction->category,
                'new_category'    => $validated['category'],
                'old_description' => $transaction->description,
                'new_description' => $validated['description'] ?? null,
                'edit_reason'     => $validated['edit_reason'] ?? null,
            ]);

            $transaction->update([
                'type'             => $validated['type'],
                'category'         => $validated['category'],
                'amount'           => (int) $validated['amount'],
                'transaction_date' => $validated['transaction_date'],
                'description'      => $validated['description'] ?? null,
            ]);
        });

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui.');
    }

    // -------------------------------------------------------------------------
    // destroy (soft delete)
    // -------------------------------------------------------------------------

    public function destroy(Transaction $transaction): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat menghapus transaksi.');
        }

        $transaction->delete(); // SoftDeletes trait — sets deleted_at

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }

    // -------------------------------------------------------------------------
    // restore
    // -------------------------------------------------------------------------

    public function restore(int $id): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat memulihkan transaksi.');
        }

        $transaction = Transaction::onlyTrashed()->findOrFail($id);
        $transaction->restore();

        return redirect()->back()->with('success', 'Transaksi berhasil dipulihkan.');
    }

    // -------------------------------------------------------------------------
    // forceDelete — permanently destroy a single soft-deleted transaction
    // -------------------------------------------------------------------------

    public function forceDelete(int $id): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat menghapus permanen transaksi.');
        }

        $transaction = Transaction::onlyTrashed()->findOrFail($id);
        $transaction->forceDelete();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus permanen.');
    }

    // -------------------------------------------------------------------------
    // emptyTrash — permanently destroy all soft-deleted transactions
    // -------------------------------------------------------------------------

    public function emptyTrash(): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat mengosongkan trash.');
        }

        Transaction::onlyTrashed()->forceDelete();

        return redirect()->back()->with('success', 'Keranjang sampah berhasil dikosongkan.');
    }
}
