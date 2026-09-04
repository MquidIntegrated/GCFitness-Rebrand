<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->boolean('show_on_home')->default(false)->after('page');
            $table->boolean('show_on_about')->default(false)->after('show_on_home');
        });

        DB::table('testimonials')->select('id', 'page')->orderBy('id')->get()->each(function ($row) {
            DB::table('testimonials')->where('id', $row->id)->update([
                'show_on_home' => $row->page === 'home',
                'show_on_about' => $row->page === 'about',
            ]);
        });

        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropColumn('page');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->string('page')->nullable()->after('role');
        });

        DB::table('testimonials')->select('id', 'show_on_home', 'show_on_about')->orderBy('id')->get()->each(function ($row) {
            DB::table('testimonials')->where('id', $row->id)->update([
                'page' => $row->show_on_home ? 'home' : ($row->show_on_about ? 'about' : null),
            ]);
        });

        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropColumn(['show_on_home', 'show_on_about']);
        });
    }
};
