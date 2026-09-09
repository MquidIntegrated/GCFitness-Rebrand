<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\AuthenticateAdmin;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsurePasswordIsCurrent;
use App\Http\Middleware\EnsureAccountIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

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
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($response->getStatusCode() === 419) {
                return back()->with('message', 'The page expired, please try again.');
            }

            if (! app()->environment(['local', 'testing']) && in_array($response->getStatusCode(), [403, 404, 419, 429, 500, 503])) {
                return Inertia::render('Error', ['status' => $response->getStatusCode()])
                    ->toResponse($request)
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
