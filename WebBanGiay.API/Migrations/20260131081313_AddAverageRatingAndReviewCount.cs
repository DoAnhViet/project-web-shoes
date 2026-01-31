using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebBanGiay.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAverageRatingAndReviewCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AverageRating",
                table: "Products",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ReviewCount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ReviewerId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AverageRating", "CreatedAt", "ReviewCount" },
                values: new object[] { 0m, new DateTime(2026, 1, 31, 8, 13, 12, 918, DateTimeKind.Utc).AddTicks(9457), 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "AverageRating", "CreatedAt", "ReviewCount" },
                values: new object[] { 0m, new DateTime(2026, 1, 31, 8, 13, 12, 919, DateTimeKind.Utc).AddTicks(6586), 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "AverageRating", "CreatedAt", "ReviewCount" },
                values: new object[] { 0m, new DateTime(2026, 1, 31, 8, 13, 12, 919, DateTimeKind.Utc).AddTicks(6592), 0 });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ProductId",
                table: "Reviews",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropColumn(
                name: "AverageRating",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewCount",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 1, 29, 6, 35, 13, 185, DateTimeKind.Utc).AddTicks(3730));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 1, 29, 6, 35, 13, 185, DateTimeKind.Utc).AddTicks(4970));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 1, 29, 6, 35, 13, 185, DateTimeKind.Utc).AddTicks(4980));
        }
    }
}
