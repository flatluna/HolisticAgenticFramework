#!/usr/bin/env pwsh
# Start Azure Functions locally

$apiDir = "c:\HolisticFrameworkProject\backend\src\Modules\ClientEngagement\AETP.Modules.ClientEngagement.Api"
Set-Location $apiDir

Write-Host "Current directory: $(Get-Location)"
Write-Host "Files in directory:"
Get-Item host.json, local.settings.json 2>/dev/null | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "Starting Azure Functions..."
Write-Host ""

# Start func start
& func start --dotnet-isolated
