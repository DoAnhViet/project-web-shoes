using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebBanGiay.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedBulkDiscounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 19, 10, 54, 366, DateTimeKind.Local).AddTicks(10));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 19, 10, 54, 366, DateTimeKind.Local).AddTicks(1140));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 19, 10, 54, 366, DateTimeKind.Local).AddTicks(1140));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BulkDiscountRules", "CreatedAt" },
                values: new object[] { "[{\"minQty\":2,\"discount\":5},{\"minQty\":5,\"discount\":10}]", new DateTime(2026, 3, 30, 12, 10, 54, 366, DateTimeKind.Utc).AddTicks(1660) });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "BulkDiscountRules", "CreatedAt" },
                values: new object[] { "[{\"minQty\":3,\"discount\":8},{\"minQty\":6,\"discount\":15}]", new DateTime(2026, 3, 30, 12, 10, 54, 366, DateTimeKind.Utc).AddTicks(3100) });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 12, 10, 54, 366, DateTimeKind.Utc).AddTicks(3110));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 19, 3, 58, 603, DateTimeKind.Local).AddTicks(6810));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 19, 3, 58, 603, DateTimeKind.Local).AddTicks(7940));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 19, 3, 58, 603, DateTimeKind.Local).AddTicks(7940));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BulkDiscountRules", "CreatedAt" },
                values: new object[] { null, new DateTime(2026, 3, 30, 12, 3, 58, 603, DateTimeKind.Utc).AddTicks(8430) });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "BulkDiscountRules", "CreatedAt" },
                values: new object[] { null, new DateTime(2026, 3, 30, 12, 3, 58, 603, DateTimeKind.Utc).AddTicks(9720) });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 12, 3, 58, 603, DateTimeKind.Utc).AddTicks(9730));
        }
    }
}
