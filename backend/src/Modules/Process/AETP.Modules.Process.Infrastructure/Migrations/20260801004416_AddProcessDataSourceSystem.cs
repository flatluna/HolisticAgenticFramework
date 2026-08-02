using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProcessDataSourceSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DataSourceSystem",
                schema: "process",
                table: "BusinessProcesses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSourceSystemOther",
                schema: "process",
                table: "BusinessProcesses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataSourceSystem",
                schema: "process",
                table: "BusinessProcesses");

            migrationBuilder.DropColumn(
                name: "DataSourceSystemOther",
                schema: "process",
                table: "BusinessProcesses");
        }
    }
}
