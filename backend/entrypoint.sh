#!/bin/sh
set -e

: "${PORT:=8000}"

python manage.py migrate --noinput

if [ "${DJANGO_SEED_REWARDS:-0}" = "1" ]; then
  python manage.py seed_rewards
fi

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:"$PORT" \
  --workers 2 \
  --threads 4 \
  --timeout 120
