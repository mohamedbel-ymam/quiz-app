<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $current = Setting::first();
        if ($current) return;

        $plain = env('ADMIN_KEY'); // si tu avais déjà ADMIN_KEY dans .env
        $hash = $plain ? Hash::make($plain) : null;

        Setting::create(['admin_key_hash' => $hash]);
    }
}