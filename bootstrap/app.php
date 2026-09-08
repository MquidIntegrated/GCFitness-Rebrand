<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\AuthenticateAdmin;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsurePasswordIsCurrent;
use App\Http\Middleware\EnsureAccountIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'auth.admin' => AuthenticateAdmin::class,
            'role.super_admin' => EnsureSuperAdmin::class,
            'password.current' => EnsurePasswordIsCurrent::class,
            'account.active' => EnsureAccountIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
