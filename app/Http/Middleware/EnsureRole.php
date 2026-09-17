<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureRole middleware.
 *
 * Usage in routes:
 *   ->middleware('role:bendahara')
 *   ->middleware('role:pelajar')
 *
 * Returns HTTP 403 Forbidden when the authenticated user does not hold
 * the required role. Unauthenticated users are redirected to login by
 * the `auth` middleware, which must appear before this one in the chain.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user() || $request->user()->role !== $role) {
            abort(403, 'Akses ditolak. Peran tidak sesuai.');
        }

        return $next($request);
    }
}
