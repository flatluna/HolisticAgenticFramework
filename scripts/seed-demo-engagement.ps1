# Seed demo engagement data for local testing
# Creates sample data for Workspace 1 demonstration

Write-Host "=== AETP Seed Demo Engagement ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

Push-Location backend

try {
    Write-Host "`nSeeding demo data into businessagenticdb..." -ForegroundColor Yellow

    # Note: EF Core doesn't support seeding via CLI directly
    # This would normally be done via a custom console app or within OnModelCreating
    # For now, we'll document the manual SQL approach

    Write-Host "`n⚠️  Manual SQL Seed Required:" -ForegroundColor Yellow
    Write-Host "`nExecute these SQL commands in businessagenticdb:`n" -ForegroundColor Yellow

    $sql = @"
-- Insert Client Organization
INSERT INTO [engagement].[ClientOrganizations] (Id, EngagementId, Name, Industry, Country, Status, CreatedAt, UpdatedAt)
VALUES (NEWID(), CAST('00000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), 'Acme Corp', 'Technology', 'USA', 'Active', GETUTCDATE(), NULL);

-- Get the Client ID for next insert (query it)
-- Then Insert Engagement
INSERT INTO [engagement].[Engagements] (Id, EngagementId, ClientOrganizationId, Name, Description, StartDate, EndDate, Status, Budget, CreatedAt, UpdatedAt)
SELECT NEWID(), NEWID(), Id, 'Digital Transformation Initiative', 'Platform modernization and AI integration', GETUTCDATE(), NULL, 'Planning', 500000, GETUTCDATE(), NULL
FROM [engagement].[ClientOrganizations] WHERE Name = 'Acme Corp';

-- Insert Strategy
INSERT INTO [strategy].[Strategies] (Id, EngagementId, Name, Vision, CompetitiveAdvantage, Status, TimeHorizonMonths, CreatedAt, UpdatedAt)
SELECT NEWID(), EngagementId, 'Cloud-First Digital Transformation', 'Become an AI-driven enterprise', 'Integrated AI + Process Automation', 'Draft', 12, GETUTCDATE(), NULL
FROM [engagement].[Engagements] WHERE Name = 'Digital Transformation Initiative';

-- Insert Objective
INSERT INTO [strategy].[Objectives] (Id, EngagementId, StrategyId, Name, Description, Status, TargetValue, TargetDate, CreatedAt, UpdatedAt)
SELECT NEWID(), e.EngagementId, s.Id, 'Increase operational efficiency by 30%', 'Reduce manual processes via automation', 'Draft', 30, DATEADD(MONTH, 12, GETUTCDATE()), GETUTCDATE(), NULL
FROM [engagement].[Engagements] e
CROSS JOIN [strategy].[Strategies] s
WHERE e.Name = 'Digital Transformation Initiative' AND s.Name = 'Cloud-First Digital Transformation';

-- Insert KPI
INSERT INTO [strategy].[KPIs] (Id, EngagementId, ObjectiveId, Name, Unit, BaselineValue, TargetValue, Frequency, CreatedAt, UpdatedAt)
SELECT NEWID(), o.EngagementId, o.Id, 'Process Automation Rate', 'Percentage', 10, 40, 'Monthly', GETUTCDATE(), NULL
FROM [strategy].[Objectives] o
WHERE o.Name = 'Increase operational efficiency by 30%';
"@

    Write-Host $sql -ForegroundColor Cyan
    Write-Host "`n✓ Demo data SQL script ready to execute" -ForegroundColor Green
    Write-Host "`nTo apply this data:`n" -ForegroundColor Yellow
    Write-Host "  1. Connect to Azure SQL: flatsqlserver.database.windows.net / businessagenticdb"
    Write-Host "  2. Run the SQL script above"
    Write-Host "  3. Verify with: SELECT * FROM [engagement].[ClientOrganizations]`n" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: Seeding failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
