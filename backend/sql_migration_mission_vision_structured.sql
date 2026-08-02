IF COL_LENGTH('engagement.Engagements', 'StrategyTitle') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [StrategyTitle] NVARCHAR(300) NULL;

IF COL_LENGTH('engagement.Engagements', 'StrategyCompanyName') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [StrategyCompanyName] NVARCHAR(256) NULL;

IF COL_LENGTH('engagement.Engagements', 'StrategySector') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [StrategySector] NVARCHAR(256) NULL;

IF COL_LENGTH('engagement.Engagements', 'StrategyDirectionGeneral') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [StrategyDirectionGeneral] NVARCHAR(3000) NULL;

IF COL_LENGTH('engagement.Engagements', 'VisionObjetivo') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [VisionObjetivo] NVARCHAR(3000) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetAtencionClientePct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetAtencionClientePct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetFinanzasPct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetFinanzasPct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetRecursosHumanosPct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetRecursosHumanosPct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetMarketingPct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetMarketingPct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetVentasPct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetVentasPct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetOperacionesPct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetOperacionesPct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'AutoTargetAnaliticaReportesPct') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [AutoTargetAnaliticaReportesPct] DECIMAL(5,2) NULL;

IF COL_LENGTH('engagement.Engagements', 'StrategicFinalDeclaration') IS NULL
    ALTER TABLE [engagement].[Engagements] ADD [StrategicFinalDeclaration] NVARCHAR(3000) NULL;

IF OBJECT_ID('engagement.StrategicListItems', 'U') IS NULL
BEGIN
    CREATE TABLE [engagement].[StrategicListItems]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [EngagementId] UNIQUEIDENTIFIER NOT NULL,
        [Category] NVARCHAR(100) NOT NULL,
        [Value] NVARCHAR(1000) NOT NULL,
        [DisplayOrder] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [FK_StrategicListItems_Engagements_EngagementId]
            FOREIGN KEY ([EngagementId]) REFERENCES [engagement].[Engagements]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_StrategicListItems_EngagementId]
        ON [engagement].[StrategicListItems]([EngagementId]);

    CREATE INDEX [IX_StrategicListItems_EngagementId_Category_DisplayOrder]
        ON [engagement].[StrategicListItems]([EngagementId], [Category], [DisplayOrder]);
END;
