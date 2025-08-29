<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->change();
            $table->unique('phone', 'users_phone_unique');
        });
        Schema::table('results', function (Blueprint $table) {
            $table->string('phone', 20)->nullable(false)->change();
            $table->unique('phone', 'results_phone_unique');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_phone_unique');
        });
        Schema::table('results', function (Blueprint $table) {
            $table->dropUnique('results_phone_unique');
        });
    }
};
