#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/supabase/functions"

if [[ ! -d "$FUNCTIONS_DIR" ]]; then
  echo "Could not find supabase functions directory at $FUNCTIONS_DIR" >&2
  exit 1
fi

mapfile -t all_functions < <(
  find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d \
    ! -name "_shared" \
    -exec test -f "{}/index.ts" ";" \
    -print \
  | xargs -n1 basename \
  | sort
)

if [[ "${#all_functions[@]}" -eq 0 ]]; then
  echo "No edge functions found to deploy." >&2
  exit 1
fi

targets=("$@")
if [[ "${#targets[@]}" -eq 0 ]]; then
  targets=("${all_functions[@]}")
fi

for fn in "${targets[@]}"; do
  if [[ ! " ${all_functions[*]} " =~ " ${fn} " ]]; then
    echo "Unknown function: ${fn}" >&2
    exit 1
  fi
done

echo "Deploying edge functions with --no-verify-jwt:"
printf '%s\n' "${targets[@]}"

for fn in "${targets[@]}"; do
  echo "-> ${fn}"
  npx supabase functions deploy "${fn}" --no-verify-jwt
done

echo "Edge function deployment complete."
