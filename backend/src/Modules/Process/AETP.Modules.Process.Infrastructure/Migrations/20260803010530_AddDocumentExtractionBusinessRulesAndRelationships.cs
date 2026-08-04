using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.Process.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentExtractionBusinessRulesAndRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessRulesJson",
                schema: "process",
                table: "DocumentExtractions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelationshipsJson",
                schema: "process",
                table: "DocumentExtractions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessRulesJson",
                schema: "process",
                table: "DocumentExtractions");

            migrationBuilder.DropColumn(
                name: "RelationshipsJson",
                schema: "process",
                table: "DocumentExtractions");
        }
    }
}
