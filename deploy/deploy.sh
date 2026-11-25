#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kurflow}"
PHP_BIN="${PHP_BIN:-php8.3}"

cd "$APP_DIR"

on_error() {
    "$PHP_BIN" artisan up || true
}
trap on_error ERR

"$PHP_BIN" artisan down --retry=60 || true

composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
"$PHP_BIN" artisan migrate --force
"$PHP_BIN" artisan optimize

sudo chown -R www-data:www-data storage bootstrap/cache
sudo systemctl reload php8.3-fpm

"$PHP_BIN" artisan up
sudo supervisorctl restart kurflow-reverb
