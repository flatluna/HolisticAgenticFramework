using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDomainDiscovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DomainAssessments",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DomainId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BusinessContext = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ProcessInventoryJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SystemsInventoryJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StrategicValue = table.Column<int>(type: "int", nullable: true),
                    TransformPotential = table.Column<int>(type: "int", nullable: true),
                    Roi = table.Column<int>(type: "int", nullable: true),
                    Complexity = table.Column<int>(type: "int", nullable: true),
                    Urgency = table.Column<int>(type: "int", nullable: true),
                    ComplexityAdjustmentOverride = table.Column<int>(type: "int", nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DomainAssessments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DomainDiscoverySettings",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SelectedIndustryId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DomainDiscoverySettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DomainAssessments_EngagementId_DomainId",
                schema: "engagement",
                table: "DomainAssessments",
                columns: new[] { "EngagementId", "DomainId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DomainDiscoverySettings_EngagementId",
                schema: "engagement",
                table: "DomainDiscoverySettings",
                column: "EngagementId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DomainAssessments",
                schema: "engagement");

            migrationBuilder.DropTable(
                name: "DomainDiscoverySettings",
                schema: "engagement");
        }
    }
}
