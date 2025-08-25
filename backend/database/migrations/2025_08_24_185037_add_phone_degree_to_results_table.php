<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('results', function (Blueprint $table) {
            if (!Schema::hasColumn('results','phone')) {
                $table->string('phone', 20)->nullable()->after('student_name');
            }
            if (!Schema::hasColumn('results','degree')) {
                $table->string('degree', 32)->nullable()->after('subject');
            }
        });
    }
    public function down(): void {
        Schema::table('results', function (Blueprint $table) {
            if (Schema::hasColumn('results','phone')) $table->dropColumn('phone');
            if (Schema::hasColumn('results','degree')) $table->dropColumn('degree');
        });
    }
};
