# Pruebas CRUD de CompanyProfile con Azure Functions

# Variables
$baseUrl = "http://localhost:7073/api"
$engagementId = "00000000-0000-0000-0000-000000000001"

Write-Host "===== PRUEBAS DE COMPANYPROFILE CRUD =====" -ForegroundColor Cyan

# 1. CREATE CompanyProfile
Write-Host "`n1. POST: Crear CompanyProfile" -ForegroundColor Yellow
$companyProfileBody = @{
    clientOrganizationId = "00000000-0000-0000-0000-000000000002"
    headquartersCity = "New York"
    headquartersCountry = "USA"
    annualRevenue = 1000000
    totalEmployees = 500
    cloudAdoptionScore = 65
    dataMaturityScore = 55
    aiAdoptionScore = 45
} | ConvertTo-Json

$createProfileResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/company-profile" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $companyProfileBody

Write-Host "✅ CompanyProfile creado:" -ForegroundColor Green
Write-Host ($createProfileResponse | ConvertTo-Json) -ForegroundColor DarkGray

# Extract ID for further tests
$profileId = $createProfileResponse.id
Write-Host "Profile ID: $profileId" -ForegroundColor Cyan

# 2. GET CompanyProfile
Write-Host "`n2. GET: Obtener CompanyProfile con Departments y Locations" -ForegroundColor Yellow

$getProfileResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/company-profile" `
    -Method Get

Write-Host "✅ CompanyProfile obtenido:" -ForegroundColor Green
Write-Host ($getProfileResponse | ConvertTo-Json) -ForegroundColor DarkGray

# 3. UPDATE CompanyProfile
Write-Host "`n3. PUT: Actualizar CompanyProfile" -ForegroundColor Yellow

$updateProfileBody = @{
    cloudAdoptionScore = 75
    dataMaturityScore = 65
    aiAdoptionScore = 55
    headquartersCity = "San Francisco"
} | ConvertTo-Json

$updateProfileResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/company-profile/$profileId" `
    -Method Put `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $updateProfileBody

Write-Host "✅ CompanyProfile actualizado:" -ForegroundColor Green
Write-Host ($updateProfileResponse | ConvertTo-Json) -ForegroundColor DarkGray

# 4. ADD Department
Write-Host "`n4. POST: Agregar Department" -ForegroundColor Yellow

$departmentBody = @{
    name = "Engineering"
    description = "Software Development"
    headCount = 150
    leadName = "John Doe"
    leadEmail = "john@example.com"
    annualBudget = 5000000
} | ConvertTo-Json

$addDeptResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/company-profile/$profileId/departments" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $departmentBody

Write-Host "✅ Department agregado:" -ForegroundColor Green
Write-Host ($addDeptResponse | ConvertTo-Json) -ForegroundColor DarkGray

$deptId = $addDeptResponse.id

# 5. UPDATE Department
Write-Host "`n5. PUT: Actualizar Department" -ForegroundColor Yellow

$updateDeptBody = @{
    headCount = 160
    annualBudget = 5500000
} | ConvertTo-Json

$updateDeptResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/departments/$deptId" `
    -Method Put `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $updateDeptBody

Write-Host "✅ Department actualizado:" -ForegroundColor Green
Write-Host ($updateDeptResponse | ConvertTo-Json) -ForegroundColor DarkGray

# 6. ADD Location
Write-Host "`n6. POST: Agregar Location" -ForegroundColor Yellow

$locationBody = @{
    city = "New York"
    country = "USA"
    office = "HQ"
    headcount = 300
    isHeadquarters = $true
} | ConvertTo-Json

$addLocationResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/company-profile/$profileId/locations" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $locationBody

Write-Host "✅ Location agregado:" -ForegroundColor Green
Write-Host ($addLocationResponse | ConvertTo-Json) -ForegroundColor DarkGray

$locationId = $addLocationResponse.id

# 7. UPDATE Location
Write-Host "`n7. PUT: Actualizar Location" -ForegroundColor Yellow

$updateLocationBody = @{
    headcount = 350
} | ConvertTo-Json

$updateLocationResponse = Invoke-RestMethod -Uri "$baseUrl/engagementId/locations/$locationId" `
    -Method Put `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $updateLocationBody

Write-Host "✅ Location actualizado:" -ForegroundColor Green
Write-Host ($updateLocationResponse | ConvertTo-Json) -ForegroundColor DarkGray

# 8. GET CompanyProfile again (should show all related entities)
Write-Host "`n8. GET: Obtener CompanyProfile completo (con Departments y Locations)" -ForegroundColor Yellow

$getFullResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/company-profile" `
    -Method Get

Write-Host "✅ CompanyProfile completo:" -ForegroundColor Green
Write-Host ($getFullResponse | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
Write-Host "Departments: $($getFullResponse.departments.Count)" -ForegroundColor Cyan
Write-Host "Locations: $($getFullResponse.locations.Count)" -ForegroundColor Cyan

# 9. DELETE Department
Write-Host "`n9. DELETE: Eliminar Department" -ForegroundColor Yellow

$deleteDeptResponse = Invoke-RestMethod -Uri "$baseUrl/engagements/$engagementId/departments/$deptId" `
    -Method Delete

Write-Host "✅ Department eliminado" -ForegroundColor Green

# 10. DELETE Location
Write-Host "`n10. DELETE: Eliminar Location" -ForegroundColor Yellow

$deleteLocationResponse = Invoke-RestMethod -Uri "$baseUrl/engagementId/locations/$locationId" `
    -Method Delete

Write-Host "✅ Location eliminado" -ForegroundColor Green

Write-Host "`n===== PRUEBAS COMPLETADAS =====" -ForegroundColor Cyan
