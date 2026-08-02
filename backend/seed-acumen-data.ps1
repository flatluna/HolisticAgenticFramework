#!/usr/bin/env pwsh

# Script para cargar datos de ACUMEN en la base de datos

# Usa LocalDB para desarrollo
$connectionString = "Server=(localdb)\mssqllocaldb;Database=businessagenticdb;Integrated Security=True;"

Write-Host "Conectando a: $connectionString" -ForegroundColor Cyan

# Verificar si sqlcmd está disponible
$sqlcmdPath = Get-Command sqlcmd -ErrorAction SilentlyContinue

if ($sqlcmdPath) {
    Write-Host "Usando sqlcmd" -ForegroundColor Green
    
    # Crear la base de datos si no existe
    $dbCreateScript = @"
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'businessagenticdb')
BEGIN
    CREATE DATABASE businessagenticdb
    PRINT 'Base de datos creada'
END
ELSE
BEGIN
    PRINT 'Base de datos ya existe'
END
GO

USE businessagenticdb
GO

-- Crear schema si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'engagement')
BEGIN
    EXEC sp_executesql N'CREATE SCHEMA engagement'
    PRINT 'Schema engagement creado'
END
GO

-- Crear tabla ClientOrganizations si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[engagement].[ClientOrganizations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [engagement].[ClientOrganizations] (
        [Id] UNIQUEIDENTIFIER PRIMARY KEY,
        [Name] NVARCHAR(256) NOT NULL UNIQUE,
        [Industry] NVARCHAR(128) NULL,
        [Country] NVARCHAR(128) NULL,
        [Status] NVARCHAR(50) DEFAULT 'Active',
        [CreatedAt] DATETIME2 DEFAULT GETUTCDATE()
    )
    PRINT 'Tabla ClientOrganizations creada'
END
GO

-- Insertar ACUMEN si no existe
IF NOT EXISTS (SELECT 1 FROM [engagement].[ClientOrganizations] WHERE [Name] = 'ACUMEN')
BEGIN
    DECLARE @Id UNIQUEIDENTIFIER = NEWID()
    INSERT INTO [engagement].[ClientOrganizations] ([Id], [Name], [Industry], [Country], [Status])
    VALUES (@Id, 'ACUMEN', 'Consulting', 'USA', 'Active')
    PRINT 'ACUMEN insertado en la BD'
END
ELSE
BEGIN
    PRINT 'ACUMEN ya existe en la BD'
END
GO

-- Verificar los datos
SELECT [Id], [Name], [Industry], [Country], [Status] FROM [engagement].[ClientOrganizations]
GO
"@

    # Guardar el script en un archivo temporal
    $scriptFile = "$env:TEMP\seed_acumen.sql"
    $dbCreateScript | Out-File -FilePath $scriptFile -Encoding UTF8
    
    Write-Host "Script creado en: $scriptFile" -ForegroundColor Yellow
    
    # Ejecutar el script
    Write-Host "Ejecutando script de inicialización..." -ForegroundColor Yellow
    & sqlcmd -S "(localdb)\mssqllocaldb" -i $scriptFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Datos de ACUMEN cargados exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al cargar los datos" -ForegroundColor Red
    }
    
    # Limpiar
    Remove-Item -Path $scriptFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "sqlcmd no está disponible. Intenta instalar SQL Server Management Tools o usar SQL Server Express." -ForegroundColor Red
    Write-Host "Alternativa: Ejecuta las siguientes líneas manualmente en SQL Server Management Studio:" -ForegroundColor Yellow
    Write-Host "---" -ForegroundColor Gray
    Write-Host $dbCreateScript -ForegroundColor Gray
    Write-Host "---" -ForegroundColor Gray
}
