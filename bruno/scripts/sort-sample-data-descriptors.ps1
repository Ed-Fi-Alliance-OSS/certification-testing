$base = Join-Path $PSScriptRoot "..\Sample Data\Descriptors"

if (-not (Test-Path $base)) {
    throw "Path not found: $base"
}

$index = 1

Get-ChildItem -Path $base -File -Filter "*.bru" |
    Where-Object { $_.Name -ne "folder.bru" } |
    Sort-Object Name |
    ForEach-Object {
        $bruFile = $_.FullName
        $lines = Get-Content -Path $bruFile
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
        Set-Content -Path $bruFile -Value $lines

        Write-Output "$($_.Name) -> seq: $index"
        $index++
    }
