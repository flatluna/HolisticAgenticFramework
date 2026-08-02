# Run all tests (unit, integration, architecture)
# Usage: .\run-all-tests.ps1 [-Coverage] [-FailFast]

param(
    [switch]$Coverage = $false,
    [switch]$FailFast = $false
)

Write-Host "=== AETP Test Suite ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

Push-Location backend

Write-Host "`n[1/3] Running unit tests..." -ForegroundColor Yellow
$unitTestArgs = "test --filter Category=Unit"
if ($FailFast) { $unitTestArgs += " --fail-on-no-tests-found" }
dotnet $unitTestArgs
Write-Host "✓ Unit tests completed" -ForegroundColor Green

Write-Host "`n[2/3] Running integration tests..." -ForegroundColor Yellow
$integrationTestArgs = "test --filter Category=Integration"
if ($FailFast) { $integrationTestArgs += " --fail-on-no-tests-found" }
dotnet $integrationTestArgs
Write-Host "✓ Integration tests completed" -ForegroundColor Green

Write-Host "`n[3/3] Running architecture tests..." -ForegroundColor Yellow
$archTestArgs = "test --filter Category=Architecture"
if ($FailFast) { $archTestArgs += " --fail-on-no-tests-found" }
dotnet $archTestArgs
Write-Host "✓ Architecture tests completed" -ForegroundColor Green

if ($Coverage) {
    Write-Host "`n[4/4] Running code coverage analysis..." -ForegroundColor Yellow
    dotnet test /p:CollectCoverage=true /p:CoverageFormat=opencover
    Write-Host "✓ Coverage report generated" -ForegroundColor Green
}

Pop-Location

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
