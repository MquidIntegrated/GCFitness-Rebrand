<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Timebox;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function showLogin()
    {
        return inertia('Admin/Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        $authenticated = app(Timebox::class)->call(function () use ($user, $credentials) {
            return $user
                && $user->is_active
                && (Hash::check($credentials['password'], $user->password)
                    || $user->hasValidTemporaryPassword($credentials['password']));
        }, 200000);

        if (! $authenticated) {
            throw ValidationException::withMessages([
                'email' => 'Invalid email or password. Please try again.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    public function showSetPassword()
    {
        return inertia('Admin/Auth/SetPassword');
    }

    public function setPassword(Request $request)
    {
        abort_unless($request->user()->must_change_password, 403);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = $request->user();
        $user->forceFill(['password' => Hash::make($validated['password'])])->save();
        $user->clearTemporaryPassword();

        DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }
}
