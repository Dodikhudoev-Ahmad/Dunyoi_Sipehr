using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCrmModulePhase1Phase2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DealCurrency",
                table: "TravelRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DealValue",
                table: "TravelRequests",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextFollowUpAtUtc",
                table: "TravelRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TravelRequestNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TravelRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorAdminUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelRequestNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TravelRequestNotes_AdminUsers_AuthorAdminUserId",
                        column: x => x.AuthorAdminUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TravelRequestNotes_TravelRequests_TravelRequestId",
                        column: x => x.TravelRequestId,
                        principalTable: "TravelRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TravelRequests_NextFollowUpAtUtc",
                table: "TravelRequests",
                column: "NextFollowUpAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_TravelRequestNotes_AuthorAdminUserId",
                table: "TravelRequestNotes",
                column: "AuthorAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelRequestNotes_TravelRequestId",
                table: "TravelRequestNotes",
                column: "TravelRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TravelRequestNotes");

            migrationBuilder.DropIndex(
                name: "IX_TravelRequests_NextFollowUpAtUtc",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "DealCurrency",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "DealValue",
                table: "TravelRequests");

            migrationBuilder.DropColumn(
                name: "NextFollowUpAtUtc",
                table: "TravelRequests");
        }
    }
}
