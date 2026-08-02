using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AETP.Modules.ClientEngagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "engagement");

            migrationBuilder.CreateTable(
                name: "ClientOrganizations",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Industry = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    EmployeeCount = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientOrganizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompanyProfiles",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientOrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Founded = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AnnualRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TotalEmployees = table.Column<int>(type: "int", nullable: true),
                    HeadquartersCity = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    HeadquartersCountry = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CloudAdoptionScore = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DataMaturityScore = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    AIAdoptionScore = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IndustrySectors = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeographicMarkets = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    KeyProducts = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastFiscalYear = table.Column<int>(type: "int", nullable: true),
                    ProfitMargin = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CreditRating = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Engagements",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientOrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Planning"),
                    Budget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TransformationMandate = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BusinessProblem = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ExpectedDecision = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ExecutiveSponsor = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    TargetDecisionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Scope = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OutOfScope = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Engagements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Engagements_ClientOrganizations_ClientOrganizationId",
                        column: x => x.ClientOrganizationId,
                        principalSchema: "engagement",
                        principalTable: "ClientOrganizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    HeadCount = table.Column<int>(type: "int", nullable: true),
                    LeadName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    LeadEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AnnualBudget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_CompanyProfiles_CompanyProfileId",
                        column: x => x.CompanyProfileId,
                        principalSchema: "engagement",
                        principalTable: "CompanyProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    City = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Country = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Office = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Branch"),
                    Headcount = table.Column<int>(type: "int", nullable: true),
                    IsHeadquarters = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_CompanyProfiles_CompanyProfileId",
                        column: x => x.CompanyProfileId,
                        principalSchema: "engagement",
                        principalTable: "CompanyProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Stakeholders",
                schema: "engagement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EngagementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stakeholders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stakeholders_Engagements_EngagementId",
                        column: x => x.EngagementId,
                        principalSchema: "engagement",
                        principalTable: "Engagements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientOrganizations_Name",
                schema: "engagement",
                table: "ClientOrganizations",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyProfiles_ClientOrganizationId",
                schema: "engagement",
                table: "CompanyProfiles",
                column: "ClientOrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyProfiles_EngagementId",
                schema: "engagement",
                table: "CompanyProfiles",
                column: "EngagementId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_CompanyProfileId_Name",
                schema: "engagement",
                table: "Departments",
                columns: new[] { "CompanyProfileId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departments_EngagementId",
                schema: "engagement",
                table: "Departments",
                column: "EngagementId");

            migrationBuilder.CreateIndex(
                name: "IX_Engagements_ClientOrganizationId",
                schema: "engagement",
                table: "Engagements",
                column: "ClientOrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Engagements_EngagementId",
                schema: "engagement",
                table: "Engagements",
                column: "EngagementId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Locations_CompanyProfileId_City_Country",
                schema: "engagement",
                table: "Locations",
                columns: new[] { "CompanyProfileId", "City", "Country" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Locations_EngagementId",
                schema: "engagement",
                table: "Locations",
                column: "EngagementId");

            migrationBuilder.CreateIndex(
                name: "IX_Stakeholders_EngagementId",
                schema: "engagement",
                table: "Stakeholders",
                column: "EngagementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Departments",
                schema: "engagement");

            migrationBuilder.DropTable(
                name: "Locations",
                schema: "engagement");

            migrationBuilder.DropTable(
                name: "Stakeholders",
                schema: "engagement");

            migrationBuilder.DropTable(
                name: "CompanyProfiles",
                schema: "engagement");

            migrationBuilder.DropTable(
                name: "Engagements",
                schema: "engagement");

            migrationBuilder.DropTable(
                name: "ClientOrganizations",
                schema: "engagement");
        }
    }
}
