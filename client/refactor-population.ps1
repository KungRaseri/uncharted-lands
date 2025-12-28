# Script to refactor population.spec.ts
$file = "tests\e2e\population.spec.ts"
$lines = Get-Content $file

# Find key line numbers
$beforeAllStart = -1
$beforeEachStart = -1
$afterEachStart = -1
$afterEachEnd = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s+test\.beforeEach') {
        $beforeEachStart = $i
    }
    if ($lines[$i] -match '^\s+test\.afterEach') {
        $afterEachStart = $i
    }
    if ($afterEachStart -gt 0 -and $afterEachEnd -lt 0 -and $lines[$i] -match '^\s+\}\);$') {
        $afterEachEnd = $i
    }
}

Write-Host "beforeEachStart: $beforeEachStart"
Write-Host "afterEachStart: $afterEachStart"
Write-Host "afterEachEnd: $afterEachEnd"

# Remove the afterEach block if found
if ($afterEachStart -gt 0 -and $afterEachEnd -gt $afterEachStart) {
    Write-Host "Removing afterEach block (lines $($afterEachStart+1) to $($afterEachEnd+1))"
    $newLines = $lines[0..($afterEachStart-1)] + $lines[($afterEachEnd+2)..($lines.Count-1)]
    $newLines | Set-Content $file -Encoding UTF8
    Write-Host "Done!"
} else {
    Write-Host "Could not find afterEach block to remove"
}
