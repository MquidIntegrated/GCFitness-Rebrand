<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            ['title' => 'Bodybuilding', 'tag' => 'Hypertrophy', 'duration' => '60 min', 'level' => 'Intermediate', 'image_path' => '/images/programs/bodybuilding.jpg', 'featured' => true, 'home_description' => 'Structural hypertrophy for lean mass development.', 'description' => 'Structural hypertrophy for lean mass development. Split routines, progressive overload, and periodized blocks.'],
            ['title' => 'Powerlifting', 'tag' => 'Power', 'duration' => '75 min', 'level' => 'Advanced', 'image_path' => '/images/programs/strength.jpg', 'featured' => true, 'home_description' => 'Squat, bench, deadlift — engineered progression.', 'description' => 'Squat, bench, deadlift. Engineered progression toward your one-rep max under expert supervision.'],
            ['title' => 'HIIT Surge', 'tag' => 'Conditioning', 'duration' => '45 min', 'level' => 'All levels', 'image_path' => '/images/programs/hiit.jpg', 'featured' => true, 'home_description' => 'High-output intervals for metabolic peak.', 'description' => 'High-output intervals for metabolic peak. Heart rate targets, precise work-to-rest, real results.'],
            ['title' => 'Functional Flow', 'tag' => 'Mobility', 'duration' => '50 min', 'level' => 'All levels', 'image_path' => '/images/programs/functional.jpg', 'featured' => true, 'home_description' => 'Mobility and power integrated into movement.', 'description' => 'Kettlebells, medicine balls, sleds. Mobility and power integrated into daily movement patterns.'],
            ['title' => 'Boxing Studio', 'tag' => 'Cardio', 'duration' => '50 min', 'level' => 'Intermediate', 'image_path' => '/images/programs/boxing.jpg', 'featured' => true, 'home_description' => 'Rounds programmed by former pro fighters.', 'description' => 'Rounds programmed by former pro fighters. Bag work, mitts, and full sparring for members.'],
            ['title' => 'Vinyasa & Yin', 'tag' => 'Recovery', 'duration' => '60 min', 'level' => 'All levels', 'image_path' => '/images/programs/yoga.jpg', 'featured' => true, 'home_description' => 'Restorative flows to complement heavy training.', 'description' => 'Restorative flows and deep stretch to complement heavy training. Breath, mobility, calm.'],
            ['title' => 'Ignite', 'tag' => 'Weight Loss', 'duration' => '55 min', 'level' => 'Beginner', 'image_path' => '/images/programs/functional.jpg', 'featured' => false, 'home_description' => null, 'description' => 'A structured 12-week fat-loss protocol combining conditioning and nutrition coaching.'],
            ['title' => "Women's Strength", 'tag' => "Women's", 'duration' => '50 min', 'level' => 'All levels', 'image_path' => '/images/programs/hiit.jpg', 'featured' => false, 'home_description' => null, 'description' => 'Female-focused strength programming led by top coaches in a supportive environment.'],
        ];

        foreach ($programs as $i => $program) {
            Program::create($program + ['sort_order' => $i + 1]);
        }
    }
}
