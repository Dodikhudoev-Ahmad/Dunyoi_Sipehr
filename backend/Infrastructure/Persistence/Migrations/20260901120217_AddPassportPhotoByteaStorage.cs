using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPassportPhotoByteaStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PassportPhotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    Content = table.Column<byte[]>(type: "bytea", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PassportPhotos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PassportPhotos_FileName",
                table: "PassportPhotos",
                column: "FileName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PassportPhotos");
        }
    }
}
