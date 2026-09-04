<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\ProgramsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index']);
Route::get('/about', [AboutController::class, 'index']);
Route::get('/programs', [ProgramsController::class, 'index']);
Route::get('/membership', [MembershipController::class, 'index']);
Route::get('/contact', [ContactController::class, 'index']);

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('login.attempt');
    Route::get('forgot-password', [AuthController::class, 'showForgotPassword'])->name('forgot-password');
    Route::post('forgot-password', [AuthController::class, 'sendResetLink'])->middleware('throttle:5,1')->name('password.email');
    Route::get('reset-password', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->name('password.update');

    // Use 'auth.admin' (never the stock 'auth' alias) for any protected admin route —
    // the default alias redirects to a route named 'login', which this app never
    // registers (only 'admin.login'), so it would fail to redirect at all.
    Route::middleware('auth.admin')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::post('uploads', [UploadController::class, 'store'])->name('uploads.store');
    });
});
