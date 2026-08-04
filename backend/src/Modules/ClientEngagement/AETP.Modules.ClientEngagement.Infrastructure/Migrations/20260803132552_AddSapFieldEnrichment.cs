using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSapFieldEnrichment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SapFieldEnrichments",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FieldName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    IsCustomField = table.Column<bool>(type: "bit", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Formato = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ReglaNegocio = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    FuenteGrounding = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    EncontradoEnGrounding = table.Column<bool>(type: "bit", nullable: false),
                    SapVersion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SapFieldEnrichments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SapFieldEnrichments_EngagementId_FieldName",
                schema: "engagement",
                table: "SapFieldEnrichments",
                columns: new[] { "EngagementId", "FieldName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SapFieldEnrichments",
                schema: "engagement");
        }
    }
}
