<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionEdit extends Model
{
    protected $fillable = [
        'transaction_id',
        'user_id',
        'old_amount',
        'new_amount',
        'old_type',
        'new_type',
        'old_category',
        'new_category',
        'old_description',
        'new_description',
        'edit_reason',
    ];

    protected function casts(): array
    {
        return [
            'old_amount' => 'integer',
            'new_amount' => 'integer',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

