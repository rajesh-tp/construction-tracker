#!/bin/sh
set -e

# Run database migrations against the persistent volume
npx drizzle-kit migrate

# Seed default users (INSERT OR IGNORE - won't overwrite existing)
node seed-users.mjs

# Start the Next.js standalone server
node server.js
