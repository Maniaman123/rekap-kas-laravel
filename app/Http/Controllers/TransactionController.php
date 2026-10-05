<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'category'         => ['required', 'string', 'max:50'],
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
