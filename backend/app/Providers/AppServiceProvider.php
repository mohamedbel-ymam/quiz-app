<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
public function boot(): void
{
    Route::prefix('api')
        ->middleware('api')   // <— important: NOT 'web'
        ->group(base_path('routes/api.php'));
            RateLimiter::for('admin-login', function (Request $request) {
        $ip = $request->ip();
        return [
            Limit::perMinute(5)->by($ip),   // max 5/minute
            Limit::perHour(50)->by($ip),    // max 50/heure
        ];
    });

    RateLimiter::for('admin-rotate', function (Request $request) {
        return [ Limit::perMinute(3)->by($request->ip()) ];
    });

    }
}
