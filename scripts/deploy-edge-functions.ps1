param(
  [string[]]$Function = @(),
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$functionsDir = Join-Path $repoRoot 'supabase/functions'

if (-not (Test-Path $functionsDir)) {
  throw "Could not find supabase functions directory at $functionsDir"
}

$allFunctions = Get-ChildItem $functionsDir -Directory |
  Where-Object {
    $_.Name -ne '_shared' -and
    (Test-Path (Join-Path $_.FullName 'index.ts'))
  } |
  Select-Object -ExpandProperty Name |
  Sort-Object

if ($Function.Count -gt 0) {
  $unknown = @($Function | Where-Object { $_ -notin $allFunctions })
  if ($unknown.Count -gt 0) {
    throw "Unknown function(s): $($unknown -join ', ')"
  }
  $targets = @($Function)
}
else {
  $targets = @($allFunctions)
}

if ($targets.Count -eq 0) {
  throw 'No edge functions found to deploy.'
}

Write-Host "Deploying edge functions with --no-verify-jwt:"
Write-Host ($targets -join ', ')

foreach ($fn in $targets) {
  $args = @('supabase', 'functions', 'deploy', $fn, '--no-verify-jwt')
  if ($DryRun) {
    Write-Host "npx $($args -join ' ')"
    continue
  }

  Write-Host "-> $fn"
  & npx.cmd @args
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to deploy function: $fn"
  }
}

Write-Host 'Edge function deployment complete.'
