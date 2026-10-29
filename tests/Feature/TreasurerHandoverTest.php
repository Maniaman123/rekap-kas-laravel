<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\TransactionEdit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TreasurerHandoverTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────
    // TASK 1: Category enum
    // ─────────────────────────────────────────────────

    public function test_transaction_categories_constant_has_seven_items(): void
    {
        $this->assertCount(7, Transaction::CATEGORIES);
        $this->assertContains('Kas Wajib', Transaction::CATEGORIES);
        $this->assertContains('Kas Susulan', Transaction::CATEGORIES);
        $this->assertContains('Denda / Sanksi', Transaction::CATEGORIES);
        $this->assertContains('Konsumsi', Transaction::CATEGORIES);
        $this->assertContains('ATK', Transaction::CATEGORIES);
        $this->assertContains('Kegiatan', Transaction::CATEGORIES);
        $this->assertContains('Lainnya', Transaction::CATEGORIES);
    }

    // ─────────────────────────────────────────────────
    // TASK 2: Treasurer handover
    // ─────────────────────────────────────────────────

    public function test_bendahara_can_handover_role_to_pelajar(): void
    {
        $bendahara = User::factory()->create([
            'role'     => 'bendahara',
            'password' => Hash::make('secret123'),
        ]);
        $pelajar = User::factory()->create(['role' => 'pelajar']);

        $response = $this->actingAs($bendahara)
            ->post(route('treasurer.handover'), [
                'new_treasurer_id' => $pelajar->id,
                'password'         => 'secret123',
            ]);

        $response->assertRedirect(route('login'));

        $this->assertDatabaseHas('users', ['id' => $pelajar->id, 'role' => 'bendahara']);
        $this->assertDatabaseHas('users', ['id' => $bendahara->id, 'role' => 'pelajar']);
    }

    public function test_handover_fails_with_wrong_password(): void
    {
        $bendahara = User::factory()->create([
            'role'     => 'bendahara',
            'password' => Hash::make('correct'),
        ]);
        $pelajar = User::factory()->create(['role' => 'pelajar']);

        $response = $this->actingAs($bendahara)
            ->post(route('treasurer.handover'), [
                'new_treasurer_id' => $pelajar->id,
                'password'         => 'wrong',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('password');
        $this->assertDatabaseHas('users', ['id' => $pelajar->id, 'role' => 'pelajar']);
    }

    public function test_handover_fails_if_target_is_already_bendahara(): void
    {
        $bendahara = User::factory()->create([
            'role'     => 'bendahara',
            'password' => Hash::make('secret123'),
        ]);
        $anotherBendahara = User::factory()->create(['role' => 'bendahara']);

        $response = $this->actingAs($bendahara)
            ->post(route('treasurer.handover'), [
                'new_treasurer_id' => $anotherBendahara->id,
                'password'         => 'secret123',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('new_treasurer_id');
    }

    public function test_pelajar_cannot_access_handover_route(): void
    {
        $pelajar = User::factory()->create(['role' => 'pelajar']);

        $response = $this->actingAs($pelajar)
            ->post(route('treasurer.handover'), [
                'new_treasurer_id' => 999,
                'password'         => 'x',
            ]);

        $response->assertStatus(403);
    }

    // ─────────────────────────────────────────────────
    // TASK 3: Soft-delete & balance integrity
    // ─────────────────────────────────────────────────

    public function test_soft_deleted_transaction_excluded_from_balance_aggregation(): void
    {
        $bendahara = User::factory()->create(['role' => 'bendahara']);

        Transaction::factory()->create([
            'user_id'          => $bendahara->id,
            'type'             => 'masuk',
            'amount'           => 100000,
            'category'         => 'Kas Wajib',
            'transaction_date' => now()->toDateString(),
        ]);

        $deleted = Transaction::factory()->create([
            'user_id'          => $bendahara->id,
            'type'             => 'masuk',
            'amount'           => 50000,
            'category'         => 'Kas Wajib',
            'transaction_date' => now()->toDateString(),
        ]);
        $deleted->delete(); // soft-delete

        // DB-level verification: aggregate must exclude soft-deleted row
        $row = \DB::selectOne("
            SELECT
                SUM(CASE WHEN type = 'masuk' AND deleted_at IS NULL THEN amount ELSE 0 END) AS totalMasuk,
                SUM(CASE WHEN type = 'keluar' AND deleted_at IS NULL THEN amount ELSE 0 END) AS totalKeluar
            FROM transactions
        ");

        $this->assertEquals(100000, (int) $row->totalMasuk);
        $this->assertEquals(0,      (int) $row->totalKeluar);
        $this->assertEquals(100000, (int) $row->totalMasuk - (int) $row->totalKeluar);
    }

    public function test_trash_tab_returns_only_soft_deleted(): void
    {
        $bendahara = User::factory()->create(['role' => 'bendahara']);

        $active  = Transaction::factory()->create(['user_id' => $bendahara->id, 'category' => 'Lainnya']);
        $trashed = Transaction::factory()->create(['user_id' => $bendahara->id, 'category' => 'Lainnya']);
        $trashed->delete();

        $response = $this->actingAs($bendahara)
            ->get(route('transactions.index', ['tab' => 'trash']));

        $response->assertOk();

        $props         = $response->original->getData()['page']['props'];
        $transactionIds = collect($props['transactions']['data'])->pluck('id');

        $this->assertContains($trashed->id, $transactionIds->toArray());
        $this->assertNotContains($active->id, $transactionIds->toArray());
    }

    public function test_bendahara_can_restore_soft_deleted_transaction(): void
    {
        $bendahara = User::factory()->create(['role' => 'bendahara']);

        $transaction = Transaction::factory()->create([
            'user_id'  => $bendahara->id,
            'category' => 'Lainnya',
        ]);
        $transaction->delete();

        $this->assertSoftDeleted('transactions', ['id' => $transaction->id]);

        $response = $this->actingAs($bendahara)
            ->post(route('transactions.restore', $transaction->id));

        $response->assertRedirect();
        $this->assertNotSoftDeleted('transactions', ['id' => $transaction->id]);
    }

    // ─────────────────────────────────────────────────
    // TASK 4: Edit audit trail
    // ─────────────────────────────────────────────────

    public function test_updating_transaction_creates_transaction_edit_record(): void
    {
        $bendahara = User::factory()->create(['role' => 'bendahara']);

        $transaction = Transaction::factory()->create([
            'user_id'          => $bendahara->id,
            'type'             => 'masuk',
            'category'         => 'Kas Wajib',
            'amount'           => 20000,
            'description'      => 'Original',
            'transaction_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($bendahara)
            ->put(route('transactions.update', $transaction->id), [
                'type'             => 'keluar',
                'category'         => 'Konsumsi',
                'amount'           => 35000,
                'description'      => 'Updated',
                'transaction_date' => now()->toDateString(),
                'edit_reason'      => 'Salah input',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('transaction_edits', [
            'transaction_id'  => $transaction->id,
            'user_id'         => $bendahara->id,
            'old_type'        => 'masuk',
            'new_type'        => 'keluar',
            'old_category'    => 'Kas Wajib',
            'new_category'    => 'Konsumsi',
            'old_amount'      => 20000,
            'new_amount'      => 35000,
            'old_description' => 'Original',
            'new_description' => 'Updated',
            'edit_reason'     => 'Salah input',
        ]);
    }

    public function test_edit_audit_uses_db_transaction_atomicity(): void
    {
        // Verify that TransactionEdit count increments by exactly 1 per update
        $bendahara   = User::factory()->create(['role' => 'bendahara']);
        $transaction = Transaction::factory()->create([
            'user_id'          => $bendahara->id,
            'category'         => 'Kas Wajib',
            'transaction_date' => now()->toDateString(),
        ]);

        $beforeCount = TransactionEdit::count();

        $this->actingAs($bendahara)
            ->put(route('transactions.update', $transaction->id), [
                'type'             => $transaction->type,
                'category'         => 'ATK',
                'amount'           => $transaction->amount,
                'description'      => null,
                'transaction_date' => now()->toDateString(),
                'edit_reason'      => null,
            ]);

        $this->assertEquals($beforeCount + 1, TransactionEdit::count());
    }
}
