using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitTravelRequestNameRemoveEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "TravelRequests");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "TravelRequests",
                newName: "LastName");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "TravelRequests",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MiddleName",
                table: "TravelRequests",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "MiddleName",
                table: "TravelRequests");

            migrationBuilder.RenameColumn(
                name: "LastName",
                table: "TravelRequests",
                newName: "FullName");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "TravelRequests",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");
        }
    }
}
