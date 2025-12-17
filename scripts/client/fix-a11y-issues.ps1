# Fix A11y Issues Script

Write-Host "Fixing Accessibility Issues..." -ForegroundColor Green

# Fix labels without associated controls - convert display labels to divs
$files = @(
    "src\routes\(protected)\admin\players\[id]\+page.svelte",
    "src\routes\(protected)\admin\plots\[id]\+page.svelte"
)

foreach ($file in $files) {
    Write-Host "Processing: $file" -ForegroundColor Yellow
    $content = Get-Content $file -Raw
    
    # Replace labels that are just for display (not form inputs) with divs with appropriate styling
    $content = $content -replace '<label class="text-sm text-surface-600 dark:text-surface-400">([^<]+)</label>', '<div class="text-sm text-surface-600 dark:text-surface-400 font-semibold">$1</div>'
    
    Set-Content $file $content -NoNewline
}

# Fix modal accessibility issues in worlds page
$worldsPage = "src\routes\(protected)\admin\worlds\+page.svelte"
Write-Host "Fixing modal accessibility in: $worldsPage" -ForegroundColor Yellow

$content = Get-Content $worldsPage -Raw
$content = $content -replace '<div class="modal-backdrop" onclick=\{closeDeleteModal\}>', @'
<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeDeleteModal} role="presentation">
'@

$content = $content -replace '<div class="modal preset-filled-surface-50-950 w-full max-w-md" onclick=\{\(e\) => e\.stopPropagation\(\)\}>', @'
<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal preset-filled-surface-50-950 w-full max-w-md" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
'@

Set-Content $worldsPage $content -NoNewline

# Fix modal accessibility issues in settlements page
$settlementsPage = "src\routes\(protected)\game\settlements\[id]\+page.svelte"
Write-Host "Fixing modal accessibility in: $settlementsPage" -ForegroundColor Yellow

$content = Get-Content $settlementsPage -Raw
$content = $content -replace '<div class="modal-backdrop" onclick=\{closeBuildModal\}>', @'
<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeBuildModal} role="presentation">
'@

$content = $content -replace '<div class="modal preset-filled-surface-50-950 w-full max-w-6xl max-h-\[90vh\] overflow-hidden flex flex-col" onclick=\{\(e\) => e\.stopPropagation\(\)\}>', @'
<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal preset-filled-surface-50-950 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
'@

Set-Content $settlementsPage $content -NoNewline

Write-Host "`nA11y fixes applied successfully!" -ForegroundColor Green
