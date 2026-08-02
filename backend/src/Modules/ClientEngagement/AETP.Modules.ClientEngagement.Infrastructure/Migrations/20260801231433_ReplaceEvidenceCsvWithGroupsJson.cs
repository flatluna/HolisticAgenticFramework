using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceEvidenceCsvWithGroupsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckedEvidenceIdsCsv",
                schema: "engagement",
                table: "OrganizationalReadinessPillars");

            migrationBuilder.AddColumn<string>(
                name: "EvidenceGroupsJson",
                schema: "engagement",
                table: "OrganizationalReadinessPillars",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidenceGroupsJson",
                schema: "engagement",
                table: "OrganizationalReadinessPillars");

            migrationBuilder.AddColumn<string>(
                name: "CheckedEvidenceIdsCsv",
                schema: "engagement",
                table: "OrganizationalReadinessPillars",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
