<#
.SYNOPSIS
  Batch‑updates (or installs) a dependency across Bruno collections that maintain their own node_modules.

.DESCRIPTION
  For each listed collection directory, ensures a package.json exists and runs:
    npm install <packageName>@<versionSpecifier>
  If <versionSpecifier> omitted, installs latest.

.PARAMETER PackageName
  The npm package to install/update (e.g. dayjs).

.PARAMETER Version
  Optional version/tag (e.g. 1.11.18 or ^1.11.0). If omitted, latest is used.

.EXAMPLE
  ./update-collection-deps.ps1 -PackageName dayjs -Version ^1.11.18

.EXAMPLE
  ./update-collection-deps.ps1 -PackageName dayjs
#>
param(
  [Parameter(Mandatory = $true)][string]$PackageName,
  [string]$Version
)

$ErrorActionPreference = 'Stop'

$Collections = @(
  'SIS',
  'Sample Data',
  'Assessment'
)

Write-Host "Updating dependency '$PackageName' across $($Collections.Count) collections..." -ForegroundColor Cyan

foreach ($col in $Collections) {
  $path = Join-Path -Path (Get-Location) -ChildPath $col
  if (-not (Test-Path $path)) {
    Write-Warning "Collection path not found: $col (skipping)"
    continue
  }

  Push-Location $path
  try {
    if (-not (Test-Path 'package.json')) {
      Write-Host "Initializing package.json in $col" -ForegroundColor Yellow
      npm init -y | Out-Null
    }

    $pkgSpec = if ($Version) { "$PackageName@$Version" } else { $PackageName }
    Write-Host "Installing $pkgSpec in $col" -ForegroundColor Green
    npm install $pkgSpec --no-audit --no-fund | Out-Null
  }
  finally {
    Pop-Location
  }
}

Write-Host "Dependency update complete." -ForegroundColor Cyan
