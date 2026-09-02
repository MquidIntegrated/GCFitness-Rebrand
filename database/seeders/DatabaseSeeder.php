<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\ProgramSeeder;
use Database\Seeders\TrainerSeeder;
use Database\Seeders\TestimonialSeeder;
use Database\Seeders\FaqSeeder;
use Database\Seeders\ClubLocationSeeder;
use Database\Seeders\PartnerSeeder;
use Database\Seeders\MembershipPlanSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ProgramSeeder::class,
            TrainerSeeder::class,
            TestimonialSeeder::class,
            FaqSeeder::class,
            ClubLocationSeeder::class,
            PartnerSeeder::class,
            MembershipPlanSeeder::class,
        ]);

        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
        // Post::factory(2)->create();
    }
}
