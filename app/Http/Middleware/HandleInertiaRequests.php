<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use App\Models\SocialLink;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            //
            'flash' => [
                'message' => fn() => $request->session()->get('message'),
                'tempPassword' => fn() => $request->session()->get('tempPassword'),
            ],
            'status' => fn() => $request->session()->get('status'),
            'auth' => fn () => [
                'user' => $request->user() ? ['name' => $request->user()->name, 'role' => $request->user()->role] : null,
            ],
            'siteSetting' => fn () => SiteSetting::first(['address_line1', 'address_line2', 'phone', 'email', 'hours']) ?? new SiteSetting(),
            'socialLinks' => fn () => SocialLink::orderBy('sort_order')->get(['url', 'icon_slug', 'platform']),
        ];
    }
}
