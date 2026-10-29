<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'user_id'          => User::factory(),
            'type'             => fake()->randomElement(['masuk', 'keluar']),
            'category'         => fake()->randomElement(Transaction::CATEGORIES),
            'amount'           => fake()->numberBetween(5000, 500000),
            'description'      => fake()->optional()->sentence(),
            'transaction_date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
        ];
    }
}

