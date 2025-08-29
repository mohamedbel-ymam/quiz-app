<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AdminKeyMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $provided = $request->header('X-ADMIN-KEY');

        // Rate limit basique (optionnel ici si tu mets le throttle sur les routes)
        if (!$provided) {
            return response()->json(['message' => 'Admin key required'], 401);
        }

        $settings = Setting::first();
        $hash = $settings?->admin_key_hash;

        // fallback: si jamais pas configuré, autoriser TEMPORAIREMENT la clé .env
        if ($hash) {
            if (!Hash::check($provided, $hash)) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        } else {
            $env = env('ADMIN_KEY');
            if (!$env || $env !== $provided) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        }

        return $next($request);
    }
}
