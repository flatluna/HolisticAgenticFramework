using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Strategy.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Add_Objective_Strategy_KPI_BusinessContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "strategy");

            migrationBuilder.CreateTable(
                name: "Strategies",
                schema: "strategy",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Vision = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CompetitiveAdvantage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    TimeHorizonMonths = table.Column<int>(type: "int", nullable: false),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Strategies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Objectives",
                schema: "strategy",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StrategyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    TargetValue = table.Column<int>(type: "int", nullable: true),
                    TargetDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BusinessValueCategory = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Owner = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Priority = table.Column<int>(type: "int", nullable: false, defaultValue: 3),
                    Rationale = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Objectives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Objectives_Strategies_StrategyId",
                        column: x => x.StrategyId,
                        principalSchema: "strategy",
                        principalTable: "Strategies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KPIs",
                schema: "strategy",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ObjectiveId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BaselineValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TargetValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MeasurementFrequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "Monthly"),
                    DataSource = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KPIs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KPIs_Objectives_ObjectiveId",
                        column: x => x.ObjectiveId,
                        principalSchema: "strategy",
                        principalTable: "Objectives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KPIs_EngagementId",
                schema: "strategy",
                table: "KPIs",
                column: "EngagementId");

            migrationBuilder.CreateIndex(
                name: "IX_KPIs_ObjectiveId",
                schema: "strategy",
                table: "KPIs",
                column: "ObjectiveId");

            migrationBuilder.CreateIndex(
                name: "IX_Objectives_EngagementId",
                schema: "strategy",
                table: "Objectives",
                column: "EngagementId");

            migrationBuilder.CreateIndex(
                name: "IX_Objectives_StrategyId",
                schema: "strategy",
                table: "Objectives",
                column: "StrategyId");

            migrationBuilder.CreateIndex(
                name: "IX_Strategies_EngagementId",
                schema: "strategy",
                table: "Strategies",
                column: "EngagementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KPIs",
                schema: "strategy");

            migrationBuilder.DropTable(
                name: "Objectives",
                schema: "strategy");

            migrationBuilder.DropTable(
                name: "Strategies",
                schema: "strategy");
        }
    }
}
