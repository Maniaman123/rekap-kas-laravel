<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Allowed category values — single source of truth shared with controllers.
     */
    public const CATEGORIES = [
        'Kas Wajib',
        'Kas Susulan',
        'Denda / Sanksi',
        'Konsumsi',
        'ATK',
        'Kegiatan',
        'Lainnya',
    ];

    /**
     * Mass-assignable attributes.
     *
     * 'amount' is stored as a whole-Rupiah integer; no decimal columns exist.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'category',
        'amount',
        'description',
        'transaction_date',
    ];

    /**
     * Attribute casts.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'amount'           => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The treasurer who recorded this transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * All edit audit entries for this transaction, newest first.
     */
    public function edits(): HasMany
    {
        return $this->hasMany(TransactionEdit::class)->orderByDesc('created_at');
    }
}
