# Script to fix w-N h-N -> size-N in all TSX/TS files
# Also fixes px-N py-N -> p-N when both axes match

$srcDir = "d:\CNTT\merged\mental-health-ai\mental-health-ai-frontend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.tsx","*.ts" | Where-Object { !$_.FullName.Contains("node_modules") }

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content

    # Fix w-N h-N -> size-N (where N matches)
    # Pattern: capture w-{value} followed by space(s) then h-{same value}
    # Handle various Tailwind size values: numbers, fractions, full, screen, etc.
    $sizeValues = @(
        '0', '0\.5', 'px', '1', '1\.5', '2', '2\.5', '3', '3\.5', '4', '5', '6', '7', '8', '9', '10',
        '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64',
        '72', '80', '96', 'full', 'screen', 'min', 'max', 'fit', 'auto',
        '1/2', '1/3', '2/3', '1/4', '2/4', '3/4', '1/5', '2/5', '3/5', '4/5',
        '1/6', '2/6', '3/6', '4/6', '5/6',
        '\[[\w\.%]+\]'
    )

    foreach ($val in $sizeValues) {
        # w-N h-N -> size-N
        $pattern = "(?<=\s|`|"")w-($val)\s+h-\1(?=\s|`|""|\)|$)"
        $content = [regex]::Replace($content, $pattern, 'size-$1')
        
        # h-N w-N -> size-N (reverse order)
        $pattern2 = "(?<=\s|`|"")h-($val)\s+w-\1(?=\s|`|""|\)|$)"
        $content = [regex]::Replace($content, $pattern2, 'size-$1')
    }

    # Fix px-N py-N -> p-N (where N matches)
    foreach ($val in $sizeValues) {
        $pattern = "(?<=\s|`|"")px-($val)\s+py-\1(?=\s|`|""|\)|$)"
        $content = [regex]::Replace($content, $pattern, 'p-$1')
        
        $pattern2 = "(?<=\s|`|"")py-($val)\s+px-\1(?=\s|`|""|\)|$)"
        $content = [regex]::Replace($content, $pattern2, 'p-$1')
    }

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $replacements = 0
        $origLines = $original -split "`n"
        $newLines = $content -split "`n"
        for ($i = 0; $i -lt [Math]::Max($origLines.Count, $newLines.Count); $i++) {
            if ($i -lt $origLines.Count -and $i -lt $newLines.Count) {
                if ($origLines[$i] -ne $newLines[$i]) { $replacements++ }
            }
        }
        $totalReplacements += $replacements
        Write-Host "Fixed $($file.Name): $replacements line(s) changed"
    }
}

Write-Host "`nTotal lines changed: $totalReplacements"
