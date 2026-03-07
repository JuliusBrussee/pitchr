#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
cd "${REPO_ROOT}"
yarn rubric:matrix:anthropic --mode vc_pitch --out-dir ".cache/rubric-sandbox/matrix-anthropic-two_min_pitch" "$@"
