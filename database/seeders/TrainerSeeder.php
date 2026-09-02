<?php

namespace Database\Seeders;

use App\Models\Trainer;
use Illuminate\Database\Seeder;

class TrainerSeeder extends Seeder
{
    public function run(): void
    {
        $trainers = [
            ['name' => 'Marcus Vale', 'specialty' => 'Head of Performance', 'years_experience' => '12', 'image_path' => '/images/trainers/trainer-1.jpg', 'bio' => 'Former Olympic S&C coach. Specializes in athletic performance and hypertrophy programming.', 'certifications' => ['NSCA-CSCS', 'USAW L2', 'FMS']],
            ['name' => 'Ana Ribeiro', 'specialty' => 'Strength & Conditioning', 'years_experience' => '9', 'image_path' => '/images/trainers/trainer-2.jpg', 'bio' => 'Ex-national judo athlete turned coach. Builds functional strength for real-world capacity.', 'certifications' => ['NASM-CPT', 'PN L1', 'USAW L1']],
            ['name' => 'Jonah Reed', 'specialty' => 'Bodybuilding Coach', 'years_experience' => '14', 'image_path' => '/images/trainers/trainer-3.jpg', 'bio' => 'IFBB-qualified competitor. Twenty years of tuning physiques for stage and life.', 'certifications' => ['ISSA', 'PN L2', 'IFBB']],
            ['name' => 'Lena Osei', 'specialty' => 'Mobility & Recovery', 'years_experience' => '8', 'image_path' => '/images/trainers/trainer-4.jpg', 'bio' => "Movement therapist and yoga instructor. The reason members stay injury-free.", 'certifications' => ['FRC', 'RYT-500', 'NKT L2']],
        ];

        foreach ($trainers as $i => $trainer) {
            Trainer::create($trainer + ['sort_order' => $i + 1]);
        }
    }
}
