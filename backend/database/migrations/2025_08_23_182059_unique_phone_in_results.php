<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Clean duplicates first if any, or the index will fail.
        // You can manually delete older rows where phone is the same.
        Schema::table('results', function (Blueprint $table) {
            if (!Schema::hasColumn('results','phone')) return;
            $table->unique('phone', 'results_phone_unique');
        });
    }
    public function down(): void {
        Schema::table('results', function (Blueprint $table) {
            $table->dropUnique('results_phone_unique');
        });
    }
};
