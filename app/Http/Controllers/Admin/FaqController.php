<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index()
    {
        return inertia('Admin/Faqs/Index', [
            'faqs' => Faq::orderBy('sort_order')->get(['id', 'question', 'answer', 'page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => ['required', 'string'],
            'answer' => ['required', 'string'],
            'page' => ['required', 'in:contact,membership'],
        ]);

        $nextOrder = (int) Faq::max('sort_order') + 1;

        Faq::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => ['required', 'string'],
            'answer' => ['required', 'string'],
            'page' => ['required', 'in:contact,membership'],
        ]);

        $faq->update($validated);

        return back();
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return back();
    }
}
