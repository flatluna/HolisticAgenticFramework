using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHumanCapabilityFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerRoleId",
                schema: "process",
                table: "BusinessProcesses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BusinessRules",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RuleType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Source = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KpiDefinitions",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KpiDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoleCategories",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SkillCategories",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProcessBusinessRules",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessBusinessRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessBusinessRules_BusinessProcesses_ProcessId",
                        column: x => x.ProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessBusinessRules_BusinessRules_BusinessRuleId",
                        column: x => x.BusinessRuleId,
                        principalSchema: "process",
                        principalTable: "BusinessRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcessKPIs",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KpiDefinitionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BaselineValue = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    TargetValue = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessKPIs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessKPIs_BusinessProcesses_ProcessId",
                        column: x => x.ProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessKPIs_KpiDefinitions_KpiDefinitionId",
                        column: x => x.KpiDefinitionId,
                        principalSchema: "process",
                        principalTable: "KpiDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RoleCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Roles_RoleCategories_RoleCategoryId",
                        column: x => x.RoleCategoryId,
                        principalSchema: "process",
                        principalTable: "RoleCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SkillCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Activo"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Skills_SkillCategories_SkillCategoryId",
                        column: x => x.SkillCategoryId,
                        principalSchema: "process",
                        principalTable: "SkillCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcessRoles",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvolvementType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessRoles_BusinessProcesses_ProcessId",
                        column: x => x.ProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "process",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcessRequiredSkills",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequiredProficiencyLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Criticality = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessRequiredSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessRequiredSkills_BusinessProcesses_ProcessId",
                        column: x => x.ProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessRequiredSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalSchema: "process",
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoleSkills",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProficiencyLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleSkills_Roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "process",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoleSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalSchema: "process",
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessProcesses_OwnerRoleId",
                schema: "process",
                table: "BusinessProcesses",
                column: "OwnerRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessRules_EngagementId_Name",
                schema: "process",
                table: "BusinessRules",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KpiDefinitions_EngagementId_Name",
                schema: "process",
                table: "KpiDefinitions",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessBusinessRules_BusinessRuleId",
                schema: "process",
                table: "ProcessBusinessRules",
                column: "BusinessRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessBusinessRules_ProcessId_BusinessRuleId",
                schema: "process",
                table: "ProcessBusinessRules",
                columns: new[] { "ProcessId", "BusinessRuleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessKPIs_KpiDefinitionId",
                schema: "process",
                table: "ProcessKPIs",
                column: "KpiDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessKPIs_ProcessId_KpiDefinitionId",
                schema: "process",
                table: "ProcessKPIs",
                columns: new[] { "ProcessId", "KpiDefinitionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRequiredSkills_ProcessId_SkillId",
                schema: "process",
                table: "ProcessRequiredSkills",
                columns: new[] { "ProcessId", "SkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRequiredSkills_SkillId",
                schema: "process",
                table: "ProcessRequiredSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRoles_ProcessId_RoleId",
                schema: "process",
                table: "ProcessRoles",
                columns: new[] { "ProcessId", "RoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRoles_RoleId",
                schema: "process",
                table: "ProcessRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleCategories_EngagementId_Name",
                schema: "process",
                table: "RoleCategories",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_EngagementId_Name",
                schema: "process",
                table: "Roles",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_RoleCategoryId",
                schema: "process",
                table: "Roles",
                column: "RoleCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleSkills_RoleId_SkillId",
                schema: "process",
                table: "RoleSkills",
                columns: new[] { "RoleId", "SkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoleSkills_SkillId",
                schema: "process",
                table: "RoleSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillCategories_EngagementId_Name",
                schema: "process",
                table: "SkillCategories",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_EngagementId_Name",
                schema: "process",
                table: "Skills",
                columns: new[] { "EngagementId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_SkillCategoryId",
                schema: "process",
                table: "Skills",
                column: "SkillCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_BusinessProcesses_Roles_OwnerRoleId",
                schema: "process",
                table: "BusinessProcesses",
                column: "OwnerRoleId",
                principalSchema: "process",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BusinessProcesses_Roles_OwnerRoleId",
                schema: "process",
                table: "BusinessProcesses");

            migrationBuilder.DropTable(
                name: "ProcessBusinessRules",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ProcessKPIs",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ProcessRequiredSkills",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ProcessRoles",
                schema: "process");

            migrationBuilder.DropTable(
                name: "RoleSkills",
                schema: "process");

            migrationBuilder.DropTable(
                name: "BusinessRules",
                schema: "process");

            migrationBuilder.DropTable(
                name: "KpiDefinitions",
                schema: "process");

            migrationBuilder.DropTable(
                name: "Roles",
                schema: "process");

            migrationBuilder.DropTable(
                name: "Skills",
                schema: "process");

            migrationBuilder.DropTable(
                name: "RoleCategories",
                schema: "process");

            migrationBuilder.DropTable(
                name: "SkillCategories",
                schema: "process");

            migrationBuilder.DropIndex(
                name: "IX_BusinessProcesses_OwnerRoleId",
                schema: "process",
                table: "BusinessProcesses");

            migrationBuilder.DropColumn(
                name: "OwnerRoleId",
                schema: "process",
                table: "BusinessProcesses");
        }
    }
}
