#!/usr/bin/env bash
# Deploy all Supabase Edge Functions.
# Usage: bash scripts/deploy-functions.sh
#
# IMPORTANT: All functions are deployed with --no-verify-jwt because
# authentication is handled inside each function via getAuthenticatedUser().
# The Supabase gateway JWT check must be disabled so requests reach the
# function code — the function itself validates the JWT and returns 401
# for unauthenticated callers.
#
# WARNING: `supabase functions deploy` (bulk, no flag) defaults to
# verify_jwt=true, which silently breaks ALL authenticated endpoints.
# ALWAYS use this script instead of raw `supabase functions deploy`.

set -euo pipefail

SUPABASE="${SUPABASE:-supabase}"

echo "=== Deploying ALL Edge Functions with --no-verify-jwt ==="
"$SUPABASE" functions deploy --no-verify-jwt
echo "=== Done ==="
