using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightNumberUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Flights_FlightNumber",
                table: "Flights",
                column: "FlightNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flights_FlightNumber",
                table: "Flights");
        }
    }
}
