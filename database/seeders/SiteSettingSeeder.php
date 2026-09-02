<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        SiteSetting::create([
            'address_line1' => '128 Mercer Street',
            'address_line2' => 'New York, NY 10012',
            'phone' => '+1 (212) 555-0142',
            'email' => 'hello@gcfitness.club',
            'hours' => 'Members: 24/7 · Reception: 6am — 10pm',
        ]);
    }
}
