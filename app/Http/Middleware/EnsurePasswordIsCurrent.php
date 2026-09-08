<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsCurrent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user
            && $user->must_change_password
            && ! $request->routeIs('admin.password.set', 'admin.password.set.update', 'admin.logout')
        ) {
            return redirect()->route('admin.password.set');
        }

        return $next($request);
    }
}
