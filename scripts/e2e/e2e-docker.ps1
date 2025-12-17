# E2E Testing with Docker Compose
# ==================================
# Automated scripts for running E2E tests with full Docker environment

# Start E2E environment
function Start-E2EEnvironment {
    Write-Host "🚀 Starting E2E environment..." -ForegroundColor Cyan
    
    # Build and start all services
    docker-compose -f docker-compose.e2e.yml up -d --build
    
    # Wait for services to be healthy
    Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check health status
    $serverHealth = docker inspect --format='{{.State.Health.Status}}' uncharted-server-test 2>$null
    $clientHealth = docker inspect --format='{{.State.Health.Status}}' uncharted-client-test 2>$null
    
    Write-Host "Server health: $serverHealth" -ForegroundColor $(if ($serverHealth -eq 'healthy') { 'Green' } else { 'Red' })
    Write-Host "Client health: $clientHealth" -ForegroundColor $(if ($clientHealth -eq 'Green') { 'Green' } else { 'Red' })
    
    if ($serverHealth -eq 'healthy' -and $clientHealth -eq 'healthy') {
        Write-Host "✅ E2E environment is ready!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services available at:" -ForegroundColor Cyan
        Write-Host "  - Client: http://localhost:3000" -ForegroundColor White
        Write-Host "  - Server API: http://localhost:3001" -ForegroundColor White
        Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
        return $true
    } else {
        Write-Host "❌ Services not healthy yet. Check logs with:" -ForegroundColor Red
        Write-Host "  docker-compose -f docker-compose.e2e.yml logs -f" -ForegroundColor Yellow
        return $false
    }
}

# Stop E2E environment
function Stop-E2EEnvironment {
    Write-Host "🛑 Stopping E2E environment..." -ForegroundColor Cyan
    docker-compose -f docker-compose.e2e.yml down
    Write-Host "✅ E2E environment stopped" -ForegroundColor Green
}

# View logs
function Show-E2ELogs {
    param(
        [string]$Service = ""
    )
    
    if ($Service) {
        docker-compose -f docker-compose.e2e.yml logs -f $Service
    } else {
        docker-compose -f docker-compose.e2e.yml logs -f
    }
}

# Run E2E tests with Docker
function Run-E2ETests {
    param(
        [string]$TestFile = "",
        [switch]$Headed = $false,
        [switch]$Debug = $false
    )
    
    Write-Host "🧪 Running E2E tests..." -ForegroundColor Cyan
    
    # Set environment variables
    $env:SKIP_SERVERS = "1"  # Don't start servers (Docker is running them)
    
    # Build test command
    $testCmd = "npm run test:e2e"
    
    if ($TestFile) {
        $testCmd += " -- $TestFile"
    }
    
    if ($Headed) {
        $testCmd += " --headed"
    }
    
    if ($Debug) {
        $testCmd += " --debug"
    }
    
    # Run tests
    Push-Location client
    Invoke-Expression $testCmd
    Pop-Location
    
    # Clean up environment variable
    Remove-Item Env:\SKIP_SERVERS -ErrorAction SilentlyContinue
}

# Full E2E test workflow
function Test-E2E {
    param(
        [string]$TestFile = "",
        [switch]$Headed = $false,
        [switch]$Debug = $false,
        [switch]$KeepRunning = $false
    )
    
    Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Uncharted Lands - E2E Test Suite" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Start environment
    $started = Start-E2EEnvironment
    
    if (-not $started) {
        Write-Host "❌ Failed to start E2E environment" -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Wait a bit more for database migrations
    Write-Host "⏳ Waiting for database migrations..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Run tests
    Run-E2ETests -TestFile $TestFile -Headed:$Headed -Debug:$Debug
    
    # Stop environment unless KeepRunning is set
    if (-not $KeepRunning) {
        Write-Host ""
        Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
        Stop-E2EEnvironment
    } else {
        Write-Host ""
        Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "✅ E2E environment still running" -ForegroundColor Green
        Write-Host "   Stop with: Stop-E2EEnvironment" -ForegroundColor Yellow
    }
}

# Export functions
Export-ModuleMember -Function Start-E2EEnvironment, Stop-E2EEnvironment, Show-E2ELogs, Run-E2ETests, Test-E2E

# Display usage instructions
Write-Host ""
Write-Host "E2E Testing Functions Loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  Start-E2EEnvironment           - Start Docker services" -ForegroundColor White
Write-Host "  Stop-E2EEnvironment            - Stop Docker services" -ForegroundColor White
Write-Host "  Show-E2ELogs [-Service name]   - View logs" -ForegroundColor White
Write-Host "  Run-E2ETests [-TestFile path]  - Run tests (env must be running)" -ForegroundColor White
Write-Host "  Test-E2E [-TestFile path]      - Full workflow (start, test, stop)" -ForegroundColor White
Write-Host ""
Write-Host "Examples:" -ForegroundColor Cyan
Write-Host "  Test-E2E                                          # Run all tests" -ForegroundColor Yellow
Write-Host "  Test-E2E -TestFile tests/e2e/resources.spec.ts   # Run specific test" -ForegroundColor Yellow
Write-Host "  Test-E2E -Headed                                  # Run with browser visible" -ForegroundColor Yellow
Write-Host "  Test-E2E -KeepRunning                             # Don't stop after tests" -ForegroundColor Yellow
Write-Host ""
