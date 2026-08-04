using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDataDictionaryEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DataDictionaryEntries",
                schema: "process",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfficialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Context = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    TechnicalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DataType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Format = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsPII = table.Column<bool>(type: "bit", nullable: false),
                    Owner = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    QualityOwner = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SynonymsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RepresentationsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GlobalRulesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataDictionaryEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataDictionaryEntries_EngagementId_OfficialName_Context",
                schema: "process",
                table: "DataDictionaryEntries",
                columns: new[] { "EngagementId", "OfficialName", "Context" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataDictionaryEntries",
                schema: "process");
        }
    }
}
