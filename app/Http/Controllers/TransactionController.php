<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TransactionController extends Controller
{
    // Allowed category values (single source of truth)
    private const CATEGORIES = ['Kas Wajib', 'Konsumsi', 'ATK', 'Kegiatan', 'Lainnya'];

    // -------------------------------------------------------------------------
    // index
    // -------------------------------------------------------------------------

    /**
     * Display the cash-ledger page with filters, aggregations, and pagination.
     *
     * Accessible to all authenticated users; the Inertia component differs
     * between 'bendahara' and 'pelajar' roles.
     */
    public function index(Request $request): InertiaResponse
    {
        // ------------------------------------------------------------------
        // Build the filterable base query
        // ------------------------------------------------------------------
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
            );

        // ------------------------------------------------------------------
        // Aggregations — run on the FILTERED dataset via SQL (not PHP)
        // Uses the composite index (transaction_date, type) for performance.
        // ------------------------------------------------------------------
        $aggregates = (clone $query)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'masuk'  THEN amount ELSE 0 END), 0) AS total_masuk,
                COALESCE(SUM(CASE WHEN type = 'keluar' THEN amount ELSE 0 END), 0) AS total_keluar
            ")
            ->first();

        $totalMasuk  = (int) $aggregates->total_masuk;
        $totalKeluar = (int) $aggregates->total_keluar;
        $sisaSaldo   = $totalMasuk - $totalKeluar;

        // ------------------------------------------------------------------
        // Paginated transaction list
        // ------------------------------------------------------------------
        $transactions = $query
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        // ------------------------------------------------------------------
        // Role-based view routing
        // ------------------------------------------------------------------
        $component = auth()->user()->isBendahara() ? 'Dashboard' : 'KasSiswa';

        return Inertia::render($component, [
            'transactions' => $transactions,
            'totalMasuk'   => $totalMasuk,
            'totalKeluar'  => $totalKeluar,
            'sisaSaldo'    => $sisaSaldo,
            'categories'   => self::CATEGORIES,
            'filters'      => $request->only(['search', 'category', 'start_date', 'end_date']),
        ]);
    }

    // -------------------------------------------------------------------------
    // export
    // -------------------------------------------------------------------------

    /**
     * Export filtered transactions as CSV or printable HTML.
     *
     * Same filter params as index(): search, category, start_date, end_date.
     * Add ?format=csv for a CSV download; default returns a printable HTML page.
     *
     * Route: GET /transactions/export  (role:bendahara middleware + controller gate)
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        // Triple gate: middleware, role check, explicit abort
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat mengekspor laporan.');
        }

        // Validate format param — only 'csv' or 'print' accepted
        $request->validate([
            'format' => ['required', 'in:csv,print'],
        ]);

        // ------------------------------------------------------------------
        // Build the same filterable query as index() — no pagination
        // ------------------------------------------------------------------
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

        // SQL aggregates — computed before ->get() to avoid loading all rows twice
        $aggregates = (clone $query)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'masuk'  THEN amount ELSE 0 END), 0) AS total_masuk,
                COALESCE(SUM(CASE WHEN type = 'keluar' THEN amount ELSE 0 END), 0) AS total_keluar
            ")
            ->first();

        $totalMasuk  = (int) $aggregates->total_masuk;
        $totalKeluar = (int) $aggregates->total_keluar;
        $sisaSaldo   = $totalMasuk - $totalKeluar;

        // ------------------------------------------------------------------
        // FORMAT: csv  —  StreamedResponse with UTF-8 BOM (Excel-compatible)
        // ------------------------------------------------------------------
        if ($request->query('format') === 'csv') {
            $filename = 'rekap-kas-xi-pplg2-' . now()->format('Ymd-His') . '.csv';

            $rows = $query->get(); // fetch once

            return response()->stream(function () use ($rows, $totalMasuk, $totalKeluar, $sisaSaldo): void {
                $handle = fopen('php://output', 'w');

                // UTF-8 BOM — ensures Excel opens without mojibake
                fwrite($handle, "\xEF\xBB\xBF");

                // Header row
                fputcsv($handle, [
                    'No', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Dicatat Oleh',
                ]);

                // Data rows
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

                // Summary footer
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

        // ------------------------------------------------------------------
        // FORMAT: print  —  Blade view, auto-triggers window.print()
        // ------------------------------------------------------------------
        $rows = $query->get();

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

    /**
     * Persist a new cash transaction.
     *
     * Only users with role 'bendahara' may reach this route (enforced at the
     * routing layer via the 'role:bendahara' middleware), but we perform a
     * second gate check here for defence-in-depth.
     */
    public function store(Request $request): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat menambah transaksi.');
        }

        $validated = $request->validate([
            'type'             => ['required', 'in:masuk,keluar'],
            'category'         => ['required', 'string', 'in:Kas Wajib,Konsumsi,ATK,Kegiatan,Lainnya'],
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
    // destroy
    // -------------------------------------------------------------------------

    /**
     * Delete a cash transaction.
     *
     * Route model binding resolves the Transaction; middleware guards the route,
     * and a hard gate below prevents any bypass.
     */
    public function destroy(Transaction $transaction): RedirectResponse
    {
        if (auth()->user()->role !== 'bendahara') {
            abort(403, 'Hanya bendahara yang dapat menghapus transaksi.');
        }

        $transaction->delete();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
