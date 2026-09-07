<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index()
    {
        return inertia('Admin/Partners/Index', [
            'partners' => Partner::orderBy('sort_order')->get(['id', 'name', 'logo_path']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo_path' => ['required', 'string', 'max:255'],
        ]);

        $nextOrder = (int) Partner::max('sort_order') + 1;

        Partner::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Partner $partner)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo_path' => ['required', 'string', 'max:255'],
        ]);

        $partner->update($validated);

        return back();
    }

    public function destroy(Partner $partner)
    {
        $partner->delete();

        return back();
    }
}
