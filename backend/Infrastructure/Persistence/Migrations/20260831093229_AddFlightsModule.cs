using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Flights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FlightNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OriginCity = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DestinationCity = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DepartureAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedByAdminUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Flights_AdminUsers_CreatedByAdminUserId",
                        column: x => x.CreatedByAdminUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FlightPassengers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FlightId = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    TravelRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AddedByAdminUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    AddedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightPassengers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightPassengers_AdminUsers_AddedByAdminUserId",
                        column: x => x.AddedByAdminUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FlightPassengers_Flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "Flights",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FlightPassengers_TravelRequests_TravelRequestId",
                        column: x => x.TravelRequestId,
                        principalTable: "TravelRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FlightPassengers_AddedByAdminUserId",
                table: "FlightPassengers",
                column: "AddedByAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightPassengers_FlightId_TravelRequestId",
                table: "FlightPassengers",
                columns: new[] { "FlightId", "TravelRequestId" },
                unique: true,
                filter: "\"TravelRequestId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_FlightPassengers_TravelRequestId",
                table: "FlightPassengers",
                column: "TravelRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_CreatedByAdminUserId",
                table: "Flights",
                column: "CreatedByAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_DepartureAtUtc",
                table: "Flights",
                column: "DepartureAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_Status",
                table: "Flights",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FlightPassengers");

            migrationBuilder.DropTable(
                name: "Flights");
        }
    }
}
