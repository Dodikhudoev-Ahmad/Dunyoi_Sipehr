using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightPassengerConcurrencyToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // `xmin` is a Postgres system column that already exists on every table — nothing to
            // add. This migration exists only so the EF model snapshot records FlightPassenger as
            // using it for optimistic concurrency (see FlightPassengerConfiguration).
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
