<?php

// database/migrations/xxxx_add_degree_to_results_table.php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('results', function (Blueprint $table) {
            $table->string('degree', 32)->nullable()->after('subject');
        });
    }
    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {
            $table->dropColumn('degree');
        });
    }
};
