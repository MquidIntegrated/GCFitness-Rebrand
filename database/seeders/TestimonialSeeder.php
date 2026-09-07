<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $home = [
            ['name' => 'Daniel R.', 'role' => 'Member since 2023', 'quote' => "GCFitness isn't a gym. It's a discipline. Six months in and I've never felt sharper — physically or mentally."],
            ['name' => 'Priya S.', 'role' => 'Powerlifter', 'quote' => 'The coaches treat programming like science. Every block builds on the last. My strength numbers speak for themselves.'],
            ['name' => 'Marco B.', 'role' => 'Member since 2022', 'quote' => 'The recovery zone alone is worth it. Cryo, sauna, mobility — nothing left to chance.'],
        ];

        $about = [
            ['name' => 'Elena K.', 'role' => 'Member since 2019', 'quote' => "The programming turned me from a hobbyist into someone who competes. I've never trained with a smarter team."],
            ['name' => 'James O.', 'role' => 'Member since 2021', 'quote' => 'The recovery zone alone is worth the membership. But the coaches — the coaches are the reason I stay.'],
            ['name' => 'Priya S.', 'role' => 'Member since 2018', 'quote' => "GCFitness built a room that treats you like a professional athlete, whether or not you are one. It's rare."],
        ];

        foreach ($home as $i => $t) {
            Testimonial::create($t + ['show_on_home' => true, 'show_on_about' => false, 'sort_order' => $i + 1]);
        }
        foreach ($about as $i => $t) {
            Testimonial::create($t + ['show_on_home' => false, 'show_on_about' => true, 'sort_order' => $i + 1]);
        }
    }
}
