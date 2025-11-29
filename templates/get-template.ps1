# Copilot Template Helper Script
# Quick access to conversation templates

# Function to extract template content (everything before <!-- END TEMPLATE -->)
function Get-TemplateSnippet {
    param (
        [string]$TemplatePath
    )
    
    $content = Get-Content $TemplatePath -Raw
    
    # Find the delimiter
    $delimiter = '<!-- END TEMPLATE -->'
    $delimiterIndex = $content.IndexOf($delimiter)
    
    if ($delimiterIndex -eq -1) {
        # No delimiter found, return entire file
        Write-Host "Warning: No delimiter found in $TemplatePath, returning entire file" -ForegroundColor Yellow
        return $content
    }
    
    # Return everything before the delimiter
    return $content.Substring(0, $delimiterIndex).TrimEnd()
}

Write-Host '==================================' -ForegroundColor Cyan
Write-Host '  Copilot Template Helper' -ForegroundColor Cyan
Write-Host '==================================' -ForegroundColor Cyan
Write-Host ''

$templatesPath = 'C:\code\uncharted-lands\client\templates'

# Menu
Write-Host 'Available Templates:' -ForegroundColor Yellow
Write-Host ''
Write-Host '  [1] Session Start' -ForegroundColor Green
Write-Host '      Start a new coding session' -ForegroundColor Gray
Write-Host ''
Write-Host '  [2] Feature Implementation' -ForegroundColor Green
Write-Host '      Implement new features from GDD' -ForegroundColor Gray
Write-Host ''
Write-Host '  [3] Bug Fix' -ForegroundColor Green
Write-Host '      Fix bugs or debug issues' -ForegroundColor Gray
Write-Host ''
Write-Host '  [4] Design Decision' -ForegroundColor Green
Write-Host '      Make architectural decisions' -ForegroundColor Gray
Write-Host ''
Write-Host '  [5] Code Review' -ForegroundColor Green
Write-Host '      Review code or pull requests' -ForegroundColor Gray
Write-Host ''
Write-Host '  [6] Artifact Decision' -ForegroundColor Green
Write-Host '      Decide when to create artifacts' -ForegroundColor Gray
Write-Host ''
Write-Host '  [7] View README' -ForegroundColor Green
Write-Host '      How to use templates' -ForegroundColor Gray
Write-Host ''
Write-Host '  [Q] Quit' -ForegroundColor Red
Write-Host ''

$choice = Read-Host 'Select template (1-7, Q to quit)'

switch ($choice) {
    '1' {
        $snippet = Get-TemplateSnippet (Join-Path $templatesPath 'SESSION-START.md')
        $snippet | Set-Clipboard
        Write-Host ''
        Write-Host '✓ Session Start template snippet copied to clipboard!' -ForegroundColor Green
        Write-Host '  (Beginning + Example only - full template available in file)' -ForegroundColor Gray
    }
    '2' {
        $snippet = Get-TemplateSnippet (Join-Path $templatesPath 'FEATURE-IMPLEMENTATION.md')
        $snippet | Set-Clipboard
        Write-Host ''
        Write-Host '✓ Feature Implementation template snippet copied to clipboard!' -ForegroundColor Green
        Write-Host '  (Beginning + Example only - full template available in file)' -ForegroundColor Gray
    }
    '3' {
        $snippet = Get-TemplateSnippet (Join-Path $templatesPath 'BUG-FIX.md')
        $snippet | Set-Clipboard
        Write-Host ''
        Write-Host '✓ Bug Fix template snippet copied to clipboard!' -ForegroundColor Green
        Write-Host '  (Beginning + Example only - full template available in file)' -ForegroundColor Gray
    }
    '4' {
        $snippet = Get-TemplateSnippet (Join-Path $templatesPath 'DESIGN-DECISION.md')
        $snippet | Set-Clipboard
        Write-Host ''
        Write-Host '✓ Design Decision template snippet copied to clipboard!' -ForegroundColor Green
        Write-Host '  (Beginning + Example only - full template available in file)' -ForegroundColor Gray
    }
    '5' {
        $snippet = Get-TemplateSnippet (Join-Path $templatesPath 'CODE-REVIEW.md')
        $snippet | Set-Clipboard
        Write-Host ''
        Write-Host '✓ Code Review template snippet copied to clipboard!' -ForegroundColor Green
        Write-Host '  (Beginning + Example only - full template available in file)' -ForegroundColor Gray
    }
    '6' {
        $snippet = Get-TemplateSnippet (Join-Path $templatesPath 'ARTIFACT-DECISION.md')
        $snippet | Set-Clipboard
        Write-Host ''
        Write-Host '✓ Artifact Decision template snippet copied to clipboard!' -ForegroundColor Green
        Write-Host '  (Beginning + Example only - full template available in file)' -ForegroundColor Gray
    }
    '7' {
        Write-Host ''
        Write-Host 'Opening README...' -ForegroundColor Yellow
        code (Join-Path $templatesPath 'README.md')
    }
    'Q' {
        Write-Host ''
        Write-Host 'Goodbye!' -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host ''
        Write-Host '✗ Invalid choice. Please run the script again.' -ForegroundColor Red
    }
}

Write-Host ''
Write-Host '==================================' -ForegroundColor Cyan
Write-Host ''

# Optional: Ask if user wants to see the template
$view = Read-Host 'Preview template in VS Code? (y/n)'
if ($view -eq 'y' -or $view -eq 'Y') {
    switch ($choice) {
        '1' { code (Join-Path $templatesPath 'SESSION-START.md') }
        '2' { code (Join-Path $templatesPath 'FEATURE-IMPLEMENTATION.md') }
        '3' { code (Join-Path $templatesPath 'BUG-FIX.md') }
        '4' { code (Join-Path $templatesPath 'DESIGN-DECISION.md') }
        '5' { code (Join-Path $templatesPath 'CODE-REVIEW.md') }
        '6' { code (Join-Path $templatesPath 'ARTIFACT-DECISION.md') }
    }
}
