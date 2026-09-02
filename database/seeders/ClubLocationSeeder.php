<?php

namespace Database\Seeders;

use App\Models\ClubLocation;
use Illuminate\Database\Seeder;

class ClubLocationSeeder extends Seeder
{
    public function run(): void
    {
        $clubs = [
            ['name' => 'Mercer', 'address' => '128 Mercer Street, New York, NY 10012', 'hours' => 'Members: 24/7 · Reception 6a–10p'],
            ['name' => 'Brooklyn', 'address' => '402 Kent Avenue, Brooklyn, NY 11249', 'hours' => 'Members: 24/7 · Reception 6a–9p'],
            ['name' => 'Miami', 'address' => '1450 Collins Avenue, Miami Beach, FL', 'hours' => 'Members: 24/7 · Reception 6a–10p'],
        ];

        foreach ($clubs as $i => $c) {
            ClubLocation::create($c + ['sort_order' => $i + 1]);
        }
    }
}
