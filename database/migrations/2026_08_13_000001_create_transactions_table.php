<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Monetary amounts are stored as unsignedBigInteger (whole Rupiah, no decimals)
     * to eliminate floating-point precision bugs in financial calculations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Treasurer who recorded the transaction
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Cash-in or cash-out
            $table->enum('type', ['masuk', 'keluar']);

            // Predefined budget categories
            $table->string('category', 50); // e.g. Kas Wajib, Konsumsi, ATK, Kegiatan, Lainnya

            // Whole Rupiah — strictly non-negative; application layer enforces min:1
            $table->unsignedBigInteger('amount');

            $table->text('description')->nullable();

            $table->date('transaction_date');

            $table->timestamps();

            // Composite index for fast aggregation queries (SUM by type within a date range)
            $table->index(['transaction_date', 'type'], 'idx_transactions_date_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
