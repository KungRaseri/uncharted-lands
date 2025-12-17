# Start Server for E2E Testing
# This script is called by Playwright to start the backend server
# It handles the directory change properly on Windows

$ErrorActionPreference = "Stop"

# Get the repository root (two levels up from scripts/)
$repoRoot = Split-Path -Parent $PSScriptRoot
$serverPath = Join-Path $repoRoot "server"

# Change to server directory
Set-Location $serverPath

# Set E2E environment variables for fast testing
# These match the docker-compose.e2e.yml configuration
$env:NODE_ENV = "e2e"
$env:RESOURCE_INTERVAL_SEC = "10"  # Fast resource production (10 seconds instead of 1 hour)
$env:SOCKET_EMIT_INTERVAL_SEC = "1"  # Socket projections every second
$env:POPULATION_INTERVAL_SEC = "10"  # Fast population updates (10 seconds instead of 30 minutes)
$env:LOG_LEVEL = "debug"  # Enable debug logging for E2E troubleshooting

Write-Host "Starting server with E2E configuration:" -ForegroundColor Green
Write-Host "  NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan
Write-Host "  RESOURCE_INTERVAL_SEC: $env:RESOURCE_INTERVAL_SEC seconds" -ForegroundColor Cyan
Write-Host "  POPULATION_INTERVAL_SEC: $env:POPULATION_INTERVAL_SEC seconds" -ForegroundColor Cyan
Write-Host ""

# Start the development server
# This will block until the server is stopped
npm run dev
