<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    public function edit()
    {
        $settings = SiteSetting::first() ?? new SiteSetting();

        return inertia('Admin/SiteSettings/Edit', [
            'settings' => [
                'address_line1' => $settings->address_line1,
                'address_line2' => $settings->address_line2,
                'phone' => $settings->phone,
                'email' => $settings->email,
                'hours' => $settings->hours,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'hours' => ['required', 'string', 'max:255'],
        ]);

        $settings = SiteSetting::first() ?? new SiteSetting();
        $settings->fill($validated);
        $settings->save();

        return back();
    }
}
