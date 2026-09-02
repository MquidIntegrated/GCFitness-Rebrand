<?php

namespace Database\Seeders;

use App\Models\Stat;
use Illuminate\Database\Seeder;

class StatSeeder extends Seeder
{
    public function run(): void
    {
        $homeHero = [
            ['label' => 'Years', 'value' => '12', 'suffix' => '+'],
            ['label' => 'Members', 'value' => '12', 'suffix' => 'k'],
            ['label' => 'Coaches', 'value' => '24', 'suffix' => ''],
            ['label' => 'Programs', 'value' => '8', 'suffix' => ''],
        ];

        $homeImpact = [
            ['label' => 'Happy Members', 'value' => '12000', 'suffix' => '+'],
            ['label' => 'Elite Coaches', 'value' => '50', 'suffix' => '+'],
            ['label' => 'Classes Monthly', 'value' => '200', 'suffix' => ''],
            ['label' => 'Satisfaction', 'value' => '98', 'suffix' => '%'],
        ];

        $aboutImpact = [
            ['label' => 'Members', 'value' => '12,000+', 'suffix' => null],
            ['label' => 'Elite coaches', 'value' => '50+', 'suffix' => null],
            ['label' => 'Flagship clubs', 'value' => '3', 'suffix' => null],
            ['label' => 'Retention', 'value' => '98%', 'suffix' => null],
        ];

        foreach ($homeHero as $i => $s) {
            Stat::create($s + ['page' => 'home', 'section' => 'hero', 'sort_order' => $i + 1]);
        }
        foreach ($homeImpact as $i => $s) {
            Stat::create($s + ['page' => 'home', 'section' => 'impact', 'sort_order' => $i + 1]);
        }
        foreach ($aboutImpact as $i => $s) {
            Stat::create($s + ['page' => 'about', 'section' => 'impact', 'sort_order' => $i + 1]);
        }
    }
}
