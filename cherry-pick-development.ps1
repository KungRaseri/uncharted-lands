# Cherry-pick valuable commits from development into upgrade-2025
# Run this from the upgrade-2025 branch

Write-Host "🍒 Cherry-Picking Development Commits" -ForegroundColor Cyan
Write-Host ""

# Ensure we're on upgrade-2025
$currentBranch = git branch --show-current
if ($currentBranch -ne "upgrade-2025") {
    Write-Host "❌ Error: You must be on upgrade-2025 branch" -ForegroundColor Red
    Write-Host "   Run: git checkout upgrade-2025" -ForegroundColor Yellow
    exit 1
}

# Ensure working directory is clean
$status = git status --porcelain
if ($status) {
    Write-Host "❌ Error: Working directory not clean" -ForegroundColor Red
    Write-Host "   Commit or stash your changes first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ On upgrade-2025 branch with clean working directory" -ForegroundColor Green
Write-Host ""

# Landing page improvements
$landingPageCommits = @(
    @{hash="61cf210"; desc="UI changes to main landing page"},
    @{hash="983e80a"; desc="Landing page layout updates"},
    @{hash="b641a6d"; desc="Added padding and margins"},
    @{hash="9530310"; desc="Fixed incorrect GitHub link in footer"},
    @{hash="18618f6"; desc="Additional layout and styling edits"},
    @{hash="38b8dd8"; desc="UI improvements"},
    @{hash="1e3e862"; desc="Fixed landing page media breaks"}
)

# Admin improvements
$adminCommits = @(
    @{hash="cdd44c6"; desc="Clean up worlds admin page"},
    @{hash="53cf151"; desc="Getting-started + game view updates"},
    @{hash="869e20b"; desc="Admin area work"}
)

# Bug fixes
$bugfixCommits = @(
    @{hash="a106960"; desc="Removal of unnecessary async/awaits"}
)

function Cherry-Pick-Commits {
    param (
        [string]$category,
        [array]$commits
    )
    
    Write-Host "📦 $category" -ForegroundColor Magenta
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    foreach ($commit in $commits) {
        Write-Host ""
        Write-Host "  Attempting: $($commit.hash) - $($commit.desc)" -ForegroundColor Yellow
        
        $result = git cherry-pick $commit.hash 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Success" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Conflict detected!" -ForegroundColor Red
            Write-Host ""
            Write-Host "  Options:" -ForegroundColor Cyan
            Write-Host "    1. Resolve conflicts manually and run: git cherry-pick --continue" -ForegroundColor White
            Write-Host "    2. Skip this commit: git cherry-pick --skip" -ForegroundColor White
            Write-Host "    3. Abort: git cherry-pick --abort" -ForegroundColor White
            Write-Host ""
            
            $choice = Read-Host "  [C]ontinue after resolving, [S]kip, or [A]bort? (C/S/A)"
            
            switch ($choice.ToUpper()) {
                "C" {
                    Write-Host "  Waiting for you to resolve conflicts..." -ForegroundColor Yellow
                    Read-Host "  Press Enter when conflicts are resolved and staged"
                    git cherry-pick --continue
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  ✅ Resolved and continued" -ForegroundColor Green
                    }
                }
                "S" {
                    git cherry-pick --skip
                    Write-Host "  ⏭️  Skipped" -ForegroundColor Yellow
                }
                "A" {
                    git cherry-pick --abort
                    Write-Host "  ❌ Aborted cherry-pick process" -ForegroundColor Red
                    exit 1
                }
            }
        }
    }
    
    Write-Host ""
}

# Execute cherry-picks
Write-Host "Starting cherry-pick process..." -ForegroundColor Cyan
Write-Host ""

Cherry-Pick-Commits "Landing Page Improvements (High Priority)" $landingPageCommits
Cherry-Pick-Commits "Admin Improvements (Medium Priority)" $adminCommits  
Cherry-Pick-Commits "Bug Fixes (Low Priority)" $bugfixCommits

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "🎉 Cherry-pick process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git log --oneline -20" -ForegroundColor White
Write-Host "  2. Test the application: npm run dev" -ForegroundColor White
Write-Host "  3. Run type check: npm run check" -ForegroundColor White
Write-Host "  4. If all looks good, push: git push origin upgrade-2025" -ForegroundColor White
Write-Host ""
