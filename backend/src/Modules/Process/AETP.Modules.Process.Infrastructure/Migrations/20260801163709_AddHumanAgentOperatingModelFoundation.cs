using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHumanAgentOperatingModelFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProcessActivities",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SequenceOrder = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    PerformedByRoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DecisionDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RequiresApproval = table.Column<bool>(type: "bit", nullable: false),
                    ApprovedByRoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "int", nullable: true),
                    ActualDurationMinutes = table.Column<int>(type: "int", nullable: true),
                    WaitTimeMinutes = table.Column<int>(type: "int", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BlockerNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DocumentedWay = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RealWay = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    GapNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessActivities_BusinessProcesses_ProcessId",
                        column: x => x.ProcessId,
                        principalSchema: "process",
                        principalTable: "BusinessProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessActivities_Roles_ApprovedByRoleId",
                        column: x => x.ApprovedByRoleId,
                        principalSchema: "process",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessActivities_Roles_PerformedByRoleId",
                        column: x => x.PerformedByRoleId,
                        principalSchema: "process",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ActivityDependencies",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DependsOnActivityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DependencyType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityDependencies_ProcessActivities_ActivityId",
                        column: x => x.ActivityId,
                        principalSchema: "process",
                        principalTable: "ProcessActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActivityDependencies_ProcessActivities_DependsOnActivityId",
                        column: x => x.DependsOnActivityId,
                        principalSchema: "process",
                        principalTable: "ProcessActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ActivityInteractions",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SequenceOrder = table.Column<int>(type: "int", nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SystemUsedId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FromRoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ToRoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ContentExample = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ResponseTimeMinutes = table.Column<int>(type: "int", nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityInteractions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityInteractions_EnterpriseSystems_SystemUsedId",
                        column: x => x.SystemUsedId,
                        principalSchema: "process",
                        principalTable: "EnterpriseSystems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActivityInteractions_ProcessActivities_ActivityId",
                        column: x => x.ActivityId,
                        principalSchema: "process",
                        principalTable: "ProcessActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActivityInteractions_Roles_FromRoleId",
                        column: x => x.FromRoleId,
                        principalSchema: "process",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActivityInteractions_Roles_ToRoleId",
                        column: x => x.ToRoleId,
                        principalSchema: "process",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityDependencies_ActivityId_DependsOnActivityId",
                schema: "process",
                table: "ActivityDependencies",
                columns: new[] { "ActivityId", "DependsOnActivityId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityDependencies_DependsOnActivityId",
                schema: "process",
                table: "ActivityDependencies",
                column: "DependsOnActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityInteractions_ActivityId_SequenceOrder",
                schema: "process",
                table: "ActivityInteractions",
                columns: new[] { "ActivityId", "SequenceOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityInteractions_FromRoleId",
                schema: "process",
                table: "ActivityInteractions",
                column: "FromRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityInteractions_SystemUsedId",
                schema: "process",
                table: "ActivityInteractions",
                column: "SystemUsedId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityInteractions_ToRoleId",
                schema: "process",
                table: "ActivityInteractions",
                column: "ToRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessActivities_ApprovedByRoleId",
                schema: "process",
                table: "ProcessActivities",
                column: "ApprovedByRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessActivities_PerformedByRoleId",
                schema: "process",
                table: "ProcessActivities",
                column: "PerformedByRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessActivities_ProcessId_SequenceOrder",
                schema: "process",
                table: "ProcessActivities",
                columns: new[] { "ProcessId", "SequenceOrder" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityDependencies",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ActivityInteractions",
                schema: "process");

            migrationBuilder.DropTable(
                name: "ProcessActivities",
                schema: "process");
        }
    }
}
