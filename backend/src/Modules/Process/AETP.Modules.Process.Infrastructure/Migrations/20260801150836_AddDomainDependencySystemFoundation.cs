using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDomainDependencySystemFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DomainId",
                schema: "process",
                table: "BusinessProcesses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriorityLevel",
                schema: "process",
                table: "BusinessProcesses",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BusinessDomains",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessDomains", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EnterpriseSystems",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnterpriseSystems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProcessDependencies",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DependencyType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessDependencies_BusinessProcesses_SourceProcessId",
                        column: x => x.SourceProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessDependencies_BusinessProcesses_TargetProcessId",
                        column: x => x.TargetProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcessSystems",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SystemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UsageType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessSystems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessSystems_BusinessProcesses_ProcessId",
                        column: x => x.ProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessSystems_EnterpriseSystems_SystemId",
                        column: x => x.SystemId,
                        principalSchema: "process",
                        principalTable: "EnterpriseSystems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessProcesses_DomainId",
                schema: "process",
                table: "BusinessProcesses",
                column: "DomainId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessDomains_EngagementId_Name",
                schema: "process",
                table: "BusinessDomains",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EnterpriseSystems_EngagementId_Name",
                schema: "process",
                table: "EnterpriseSystems",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessDependencies_SourceProcessId_TargetProcessId",
                schema: "process",
                table: "ProcessDependencies",
                columns: new[] { "SourceProcessId", "TargetProcessId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessDependencies_TargetProcessId",
                schema: "process",
                table: "ProcessDependencies",
                column: "TargetProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessSystems_ProcessId_SystemId",
                schema: "process",
                table: "ProcessSystems",
                columns: new[] { "ProcessId", "SystemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessSystems_SystemId",
                schema: "process",
                table: "ProcessSystems",
                column: "SystemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessDomains",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ProcessDependencies",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ProcessSystems",
                schema: "process");

            migrationBuilder.DropTable(
                name: "EnterpriseSystems",
                schema: "process");

            migrationBuilder.DropIndex(
                name: "IX_BusinessProcesses_DomainId",
                schema: "process",
                table: "BusinessProcesses");

            migrationBuilder.DropColumn(
                name: "DomainId",
                schema: "process",
                table: "BusinessProcesses");

            migrationBuilder.DropColumn(
                name: "PriorityLevel",
                schema: "process",
                table: "BusinessProcesses");
        }
    }
}
