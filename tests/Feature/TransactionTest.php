<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $bendahara;
    private User $pelajar;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bendahara = User::factory()->create([
            'role' => 'bendahara',
        ]);

        $this->pelajar = User::factory()->create([
            'role' => 'pelajar',
        ]);
    }

    public function test_bendahara_can_update_transaction(): void
    {
        $transaction = Transaction::create([
            'user_id'          => $this->bendahara->id,
            'type'             => 'masuk',
            'category'         => 'Kas Wajib',
            'amount'           => 50000,
            'transaction_date' => '2026-10-01',
            'description'      => 'Kas awal',
        ]);

        $response = $this->actingAs($this->bendahara)
            ->put(route('transactions.update', $transaction), [
                'type'             => 'keluar',
                'category'         => 'ATK',
                'amount'           => 25000,
                'transaction_date' => '2026-10-02',
                'description'      => 'Beli spidol',
            ]);

        $response->assertSessionHas('success', 'Transaksi berhasil diperbarui.');

        $this->assertDatabaseHas('transactions', [
            'id'          => $transaction->id,
            'type'        => 'keluar',
            'category'    => 'ATK',
            'amount'      => 25000,
            'description' => 'Beli spidol',
        ]);
    }

    public function test_pelajar_cannot_update_transaction(): void
    {
        $transaction = Transaction::create([
            'user_id'          => $this->bendahara->id,
            'type'             => 'masuk',
            'category'         => 'Kas Wajib',
            'amount'           => 50000,
            'transaction_date' => '2026-10-01',
            'description'      => 'Kas awal',
        ]);

        $response = $this->actingAs($this->pelajar)
            ->put(route('transactions.update', $transaction), [
                'type'             => 'keluar',
                'category'         => 'ATK',
                'amount'           => 25000,
                'transaction_date' => '2026-10-02',
                'description'      => 'Beli spidol',
            ]);

        $response->assertForbidden();
    }

    public function test_update_validates_positive_amount(): void
    {
        $transaction = Transaction::create([
            'user_id'          => $this->bendahara->id,
            'type'             => 'masuk',
            'category'         => 'Kas Wajib',
            'amount'           => 50000,
            'transaction_date' => '2026-10-01',
            'description'      => 'Kas awal',
        ]);

        $response = $this->actingAs($this->bendahara)
            ->put(route('transactions.update', $transaction), [
                'type'             => 'masuk',
                'category'         => 'Kas Wajib',
                'amount'           => 0,
                'transaction_date' => '2026-10-01',
            ]);

        $response->assertSessionHasErrors('amount');
    }

    public function test_bendahara_can_delete_transaction(): void
    {
        $transaction = Transaction::create([
            'user_id'          => $this->bendahara->id,
            'type'             => 'masuk',
            'category'         => 'Kas Wajib',
            'amount'           => 50000,
            'transaction_date' => '2026-10-01',
            'description'      => 'Kas awal',
        ]);

        $response = $this->actingAs($this->bendahara)
            ->delete(route('transactions.destroy', $transaction));

        $response->assertSessionHas('success', 'Transaksi berhasil dihapus.');

        $this->assertSoftDeleted('transactions', [
            'id' => $transaction->id,
        ]);
    }

    public function test_pelajar_cannot_delete_transaction(): void
    {
        $transaction = Transaction::create([
            'user_id'          => $this->bendahara->id,
            'type'             => 'masuk',
            'category'         => 'Kas Wajib',
            'amount'           => 50000,
            'transaction_date' => '2026-10-01',
            'description'      => 'Kas awal',
        ]);

        $response = $this->actingAs($this->pelajar)
            ->delete(route('transactions.destroy', $transaction));

        $response->assertForbidden();

        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
        ]);
    }
}
