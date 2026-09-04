<?php

namespace App\Http\Controllers;

use App\Models\ClubLocation;
use App\Models\Faq;

class ContactController extends Controller
{
    public function index()
    {
        return inertia('Contact', [
            'clubs' => ClubLocation::orderBy('sort_order')->get(['name', 'address', 'hours']),
            'faqs' => Faq::where('show_on_contact', true)->orderBy('sort_order')->get(['question', 'answer']),
        ]);
    }
}
