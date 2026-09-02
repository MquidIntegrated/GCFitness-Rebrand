<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\MembershipPlan;

class MembershipController extends Controller
{
    public function index()
    {
        return inertia('Membership', [
            'membershipPlans' => MembershipPlan::orderBy('sort_order')->get(['name', 'monthly_price', 'annual_price', 'popular', 'features']),
            'faqs' => Faq::where('page', 'membership')->orderBy('sort_order')->get(['question', 'answer']),
        ]);
    }
}
