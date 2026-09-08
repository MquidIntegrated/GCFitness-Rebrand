<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'temp_password_hash',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'temp_password_expires_at' => 'datetime',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Generates a one-time temporary password, stores its hash separately
     * from the real password column, and returns the plaintext once for
     * display. Issuing a new one automatically invalidates any prior
     * unused one (simply overwritten).
     */
    public function issueTemporaryPassword(): string
    {
        $plainTextPassword = Str::password(12, symbols: false);

        $this->forceFill([
            'temp_password_hash' => Hash::make($plainTextPassword),
            'temp_password_expires_at' => now()->addHour(),
            'must_change_password' => true,
        ])->save();

        return $plainTextPassword;
    }

    public function hasValidTemporaryPassword(string $plainTextPassword): bool
    {
        return $this->temp_password_hash
            && $this->temp_password_expires_at?->isFuture()
            && Hash::check($plainTextPassword, $this->temp_password_hash);
    }

    public function clearTemporaryPassword(): void
    {
        $this->forceFill([
            'temp_password_hash' => null,
            'temp_password_expires_at' => null,
            'must_change_password' => false,
        ])->save();
    }
}
