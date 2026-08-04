using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemCatalogApiHostingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsSuite",
                schema: "process",
                table: "EnterpriseSystems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Hosting",
                schema: "process",
                table: "EnterpriseSystems",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotasAPI",
                schema: "process",
                table: "EnterpriseSystems",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotasHosting",
                schema: "process",
                table: "EnterpriseSystems",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProveedorNube",
                schema: "process",
                table: "EnterpriseSystems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TieneAPI",
                schema: "process",
                table: "EnterpriseSystems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TipoAPI",
                schema: "process",
                table: "EnterpriseSystems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EnterpriseSystemModules",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SystemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnterpriseSystemModules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EnterpriseSystemModules_EnterpriseSystems_SystemId",
                        column: x => x.SystemId,
                        principalSchema: "process",
                        principalTable: "EnterpriseSystems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EnterpriseSystemTransactions",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SystemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnterpriseSystemTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EnterpriseSystemTransactions_EnterpriseSystems_SystemId",
                        column: x => x.SystemId,
                        principalSchema: "process",
                        principalTable: "EnterpriseSystems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EnterpriseSystemModules_SystemId",
                schema: "process",
                table: "EnterpriseSystemModules",
                column: "SystemId");

            migrationBuilder.CreateIndex(
                name: "IX_EnterpriseSystemTransactions_SystemId",
                schema: "process",
                table: "EnterpriseSystemTransactions",
                column: "SystemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnterpriseSystemModules",
                schema: "process");

            migrationBuilder.DropTable(
                name: "EnterpriseSystemTransactions",
                schema: "process");

            migrationBuilder.DropColumn(
                name: "EsSuite",
                schema: "process",
                table: "EnterpriseSystems");

            migrationBuilder.DropColumn(
                name: "Hosting",
                schema: "process",
                table: "EnterpriseSystems");

            migrationBuilder.DropColumn(
                name: "NotasAPI",
                schema: "process",
                table: "EnterpriseSystems");

            migrationBuilder.DropColumn(
                name: "NotasHosting",
                schema: "process",
                table: "EnterpriseSystems");

            migrationBuilder.DropColumn(
                name: "ProveedorNube",
                schema: "process",
                table: "EnterpriseSystems");

            migrationBuilder.DropColumn(
                name: "TieneAPI",
                schema: "process",
                table: "EnterpriseSystems");

            migrationBuilder.DropColumn(
                name: "TipoAPI",
                schema: "process",
                table: "EnterpriseSystems");
        }
    }
}
