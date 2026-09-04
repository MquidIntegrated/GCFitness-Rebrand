<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index()
    {
        return inertia('Admin/Testimonials/Index', [
            'testimonials' => Testimonial::orderBy('sort_order')->get(['id', 'quote', 'name', 'role', 'page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quote' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'page' => ['required', 'in:home,about'],
        ]);

        $nextOrder = (int) Testimonial::max('sort_order') + 1;

        Testimonial::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'quote' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'page' => ['required', 'in:home,about'],
        ]);

        $testimonial->update($validated);

        return back();
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return back();
    }
}
