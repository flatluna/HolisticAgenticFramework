using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGapAnalysisFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Source",
                schema: "process",
                table: "ProcessDocuments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Cliente");

            migrationBuilder.CreateTable(
                name: "ProcessGapFindings",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GapCategory = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IdentifiedBy = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RecommendedAction = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessGapFindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessGapFindings_ProcessActivities_ActivityId",
                        column: x => x.ActivityId,
                        principalSchema: "process",
                        principalTable: "ProcessActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessGapFindings_ActivityId",
                schema: "process",
                table: "ProcessGapFindings",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessGapFindings_Severity",
                schema: "process",
                table: "ProcessGapFindings",
                column: "Severity");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessGapFindings",
                schema: "process");

            migrationBuilder.DropColumn(
                name: "Source",
                schema: "process",
                table: "ProcessDocuments");
        }
    }
}
