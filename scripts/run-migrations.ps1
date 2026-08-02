# Run database migrations for AETP modules
# This script applies pending EF Core migrations

param(
    [string]$Environment = "Development",
    [string]$ConnectionString = $null
)

Write-Host "=== AETP Database Migrations ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

Push-Location backend

Write-Host "Environment: $Environment" -ForegroundColor Yellow

try {
    Write-Host "`n[1/2] Applying ClientEngagement migrations..." -ForegroundColor Yellow
    dotnet ef database update `
        --project src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure/AETP.Modules.ClientEngagement.Infrastructure.csproj `
        --startup-project src/Host/AETP.Api/AETP.Api.csproj `
        --context ClientEngagementDbContext
    Write-Host "✓ ClientEngagement migrations applied" -ForegroundColor Green

    Write-Host "`n[2/2] Applying Strategy migrations..." -ForegroundColor Yellow
    dotnet ef database update `
        --project src/Modules/Strategy/AETP.Modules.Strategy.Infrastructure/AETP.Modules.Strategy.Infrastructure.csproj `
        --startup-project src/Host/AETP.Api/AETP.Api.csproj `
        --context StrategyDbContext
    Write-Host "✓ Strategy migrations applied" -ForegroundColor Green

    Write-Host "`n=== All Migrations Applied Successfully ===" -ForegroundColor Cyan
}
catch {
    Write-Host "ERROR: Migration failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
