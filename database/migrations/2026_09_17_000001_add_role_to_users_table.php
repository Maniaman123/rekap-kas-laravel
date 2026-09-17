<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a `role` enum column immediately after `email`.
     * Defaults to 'pelajar' so all existing users receive the least-privileged role.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['bendahara', 'pelajar'])
                  ->default('pelajar')
                  ->after('email');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the column safely; SQLite does not support DROP COLUMN via Blueprint
     * for all versions, but Laravel's schema grammar handles it on MySQL/PostgreSQL.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
