# ============================================================
# Stage 1 — Node.js: compile Vite/React assets
# ============================================================
FROM node:20-alpine AS node-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY resources/ resources/
COPY public/      public/
COPY vite.config.js tailwind.config.js postcss.config.js jsconfig.json ./

RUN npm run build

# ============================================================
# Stage 2 — PHP: install Composer dependencies
# ============================================================
FROM composer:2 AS composer-builder

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --optimize-autoloader \
    --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev

# ============================================================
# Stage 3 — Production runtime
# ============================================================
FROM php:8.3-cli-alpine AS production

# System deps + PHP extensions required by Laravel + Supabase/pgsql
RUN apk add --no-cache \
        libpq-dev \
        libzip-dev \
        zip \
        unzip \
        bash \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        zip \
        bcmath \
        opcache

# OPcache tuned for production CLI (artisan serve / frankenphp)
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.save_comments=1'; \
} > /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /app

# Copy Composer vendor + application source
COPY --from=composer-builder /app /app

# Copy compiled Vite assets into public/build
COPY --from=node-builder /app/public/build /app/public/build

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Hugging Face Spaces runs as user UID 1000
RUN adduser -D -u 1000 user \
    && mkdir -p storage/framework/{cache,sessions,views} \
             storage/logs \
             bootstrap/cache \
    && chown -R user:user storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

USER user

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]

