using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Capability.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyCapabilityModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CapabilityFindings",
                schema: "capability");

            migrationBuilder.DropTable(
                name: "CapabilityProcesses",
                schema: "capability");

            migrationBuilder.DropColumn(
                name: "ApisAvailable",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "ApplicationsUsed",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "AssociatedSystems",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "CriticalSkills",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "Crm",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "DataAvailability",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "DataGovernanceLevel",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "DataIntegration",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "DataQuality",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "Erp",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "HumanKnowledgeDependency",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "MaturityObservations",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "NumberOfPeopleInvolved",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.AddColumn<string>(
                name: "MainOpportunities",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MainProblems",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observations",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MainOpportunities",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "MainProblems",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.DropColumn(
                name: "Observations",
                schema: "capability",
                table: "BusinessCapabilities");

            migrationBuilder.AddColumn<string>(
                name: "ApisAvailable",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApplicationsUsed",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssociatedSystems",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CriticalSkills",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Crm",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DataAvailability",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DataGovernanceLevel",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DataIntegration",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DataQuality",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Erp",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HumanKnowledgeDependency",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaturityObservations",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumberOfPeopleInvolved",
                schema: "capability",
                table: "BusinessCapabilities",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CapabilityFindings",
                schema: "capability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessCapabilityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Impact = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Severity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
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
                name: "CapabilityProcesses",
                schema: "capability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AutomationLevel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BusinessCapabilityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Criticality = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
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
                name: "IX_CapabilityFindings_BusinessCapabilityId",
                schema: "capability",
                table: "CapabilityFindings",
                column: "BusinessCapabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_CapabilityProcesses_BusinessCapabilityId",
                schema: "capability",
                table: "CapabilityProcesses",
                column: "BusinessCapabilityId");
        }
    }
}
