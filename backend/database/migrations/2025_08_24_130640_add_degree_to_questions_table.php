<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('degree', 32)->default('degree1')->after('subject');
            $table->index(['degree', 'subject']);
        });
    }
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex(['degree', 'subject']);
            $table->dropColumn('degree');
        });
    }
};
