<?php

namespace App\Http\Controllers;

use App\Models\MembershipPlan;
use App\Models\Partner;
use App\Models\Program;
use App\Models\Stat;
use App\Models\Testimonial;
use App\Models\Trainer;

class HomeController extends Controller
{
    public function index()
    {
        return inertia('Home', [
            'heroStats' => Stat::where('page', 'home')->where('section', 'hero')->orderBy('sort_order')->get(['label', 'value', 'suffix']),
            'partners' => Partner::orderBy('sort_order')->get(['name', 'logo_path']),
            'programs' => Program::where('featured', true)->orderBy('sort_order')->get(['title', 'tag', 'duration', 'level', 'home_description', 'image_path']),
            'trainers' => Trainer::orderBy('sort_order')->get(['name', 'specialty', 'years_experience', 'image_path']),
            'impactStats' => Stat::where('page', 'home')->where('section', 'impact')->orderBy('sort_order')->get(['label', 'value', 'suffix']),
            'membershipPlans' => MembershipPlan::orderBy('sort_order')->get(['name', 'monthly_price', 'annual_price', 'popular', 'home_features']),
            'testimonials' => Testimonial::where('page', 'home')->orderBy('sort_order')->get(['quote', 'name', 'role']),
        ]);
    }
}
