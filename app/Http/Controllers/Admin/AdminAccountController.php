<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAccountController extends Controller
{
    public function index()
    {
        return inertia('Admin/ManageAdmins/Index', [
            'admins' => User::orderBy('name')->get(['id', 'name', 'email', 'role', 'is_active']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $admin = User::create($validated + [
            'password' => Hash::make(Str::random(32)),
            'role' => 'admin',
        ]);

        $tempPassword = $admin->issueTemporaryPassword();

        return back()->with('tempPassword', $tempPassword);
    }

    public function resetAccess(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $tempPassword = $admin->issueTemporaryPassword();

        return back()->with('tempPassword', $tempPassword);
    }

    public function deactivate(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $admin->update(['is_active' => false]);

        DB::table('sessions')->where('user_id', $admin->id)->delete();

        return back();
    }

    public function reactivate(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $admin->update(['is_active' => true]);

        return back();
    }

    public function destroy(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $admin->delete();

        return back();
    }
}
