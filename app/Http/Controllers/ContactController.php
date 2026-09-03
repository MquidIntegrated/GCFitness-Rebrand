<?php

namespace App\Http\Controllers;

use App\Models\ClubLocation;
use App\Models\Faq;
use App\Models\SiteSetting;

class ContactController extends Controller
{
    public function index()
    {
        return inertia('Contact', [
            'clubs' => ClubLocation::orderBy('sort_order')->get(['name', 'address', 'hours']),
            'faqs' => Faq::where('page', 'contact')->orderBy('sort_order')->get(['question', 'answer']),
            'siteSetting' => SiteSetting::first(['address_line1', 'address_line2', 'phone', 'email', 'hours']) ?? new SiteSetting(),
        ]);
    }
}
