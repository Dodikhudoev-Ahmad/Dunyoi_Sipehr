using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AeroTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPerfIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Offers_IsPublished_IsFeatured",
                table: "Offers",
                columns: new[] { "IsPublished", "IsFeatured" });

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_Category",
                table: "FaqItems",
                column: "Category");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Offers_IsPublished_IsFeatured",
                table: "Offers");

            migrationBuilder.DropIndex(
                name: "IX_FaqItems_Category",
                table: "FaqItems");
        }
    }
}
