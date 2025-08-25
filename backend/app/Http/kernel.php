<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use App\Http\Middleware\AdminKeyMiddleware;

class Kernel extends HttpKernel
{
    /**
     * Global HTTP middleware stack.
     * These run during every request to your application.
     */
    protected $middleware = [
        HandleCors::class, // CORS for API calls
    ];

    /**
     * The application's route middleware groups.
     */
protected $middlewareGroups = [
    'web' => [
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
    'api' => [
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api',
    ],

    ];

    /**
     * Route middleware aliases.
     * These may be assigned to groups or used individually.
     */
    protected $middlewareAliases = [
        // Add your custom admin key gate
        'admin.key' => \App\Http\Middleware\AdminKeyMiddleware::class,

        // Common aliases you might use later:
        // 'throttle' => ThrottleRequests::class,
        // 'bindings' => SubstituteBindings::class,
    ];
}
