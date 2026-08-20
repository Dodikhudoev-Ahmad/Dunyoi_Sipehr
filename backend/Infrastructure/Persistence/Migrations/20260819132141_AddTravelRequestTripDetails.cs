using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTravelRequestTripDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChildrenAges",
                table: "TravelRequests",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<DateOnly>(
                name: "DepartureDate",
                table: "TravelRequests",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<DateTime>(
                name: "PassportDataConsentAcceptedAtUtc",
                table: "TravelRequests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "PassportPhotoPaths",
                table: "TravelRequests",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<DateOnly>(
                name: "ReturnDate",
                table: "TravelRequests",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChildrenAges",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "DepartureDate",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "PassportDataConsentAcceptedAtUtc",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "PassportPhotoPaths",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "ReturnDate",
                table: "TravelRequests");
        }
    }
}
