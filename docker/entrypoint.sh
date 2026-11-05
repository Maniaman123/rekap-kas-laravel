#!/bin/sh
set -e

echo "[entrypoint] Clearing cached config..."
php artisan config:clear

echo "[entrypoint] Caching config..."
php artisan config:cache

echo "[entrypoint] Caching routes..."
php artisan route:cache

echo "[entrypoint] Caching views..."
php artisan view:cache

echo "[entrypoint] Running migrations..."
php artisan migrate --force

echo "[entrypoint] Starting server on 0.0.0.0:${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"

