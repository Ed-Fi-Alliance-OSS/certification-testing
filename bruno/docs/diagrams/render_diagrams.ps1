# Render Mermaid diagrams to PNG using mermaid-cli (mmdc)
# Usage:
# 1. Install Node.js + npm
# 2. npm install -g @mermaid-js/mermaid-cli
# 3. Run this script in PowerShell: .\render_diagrams.ps1

$diagrams = @(
    'dependency_graph.mmd',
    'sprint_gantt.mmd',
    'burndown_xy.mmd'
)

# Try to find a system mmdc, otherwise fall back to npx
$mmdcCmd = (Get-Command mmdc -ErrorAction SilentlyContinue)?.Source
$npxCmd = (Get-Command npx -ErrorAction SilentlyContinue)?.Source

if (-not $mmdcCmd -and -not $npxCmd) {
    Write-Error "Neither 'mmdc' nor 'npx' were found in PATH.\nInstall mermaid-cli (npm i -g @mermaid-js/mermaid-cli) or ensure Node/npm is available for npx."
    exit 1
}

# Try to locate a local Chrome/Edge executable and set PUPPETEER_EXECUTABLE_PATH
function Find-ChromeExecutable {
    # Prefer explicit common install locations for this environment first
    $candidates = @(
        'C:\Program Files\Google\Chrome\Application\chrome.exe',
        'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        "$Env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$Env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
        "$Env:LocalAppData\Google\Chrome\Application\chrome.exe",
        "$Env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$Env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
        "$Env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
    )

    foreach ($p in $candidates) {
        if ($p -and (Test-Path $p)) { return $p }
    }

    # Fall back to where.exe lookup if available
    try {
        $chromeWhere = (where.exe chrome 2>$null) -split "\r?\n" | Select-Object -First 1
        if ($chromeWhere -and (Test-Path $chromeWhere)) { return $chromeWhere }
    } catch { }
    try {
        $edgeWhere = (where.exe msedge 2>$null) -split "\r?\n" | Select-Object -First 1
        if ($edgeWhere -and (Test-Path $edgeWhere)) { return $edgeWhere }
    } catch { }

    return $null
}

$chromePath = Find-ChromeExecutable
if ($env:PUPPETEER_EXECUTABLE_PATH -and (Test-Path $env:PUPPETEER_EXECUTABLE_PATH)) {
    Write-Host "Using PUPPETEER_EXECUTABLE_PATH from environment: $env:PUPPETEER_EXECUTABLE_PATH" -ForegroundColor Green
} else {
    $chromePath = Find-ChromeExecutable
    if ($chromePath) {
        Write-Host "Found browser executable: $chromePath" -ForegroundColor Green
        $env:PUPPETEER_EXECUTABLE_PATH = $chromePath
    } else {
        Write-Host "No Chrome/Edge executable found in common locations." -ForegroundColor Yellow
        Write-Host "If you have Chrome/Edge installed, set the environment variable PUPPETEER_EXECUTABLE_PATH to its path, or run 'npx puppeteer browsers install chrome-headless-shell' to install a headless browser." -ForegroundColor Yellow
    }
}

foreach ($d in $diagrams) {
    $in = Join-Path -Path $PSScriptRoot -ChildPath $d
    if (-not (Test-Path $in)) {
        Write-Warning "Source not found: $in -- skipping."
        continue
    }
    $out = [System.IO.Path]::ChangeExtension($in, '.png')
    Write-Host "Rendering $in -> $out (PNG)"

    # Per-diagram rendering hints to improve clarity
    $opts = @()
    if ($d -match 'dependency') {
        $opts = @('-w','2000','-H','400','--scale','2')
    } elseif ($d -match 'gantt') {
        $opts = @('-w','1600','-H','700','--scale','2')
    } elseif ($d -match 'burndown') {
        $opts = @('-w','1000','-H','500','--scale','2')
    } else {
        $opts = @('--scale','2')
    }

    if ($mmdcCmd) {
        & $mmdcCmd -i $in -o $out @opts
        $rc = $LASTEXITCODE
        if ($rc -ne 0) {
            Write-Warning "mmdc exited with code $rc for $d. Trying npx fallback if available."
            if (-not $npxCmd) { throw "Rendering failed and no npx available to fallback." }
        } else { continue }
    }

    if ($npxCmd) {
        & $npxCmd @mermaid-js/mermaid-cli -i $in -o $out @opts
        $rc = $LASTEXITCODE
        if ($rc -ne 0) { throw "npx mermaid-cli failed with exit code $rc for $d" }
    }
}

Write-Host "Done. Generated PNGs are next to the .mmd sources. Upload them to the Confluence page."
