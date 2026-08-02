using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Capability.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCapabilityModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "capability");

            migrationBuilder.CreateTable(
                name: "BusinessCapabilities",
                schema: "capability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    BusinessDomain = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Owner = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ResponsibleArea = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    RelatedStrategicObjective = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StrategicPriority = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessContribution = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExpectedImpact = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaturityLevel = table.Column<int>(type: "int", nullable: false),
                    PerformanceLevel = table.Column<int>(type: "int", nullable: false),
                    DigitalizationLevel = table.Column<int>(type: "int", nullable: false),
                    MaturityObservations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApplicationsUsed = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Erp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Crm = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssociatedSystems = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApisAvailable = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DataQuality = table.Column<int>(type: "int", nullable: false),
                    DataAvailability = table.Column<int>(type: "int", nullable: false),
                    DataIntegration = table.Column<int>(type: "int", nullable: false),
                    DataGovernanceLevel = table.Column<int>(type: "int", nullable: false),
                    NumberOfPeopleInvolved = table.Column<int>(type: "int", nullable: true),
                    CriticalSkills = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HumanKnowledgeDependency = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AutomationPotentialPercent = table.Column<int>(type: "int", nullable: false),
                    AiAgentPotential = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TargetAutonomyLevel = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "L0"),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Borrador"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessCapabilities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CapabilityFindings",
                schema: "capability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessCapabilityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Severity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Impact = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapabilityFindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CapabilityFindings_BusinessCapabilities_BusinessCapabilityId",
                        column: x => x.BusinessCapabilityId,
                        principalSchema: "capability",
                        principalTable: "BusinessCapabilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CapabilityKpis",
                schema: "capability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessCapabilityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    Target = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapabilityKpis", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CapabilityKpis_BusinessCapabilities_BusinessCapabilityId",
                        column: x => x.BusinessCapabilityId,
                        principalSchema: "capability",
                        principalTable: "BusinessCapabilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CapabilityProcesses",
                schema: "capability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessCapabilityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AutomationLevel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Criticality = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapabilityProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CapabilityProcesses_BusinessCapabilities_BusinessCapabilityId",
                        column: x => x.BusinessCapabilityId,
                        principalSchema: "capability",
                        principalTable: "BusinessCapabilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessCapabilities_EngagementId_Name",
                schema: "capability",
                table: "BusinessCapabilities",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CapabilityFindings_BusinessCapabilityId",
                schema: "capability",
                table: "CapabilityFindings",
                column: "BusinessCapabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_CapabilityKpis_BusinessCapabilityId",
                schema: "capability",
                table: "CapabilityKpis",
                column: "BusinessCapabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_CapabilityProcesses_BusinessCapabilityId",
                schema: "capability",
                table: "CapabilityProcesses",
                column: "BusinessCapabilityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CapabilityFindings",
                schema: "capability");

            migrationBuilder.DropTable(
                name: "CapabilityKpis",
                schema: "capability");

            migrationBuilder.DropTable(
                name: "CapabilityProcesses",
                schema: "capability");

            migrationBuilder.DropTable(
                name: "BusinessCapabilities",
                schema: "capability");
        }
    }
}
