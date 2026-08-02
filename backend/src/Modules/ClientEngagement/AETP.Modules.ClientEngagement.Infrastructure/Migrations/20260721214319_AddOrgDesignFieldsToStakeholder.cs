using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgDesignFieldsToStakeholder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HierarchyLevel",
                schema: "engagement",
                table: "Stakeholders",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Position",
                schema: "engagement",
                table: "Stakeholders",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplicaTo",
                schema: "engagement",
                table: "Stakeholders",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReportsTo",
                schema: "engagement",
                table: "Stakeholders",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Responsibilities",
                schema: "engagement",
                table: "Stakeholders",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HierarchyLevel",
                schema: "engagement",
                table: "Stakeholders");

            migrationBuilder.DropColumn(
                name: "Position",
                schema: "engagement",
                table: "Stakeholders");

            migrationBuilder.DropColumn(
                name: "ReplicaTo",
                schema: "engagement",
                table: "Stakeholders");

            migrationBuilder.DropColumn(
                name: "ReportsTo",
                schema: "engagement",
                table: "Stakeholders");

            migrationBuilder.DropColumn(
                name: "Responsibilities",
                schema: "engagement",
                table: "Stakeholders");
        }
    }
}
