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
        Schema::table('faqs', function (Blueprint $table) {
            $table->boolean('show_on_contact')->default(false)->after('page');
            $table->boolean('show_on_membership')->default(false)->after('show_on_contact');
        });

        DB::table('faqs')->select('id', 'page')->orderBy('id')->get()->each(function ($row) {
            DB::table('faqs')->where('id', $row->id)->update([
                'show_on_contact' => $row->page === 'contact',
                'show_on_membership' => $row->page === 'membership',
            ]);
        });

        Schema::table('faqs', function (Blueprint $table) {
            $table->dropColumn('page');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faqs', function (Blueprint $table) {
            $table->string('page')->nullable()->after('answer');
        });

        DB::table('faqs')->select('id', 'show_on_contact', 'show_on_membership')->orderBy('id')->get()->each(function ($row) {
            DB::table('faqs')->where('id', $row->id)->update([
                'page' => $row->show_on_contact ? 'contact' : ($row->show_on_membership ? 'membership' : null),
            ]);
        });

        Schema::table('faqs', function (Blueprint $table) {
            $table->dropColumn(['show_on_contact', 'show_on_membership']);
        });
    }
};
