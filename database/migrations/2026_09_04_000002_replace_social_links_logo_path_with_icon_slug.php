<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('social_links', function (Blueprint $table) {
            $table->string('icon_slug')->nullable()->after('platform');
        });

        DB::table('social_links')->select('id', 'platform')->orderBy('id')->get()->each(function ($row) {
            DB::table('social_links')->where('id', $row->id)->update([
                'icon_slug' => Str::slug($row->platform, ''),
            ]);
        });

        Schema::table('social_links', function (Blueprint $table) {
            $table->dropColumn('logo_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_links', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('platform');
        });

        Schema::table('social_links', function (Blueprint $table) {
            $table->dropColumn('icon_slug');
        });
    }
};
