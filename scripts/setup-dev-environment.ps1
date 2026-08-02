# Setup Development Environment for AETP
# Run this script to initialize the development environment

param(
    [switch]$SkipNodeModules = $false,
    [switch]$SkipRestore = $false
)

Write-Host "=== AETP Development Environment Setup ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Check if we're in the right directory
if (-not (Test-Path ".\backend\AETP.sln")) {
    Write-Host "ERROR: AETP.sln not found. Run this script from the root directory." -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/5] Checking system requirements..." -ForegroundColor Yellow

# Check .NET
$dotnetVersion = dotnet --version
Write-Host "✓ .NET version: $dotnetVersion" -ForegroundColor Green

# Check Node.js
$nodeVersion = node --version
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm --version
Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green

# Restore backend NuGet packages
if (-not $SkipRestore) {
    Write-Host "`n[2/5] Restoring backend NuGet packages..." -ForegroundColor Yellow
    Push-Location backend
    dotnet restore
    Pop-Location
    Write-Host "✓ Backend packages restored" -ForegroundColor Green
} else {
    Write-Host "`n[2/5] Skipping backend restore..." -ForegroundColor Yellow
}

# Install frontend dependencies
if (-not $SkipNodeModules) {
    Write-Host "`n[3/5] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "`n[3/5] Skipping frontend dependencies..." -ForegroundColor Yellow
}

# Build backend
Write-Host "`n[4/5] Building backend solution..." -ForegroundColor Yellow
Push-Location backend
dotnet build
Pop-Location
Write-Host "✓ Backend built successfully" -ForegroundColor Green

# Create user secrets for local development
Write-Host "`n[5/5] Configuring local development secrets..." -ForegroundColor Yellow
Push-Location backend\src\Host\AETP.Api
dotnet user-secrets init --force
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\mssqllocaldb;Database=AETP_Dev;Integrated Security=true;"
dotnet user-secrets set "AzureAd:TenantId" "YOUR_TENANT_ID"
dotnet user-secrets set "AzureAd:ClientId" "YOUR_CLIENT_ID"
Pop-Location
Write-Host "✓ User secrets configured (update values in user-secrets)" -ForegroundColor Green

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  Backend:  cd backend && dotnet run --project src/Host/AETP.Api/AETP.Api.csproj"
Write-Host "  Frontend: cd frontend && npm run dev"
