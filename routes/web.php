<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ClubLocationController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\MembershipPlanController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\SocialLinkController;
use App\Http\Controllers\Admin\TestimonialController;
use App\Http\Controllers\Admin\TrainerController;
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

    // Use 'auth.admin' (never the stock 'auth' alias) for any protected admin route —
    // the default alias redirects to a route named 'login', which this app never
    // registers (only 'admin.login'), so it would fail to redirect at all.
    Route::middleware(['auth.admin', 'account.active', 'password.current'])->group(function () {
        Route::get('set-password', [AuthController::class, 'showSetPassword'])->name('password.set');
        Route::post('set-password', [AuthController::class, 'setPassword'])->name('password.set.update');

        Route::middleware('role.super_admin')->group(function () {
            Route::get('admins', [AdminAccountController::class, 'index'])->name('admins.index');
            Route::post('admins', [AdminAccountController::class, 'store'])->name('admins.store');
            Route::post('admins/{admin}/reset-access', [AdminAccountController::class, 'resetAccess'])->name('admins.reset-access');
            Route::post('admins/{admin}/deactivate', [AdminAccountController::class, 'deactivate'])->name('admins.deactivate');
            Route::post('admins/{admin}/reactivate', [AdminAccountController::class, 'reactivate'])->name('admins.reactivate');
            Route::delete('admins/{admin}', [AdminAccountController::class, 'destroy'])->name('admins.destroy');
        });

        Route::get('account/password', [AccountController::class, 'showChangePassword'])->name('account.password.edit');
        Route::post('account/password', [AccountController::class, 'changePassword'])->name('account.password.update');

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::post('uploads', [UploadController::class, 'store'])->name('uploads.store');

        Route::get('locations', [ClubLocationController::class, 'index'])->name('locations.index');
        Route::post('locations', [ClubLocationController::class, 'store'])->name('locations.store');
        Route::put('locations/{location}', [ClubLocationController::class, 'update'])->name('locations.update');
        Route::delete('locations/{location}', [ClubLocationController::class, 'destroy'])->name('locations.destroy');

        Route::get('social-links', [SocialLinkController::class, 'index'])->name('social-links.index');
        Route::post('social-links', [SocialLinkController::class, 'store'])->name('social-links.store');
        Route::put('social-links/{socialLink}', [SocialLinkController::class, 'update'])->name('social-links.update');
        Route::delete('social-links/{socialLink}', [SocialLinkController::class, 'destroy'])->name('social-links.destroy');

        Route::get('faqs', [FaqController::class, 'index'])->name('faqs.index');
        Route::post('faqs', [FaqController::class, 'store'])->name('faqs.store');
        Route::put('faqs/{faq}', [FaqController::class, 'update'])->name('faqs.update');
        Route::delete('faqs/{faq}', [FaqController::class, 'destroy'])->name('faqs.destroy');

        Route::get('testimonials', [TestimonialController::class, 'index'])->name('testimonials.index');
        Route::post('testimonials', [TestimonialController::class, 'store'])->name('testimonials.store');
        Route::put('testimonials/{testimonial}', [TestimonialController::class, 'update'])->name('testimonials.update');
        Route::delete('testimonials/{testimonial}', [TestimonialController::class, 'destroy'])->name('testimonials.destroy');

        Route::get('site-settings', [SiteSettingController::class, 'edit'])->name('site-settings.edit');
        Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');

        Route::get('partners', [PartnerController::class, 'index'])->name('partners.index');
        Route::post('partners', [PartnerController::class, 'store'])->name('partners.store');
        Route::put('partners/{partner}', [PartnerController::class, 'update'])->name('partners.update');
        Route::delete('partners/{partner}', [PartnerController::class, 'destroy'])->name('partners.destroy');

        Route::get('programs', [ProgramController::class, 'index'])->name('programs.index');
        Route::get('programs/create', [ProgramController::class, 'create'])->name('programs.create');
        Route::post('programs', [ProgramController::class, 'store'])->name('programs.store');
        Route::get('programs/{program}/edit', [ProgramController::class, 'edit'])->name('programs.edit');
        Route::put('programs/{program}', [ProgramController::class, 'update'])->name('programs.update');
        Route::delete('programs/{program}', [ProgramController::class, 'destroy'])->name('programs.destroy');

        Route::get('trainers', [TrainerController::class, 'index'])->name('trainers.index');
        Route::get('trainers/create', [TrainerController::class, 'create'])->name('trainers.create');
        Route::post('trainers', [TrainerController::class, 'store'])->name('trainers.store');
        Route::get('trainers/{trainer}/edit', [TrainerController::class, 'edit'])->name('trainers.edit');
        Route::put('trainers/{trainer}', [TrainerController::class, 'update'])->name('trainers.update');
        Route::delete('trainers/{trainer}', [TrainerController::class, 'destroy'])->name('trainers.destroy');

        Route::get('membership-plans', [MembershipPlanController::class, 'index'])->name('membership-plans.index');
        Route::get('membership-plans/create', [MembershipPlanController::class, 'create'])->name('membership-plans.create');
        Route::post('membership-plans', [MembershipPlanController::class, 'store'])->name('membership-plans.store');
        Route::patch('membership-plans/reorder', [MembershipPlanController::class, 'reorder'])->name('membership-plans.reorder');
        Route::get('membership-plans/{membershipPlan}/edit', [MembershipPlanController::class, 'edit'])->name('membership-plans.edit');
        Route::put('membership-plans/{membershipPlan}', [MembershipPlanController::class, 'update'])->name('membership-plans.update');
        Route::delete('membership-plans/{membershipPlan}', [MembershipPlanController::class, 'destroy'])->name('membership-plans.destroy');
    });
});
