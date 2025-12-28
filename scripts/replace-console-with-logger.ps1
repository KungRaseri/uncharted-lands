# Script to replace console.log/warn/error with logger.debug/warn/error
# Usage: .\replace-console-with-logger.ps1 <file-path>

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

# Read file content
$content = Get-Content $FilePath -Raw

# Check if logger is already imported
$hasLoggerImport = $content -match "import.*\{.*logger.*\}.*from.*['`"].*logger.*['`"]"

# Determine import path based on file location
$importPath = if ($FilePath -match "\\client\\src") {
    '$lib/utils/logger'
} else {
    '../utils/logger.js'
}

# Count replacements
$logCount = ([regex]::Matches($content, "console\.log\(")).Count
$warnCount = ([regex]::Matches($content, "console\.warn\(")).Count
$errorCount = ([regex]::Matches($content, "console\.error\(")).Count
$debugCount = ([regex]::Matches($content, "console\.debug\(")).Count

Write-Host "`nFile: $FilePath" -ForegroundColor Cyan
Write-Host "Found:" -ForegroundColor Yellow
Write-Host "  - console.log: $logCount"
Write-Host "  - console.warn: $warnCount" 
Write-Host "  - console.error: $errorCount"
Write-Host "  - console.debug: $debugCount"
Write-Host "  - Logger import: $(if($hasLoggerImport){'Yes'}else{'No'})" -ForegroundColor $(if($hasLoggerImport){'Green'}else{'Red'})

# Perform replacements
$newContent = $content

# Replace console.debug with logger.debug
$newContent = $newContent -replace "console\.debug\(", "logger.debug("

# Replace console.log with logger.debug (most console.log are debug-level)
$newContent = $newContent -replace "console\.log\(", "logger.debug("

# Replace console.warn with logger.warn  
$newContent = $newContent -replace "console\.warn\(", "logger.warn("

# Replace console.error with logger.error
# Need to handle the case where console.error has 2 params (message, error object)
$newContent = $newContent -replace "console\.error\(", "logger.error("

# Add logger import if not present
if (-not $hasLoggerImport) {
    # Find the last import statement
    $importRegex = "(?m)^import .*$"
    $imports = [regex]::Matches($newContent, $importRegex)
    
    if ($imports.Count -gt 0) {
        $lastImport = $imports[$imports.Count - 1]
        $insertPosition = $lastImport.Index + $lastImport.Length
        
        $loggerImport = "`nimport { logger } from '$importPath';"
        $newContent = $newContent.Insert($insertPosition, $loggerImport)
        
        Write-Host "`nAdded logger import" -ForegroundColor Green
    } else {
        Write-Warning "Could not find import statements to add logger import"
    }
}

# Save file
$newContent | Set-Content $FilePath -NoNewline

$newLogCount = ([regex]::Matches($newContent, "console\.log\(")).Count  
$newWarnCount = ([regex]::Matches($newContent, "console\.warn\(")).Count
$newErrorCount = ([regex]::Matches($newContent, "console\.error\(")).Count

Write-Host "`nAfter replacement:" -ForegroundColor Yellow
Write-Host "  - console.log: $newLogCount" -ForegroundColor $(if($newLogCount -eq 0){'Green'}else{'Red'})
Write-Host "  - console.warn: $newWarnCount" -ForegroundColor $(if($newWarnCount -eq 0){'Green'}else{'Red'})
Write-Host "  - console.error: $newErrorCount" -ForegroundColor $(if($newErrorCount -eq 0){'Green'}else{'Red'})

if ($newLogCount + $newWarnCount + $newErrorCount -eq 0) {
    Write-Host "`n✅ All console calls replaced!" -ForegroundColor Green
} else {
    Write-Warning "Some console calls remain (may be in comments or intentional)"
}
