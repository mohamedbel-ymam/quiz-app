<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;

class AdminSecurityController extends Controller
{
    // GET /api/admin/ping  (protégé & throttlé)
    public function ping(Request $request)
    {
        return response()->json(['ok' => true]);
    }

    // POST /api/admin/admin-key  (changer la clé)
    // Headers: X-ADMIN-KEY: <ancienne clé>
    // Body: { "new_key": "...", "confirm_key": "..." }
    public function rotate(Request $request)
    {
        $data = $request->validate([
            'new_key'     => 'required|string|min:16|max:128',
            'confirm_key' => 'required|string|same:new_key',
        ]);

        $settings = Setting::firstOrCreate([]);
        $settings->admin_key_hash = Hash::make($data['new_key']);
        $settings->save();

        return response()->json(['ok' => true]);
    }
}
