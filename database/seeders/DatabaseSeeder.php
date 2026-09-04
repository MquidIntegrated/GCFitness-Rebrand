<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

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
            StatSeeder::class,
            SiteSettingSeeder::class,
            AdminUserSeeder::class,
            SocialLinkSeeder::class,
        ]);

        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}
