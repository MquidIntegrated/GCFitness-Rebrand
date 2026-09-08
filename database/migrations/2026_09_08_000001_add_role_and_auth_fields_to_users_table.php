<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('admin')->after('email');
            $table->boolean('is_active')->default(true)->after('role');
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->string('temp_password_hash')->nullable()->after('password');
            $table->timestamp('temp_password_expires_at')->nullable()->after('temp_password_hash');
        });

        DB::table('users')->where('email', 'admin@gcfitness.club')->update(['role' => 'super_admin']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active', 'must_change_password', 'temp_password_hash', 'temp_password_expires_at']);
        });
    }
};
