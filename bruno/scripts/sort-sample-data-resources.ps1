$base = "..\Sample Data\Resources"

if (-not (Test-Path $base)) {
    throw "Path not found: $base"
}

$index = 1

Get-ChildItem -Path $base -Directory |
    Sort-Object Name |
    ForEach-Object {
        $folderBru = Join-Path $_.FullName "folder.bru"

        if (-not (Test-Path $folderBru)) {
            Write-Warning "Missing folder.bru in $($_.Name)"
            $index++
            return
        }

        $lines = Get-Content -Path $folderBru
        $seqLineIndex = -1

        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\s*seq\s*:') {
                $seqLineIndex = $i
                break
            }
        }

        if ($seqLineIndex -lt 0) {
            Write-Warning "Missing seq in $($_.Name)"
            $index++
            return
        }

        $indent = "  "
        if ($lines[$seqLineIndex] -match '^(\s*)seq\s*:') {
            $indent = $matches[1]
        }

        $lines[$seqLineIndex] = "$($indent)seq: $index"
        Set-Content -Path $folderBru -Value $lines

        Write-Output "$($_.Name) -> seq: $index"
        $index++
    }
