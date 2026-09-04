<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TestimonialController extends Controller
{
    public function index()
    {
        return inertia('Admin/Testimonials/Index', [
            'testimonials' => Testimonial::orderBy('sort_order')->get(['id', 'quote', 'name', 'role', 'show_on_home', 'show_on_about']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Testimonial::max('sort_order') + 1;

        Testimonial::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $this->validated($request);

        $testimonial->update($validated);

        return back();
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'quote' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'show_on_home' => ['required', 'boolean'],
            'show_on_about' => ['required', 'boolean'],
        ]);

        if (! $validated['show_on_home'] && ! $validated['show_on_about']) {
            throw ValidationException::withMessages([
                'show_on_home' => 'Select at least one page to show this on.',
            ]);
        }

        return $validated;
    }
}
