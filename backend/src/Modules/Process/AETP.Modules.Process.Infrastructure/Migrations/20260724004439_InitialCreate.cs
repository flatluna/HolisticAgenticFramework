using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "process");

            migrationBuilder.CreateTable(
                name: "BusinessProcesses",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CapabilityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Owner = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsDocumented = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "No"),
                    IsFormalized = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "No"),
                    CurrentAutonomyLevel = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "L0"),
                    Criticality = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Media"),
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
                    table.PrimaryKey("PK_BusinessProcesses", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessProcesses_CapabilityId",
                schema: "process",
                table: "BusinessProcesses",
                column: "CapabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessProcesses_CapabilityId_Name",
                schema: "process",
                table: "BusinessProcesses",
                columns: new[] { "CapabilityId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessProcesses",
                schema: "process");
        }
    }
}
