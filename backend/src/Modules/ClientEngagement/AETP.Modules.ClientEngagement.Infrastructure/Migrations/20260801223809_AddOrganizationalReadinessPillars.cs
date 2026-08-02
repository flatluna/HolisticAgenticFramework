using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationalReadinessPillars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: `dotnet ef migrations add` originally generated a much
            // larger diff here (Engagement columns + MandateStakeholders +
            // StrategicListItems tables) because those were previously
            // applied to the real DB via raw SQL scripts
            // (sql_migration_engagement.sql / sql_migration_mission_vision_structured.sql)
            // instead of EF migrations, so they weren't in migration
            // history. Trimmed down to only the actually-new table for this
            // change to avoid re-applying already-existing schema.
            migrationBuilder.CreateTable(
                name: "OrganizationalReadinessPillars",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PillarId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Level = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CheckedEvidenceIdsCsv = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationalReadinessPillars", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationalReadinessPillars_EngagementId_PillarId",
                schema: "engagement",
                table: "OrganizationalReadinessPillars",
                columns: new[] { "EngagementId", "PillarId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrganizationalReadinessPillars",
                schema: "engagement");
        }
    }
}
