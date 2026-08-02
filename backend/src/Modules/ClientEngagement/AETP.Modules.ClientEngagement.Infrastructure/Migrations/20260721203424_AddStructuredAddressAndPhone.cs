using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStructuredAddressAndPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeadquartersNeighborhood",
                schema: "engagement",
                table: "CompanyProfiles",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeadquartersPostalCode",
                schema: "engagement",
                table: "CompanyProfiles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeadquartersState",
                schema: "engagement",
                table: "CompanyProfiles",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeadquartersStreet",
                schema: "engagement",
                table: "CompanyProfiles",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                schema: "engagement",
                table: "CompanyProfiles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneCountryCode",
                schema: "engagement",
                table: "CompanyProfiles",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeadquartersNeighborhood",
                schema: "engagement",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "HeadquartersPostalCode",
                schema: "engagement",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "HeadquartersState",
                schema: "engagement",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "HeadquartersStreet",
                schema: "engagement",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "Phone",
                schema: "engagement",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "PhoneCountryCode",
                schema: "engagement",
                table: "CompanyProfiles");
        }
    }
}
