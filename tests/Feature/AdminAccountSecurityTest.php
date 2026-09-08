<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Finding 1 regression: a deactivated admin who is currently mid-session
     * (already authenticated) must be rejected on their very next request,
     * even though their session was established before deactivation.
     */
    public function test_deactivated_admin_is_rejected_on_next_request_while_mid_session(): void
    {
        $admin = User::create([
            'name' => 'Mid Session Admin',
            'email' => 'midsession@gcfitness.club',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Deactivate after the "session" was established.
        $admin->update(['is_active' => false]);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertRedirect(route('admin.login'));
    }

    /**
     * Finding 2 regression: POST /admin/set-password must be gated —
     * an authenticated admin whose must_change_password is false cannot
     * hit the forced-reset endpoint to overwrite their password with zero
     * verification of their current password.
     */
    public function test_set_password_is_forbidden_when_must_change_password_is_false(): void
    {
        $admin = User::create([
            'name' => 'Regular Admin',
            'email' => 'regularadmin@gcfitness.club',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $response = $this->actingAs($admin)->post(route('admin.password.set.update'), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ]);

        $response->assertForbidden();
    }

    /**
     * Finding 3 regression: changing a password via the self-service
     * account/password endpoint must invalidate the user's other live
     * sessions (not just the current one).
     */
    public function test_changing_password_deletes_other_session_rows(): void
    {
        $admin = User::create([
            'name' => 'Session Admin',
            'email' => 'sessionadmin@gcfitness.club',
            'password' => Hash::make('old-password'),
            'role' => 'admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        DB::table('sessions')->insert([
            [
                'id' => 'current-session-id',
                'user_id' => $admin->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'test-agent',
                'payload' => base64_encode(serialize([])),
                'last_activity' => time(),
            ],
            [
                'id' => 'other-session-id',
                'user_id' => $admin->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'test-agent',
                'payload' => base64_encode(serialize([])),
                'last_activity' => time(),
            ],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.account.password.update'), [
                'current_password' => 'old-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $this->assertDatabaseMissing('sessions', ['id' => 'other-session-id']);
    }
}
