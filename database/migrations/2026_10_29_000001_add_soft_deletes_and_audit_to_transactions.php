<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add soft-delete column to transactions ─────────────────────────
        Schema::table('transactions', function (Blueprint $table): void {
            $table->softDeletes()->after('transaction_date');
        });

        // ── 2. Create transaction_edits audit table ───────────────────────────
        Schema::create('transaction_edits', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('transaction_id')
                  ->constrained('transactions')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users');

            // Financial amounts — unsigned integers, whole Rupiah
            $table->unsignedBigInteger('old_amount');
            $table->unsignedBigInteger('new_amount');

            // Type snapshot
            $table->string('old_type');
            $table->string('new_type');

            // Category snapshot
            $table->string('old_category');
            $table->string('new_category');

            // Description snapshot (nullable)
            $table->text('old_description')->nullable();
            $table->text('new_description')->nullable();

            // Auditor note
            $table->string('edit_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_edits');

        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });
    }
};

