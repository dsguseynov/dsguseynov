#!/bin/sh
set -e

# Apply any pending database migrations against the volume-mounted SQLite file.
npx prisma migrate deploy

exec "$@"
