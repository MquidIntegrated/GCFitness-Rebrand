<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Attempting;
use Illuminate\Auth\Events\Failed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Timebox;
use Illuminate\Validation\Rules\Password;
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

        event(new Attempting('web', $credentials, $request->boolean('remember')));

        $user = User::where('email', $credentials['email'])->first();

        $authenticated = app(Timebox::class)->call(function () use ($user, $credentials) {
            return $user
                && $user->is_active
                && (Hash::check($credentials['password'], $user->password)
                    || $user->hasValidTemporaryPassword($credentials['password']));
        }, 200000);

        if (! $authenticated) {
            event(new Failed('web', $user, $credentials));

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
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();

        if (Hash::check($validated['password'], $user->password)
            || $user->hasValidTemporaryPassword($validated['password'])) {
            throw ValidationException::withMessages([
                'password' => 'Please choose a password different from your current one.',
            ]);
        }

        $user->forceFill(['password' => $validated['password']])->save();
        $user->clearTemporaryPassword();

        DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }
}
