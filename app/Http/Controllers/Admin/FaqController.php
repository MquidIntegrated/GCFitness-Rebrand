<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FaqController extends Controller
{
    public function index()
    {
        return inertia('Admin/Faqs/Index', [
            'faqs' => Faq::orderBy('sort_order')->get(['id', 'question', 'answer', 'show_on_contact', 'show_on_membership']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Faq::max('sort_order') + 1;

        Faq::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Faq $faq)
    {
        $validated = $this->validated($request);

        $faq->update($validated);

        return back();
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'show_on_contact' => ['required', 'boolean'],
            'show_on_membership' => ['required', 'boolean'],
        ]);

        if (! $validated['show_on_contact'] && ! $validated['show_on_membership']) {
            throw ValidationException::withMessages([
                'show_on_contact' => 'Select at least one page to show this on.',
            ]);
        }

        return $validated;
    }
}
