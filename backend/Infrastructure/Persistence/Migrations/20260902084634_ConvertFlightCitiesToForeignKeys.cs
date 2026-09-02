using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConvertFlightCitiesToForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinationCity",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "OriginCity",
                table: "Flights");

            migrationBuilder.AddColumn<Guid>(
                name: "DestinationCityId",
                table: "Flights",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OriginCityId",
                table: "Flights",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Flights_DestinationCityId",
                table: "Flights",
                column: "DestinationCityId");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_OriginCityId",
                table: "Flights",
                column: "OriginCityId");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Cities_DestinationCityId",
                table: "Flights",
                column: "DestinationCityId",
                principalTable: "Cities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Cities_OriginCityId",
                table: "Flights",
                column: "OriginCityId",
                principalTable: "Cities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Cities_DestinationCityId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Cities_OriginCityId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_DestinationCityId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_OriginCityId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "DestinationCityId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "OriginCityId",
                table: "Flights");

            migrationBuilder.AddColumn<string>(
                name: "DestinationCity",
                table: "Flights",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OriginCity",
                table: "Flights",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }
    }
}
