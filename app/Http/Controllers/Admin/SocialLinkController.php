<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialLink;
use Illuminate\Http\Request;

class SocialLinkController extends Controller
{
    public function index()
    {
        return inertia('Admin/SocialLinks/Index', [
            'links' => SocialLink::orderBy('sort_order')->get(['id', 'platform', 'url', 'icon_slug']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:255'],
            'icon_slug' => ['required', 'string', 'max:100'],
        ]);

        $nextOrder = (int) SocialLink::max('sort_order') + 1;

        SocialLink::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, SocialLink $socialLink)
    {
        $validated = $request->validate([
            'platform' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:255'],
            'icon_slug' => ['required', 'string', 'max:100'],
        ]);

        $socialLink->update($validated);

        return back();
    }

    public function destroy(SocialLink $socialLink)
    {
        $socialLink->delete();

        return back();
    }
}
