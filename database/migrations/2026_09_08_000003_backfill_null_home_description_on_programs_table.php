<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('programs')
            ->whereNull('home_description')
            ->update(['home_description' => DB::raw('description')]);
    }

    public function down(): void
    {
        // Intentionally irreversible — there is no way to distinguish which
        // rows were backfilled by this migration from rows that always had
        // a matching description/home_description, so down() is a no-op.
    }
};
