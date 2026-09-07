<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClubLocation;
use Illuminate\Http\Request;

class ClubLocationController extends Controller
{
    public function index()
    {
        return inertia('Admin/Locations/Index', [
            'locations' => ClubLocation::orderBy('sort_order')->get(['id', 'name', 'address', 'hours']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'hours' => ['required', 'string', 'max:255'],
        ]);

        $nextOrder = (int) ClubLocation::max('sort_order') + 1;

        ClubLocation::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, ClubLocation $location)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'hours' => ['required', 'string', 'max:255'],
        ]);

        $location->update($validated);

        return back();
    }

    public function destroy(ClubLocation $location)
    {
        $location->delete();

        return back();
    }
}
