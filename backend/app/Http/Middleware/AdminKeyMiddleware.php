<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminKeyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('X-ADMIN-KEY');
        if (!$key || $key !== config('app.admin_key')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        return $next($request);
    }
}
