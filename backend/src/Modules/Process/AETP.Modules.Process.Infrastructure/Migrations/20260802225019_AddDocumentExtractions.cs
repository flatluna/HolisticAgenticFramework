using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentExtractions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentExtractions",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    BlobPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DocumentFormat = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DocumentCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DocumentModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Author = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DetectedLanguage = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ExtractedDataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EntitiesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContentDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PageCount = table.Column<int>(type: "int", nullable: false),
                    ExecutiveSummary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtractionStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Subido"),
                    ExtractionError = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ExtractedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExtractionModel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentExtractions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentExtractions_ActivityInteractions_SourceId",
                        column: x => x.SourceId,
                        principalSchema: "process",
                        principalTable: "ActivityInteractions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DocumentExtractions_ProcessActivities_ActivityId",
                        column: x => x.ActivityId,
                        principalSchema: "process",
                        principalTable: "ProcessActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentExtractions_ActivityId",
                schema: "process",
                table: "DocumentExtractions",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentExtractions_ProcessId",
                schema: "process",
                table: "DocumentExtractions",
                column: "ProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentExtractions_SourceId",
                schema: "process",
                table: "DocumentExtractions",
                column: "SourceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentExtractions",
                schema: "process");
        }
    }
}
