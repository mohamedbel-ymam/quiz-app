<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add 'role' if missing
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('student')->after('email');
            });
        }

        // Make email unique if not already unique
        // First, create an index name that won't collide
        $hasUnique = false;
        // Quick check: try to get indexes if your MySQL allows it; otherwise skip check and try adding.
        // If you're unsure, just try adding inside a try/catch or remove duplicates first.

        Schema::table('users', function (Blueprint $table) {
            // If there’s already a non-unique index named 'users_email_index', drop it before adding unique.
            // @NOTE: Only do this if you actually have that index and it’s safe to drop.
            // $table->dropIndex(['email']); // uncomment if needed

            // Add unique (will fail if duplicates exist in data)
            // $table->unique('email', 'users_email_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            // Drop unique if it exists
            $table->dropUnique('users_email_unique');
        });
    }
};