<?php

namespace Database\Seeders;

use App\Models\Partner;
use Illuminate\Database\Seeder;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $numbers = [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 14, 15, 16];

        foreach ($numbers as $i => $n) {
            Partner::create([
                'name' => "Partner {$n}",
                'logo_path' => "/images/partners/partner{$n}.png",
                'sort_order' => $i + 1,
            ]);
        }
    }
}
