using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Decision.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "decision");

            migrationBuilder.CreateTable(
                name: "BusinessDecisions",
                schema: "decision",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Owner = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DecisionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Operativa"),
                    Frequency = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Mensual"),
                    Complexity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Media"),
                    DecisionMaker = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Humano"),
                    CurrentAutonomyLevel = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "L0"),
                    IsRuleBased = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "No"),
                    RulesDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RulesSource = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataAvailability = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "No"),
                    InputDataUsed = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TargetAutonomyLevel = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "L0"),
                    AutomationPotential = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Media"),
                    AutomationRisk = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    MainProblems = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    MainOpportunities = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Observations = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Borrador"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessDecisions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessDecisions_ProcessId",
                schema: "decision",
                table: "BusinessDecisions",
                column: "ProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessDecisions_ProcessId_Name",
                schema: "decision",
                table: "BusinessDecisions",
                columns: new[] { "ProcessId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessDecisions",
                schema: "decision");
        }
    }
}
