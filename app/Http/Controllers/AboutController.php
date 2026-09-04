<?php

namespace App\Http\Controllers;

use App\Models\Stat;
use App\Models\Testimonial;
use App\Models\Trainer;

class AboutController extends Controller
{
    public function index()
    {
        return inertia('About', [
            'trainers' => Trainer::orderBy('sort_order')->get(['name', 'specialty', 'years_experience', 'bio', 'certifications', 'image_path']),
            'stats' => Stat::where('page', 'about')->where('section', 'impact')->orderBy('sort_order')->get(['label', 'value']),
            'testimonials' => Testimonial::where('show_on_about', true)->orderBy('sort_order')->get(['quote', 'name', 'role']),
        ]);
    }
}
