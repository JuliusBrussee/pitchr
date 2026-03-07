param(
  [string]$Cases = "tests/fixtures/rubric-sandbox/cases.json",
  [ValidateSet("case-or-default","case-only")]
  [string]$CustomPolicy = "case-or-default",
  [string]$OutDir = ".cache/rubric-sandbox/matrix-anthropic-two_min_pitch"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $RepoRoot

yarn rubric:matrix:anthropic --mode vc_pitch --cases "$Cases" --custom-policy "$CustomPolicy" --out-dir "$OutDir"
