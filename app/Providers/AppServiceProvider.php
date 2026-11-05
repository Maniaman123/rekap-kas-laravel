<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

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
        Vite::prefetch(concurrency: 3);

        // Force HTTPS for all generated URLs (Ziggy routes, Vite assets, redirects)
        // when behind a cloud load balancer / reverse proxy in production.
        // Prevents Inertia XHR Mixed Content errors on HTTPS-terminated deployments.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
