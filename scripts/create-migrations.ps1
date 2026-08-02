# Create initial EF Core migrations
# Run this BEFORE applying migrations

param(
    [string]$MigrationName = "Initial"
)

Write-Host "=== AETP Create Migrations ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

Push-Location backend

try {
    Write-Host "`n[1/2] Creating ClientEngagement migration: $MigrationName..." -ForegroundColor Yellow
    dotnet ef migrations add $MigrationName `
        --project src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure/AETP.Modules.ClientEngagement.Infrastructure.csproj `
        --startup-project src/Host/AETP.Api/AETP.Api.csproj `
        --context ClientEngagementDbContext `
        --output-dir Migrations
    Write-Host "✓ ClientEngagement migration created" -ForegroundColor Green

    Write-Host "`n[2/2] Creating Strategy migration: $MigrationName..." -ForegroundColor Yellow
    dotnet ef migrations add $MigrationName `
        --project src/Modules/Strategy/AETP.Modules.Strategy.Infrastructure/AETP.Modules.Strategy.Infrastructure.csproj `
        --startup-project src/Host/AETP.Api/AETP.Api.csproj `
        --context StrategyDbContext `
        --output-dir Migrations
    Write-Host "✓ Strategy migration created" -ForegroundColor Green

    Write-Host "`n=== Migrations Created Successfully ===" -ForegroundColor Cyan
    Write-Host "`nNext step: .\run-migrations.ps1"
}
catch {
    Write-Host "ERROR: Migration creation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
