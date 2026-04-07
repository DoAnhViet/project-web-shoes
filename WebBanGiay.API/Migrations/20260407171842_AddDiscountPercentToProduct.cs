using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebBanGiay.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscountPercentToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DiscountPercent",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 8, 0, 18, 42, 395, DateTimeKind.Local).AddTicks(8950));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 8, 0, 18, 42, 409, DateTimeKind.Local).AddTicks(9180));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 8, 0, 18, 42, 409, DateTimeKind.Local).AddTicks(9190));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "DiscountPercent" },
                values: new object[] { new DateTime(2026, 4, 7, 17, 18, 42, 410, DateTimeKind.Utc).AddTicks(240), 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "DiscountPercent" },
                values: new object[] { new DateTime(2026, 4, 7, 17, 18, 42, 410, DateTimeKind.Utc).AddTicks(1690), 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "DiscountPercent" },
                values: new object[] { new DateTime(2026, 4, 7, 17, 18, 42, 410, DateTimeKind.Utc).AddTicks(1690), 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscountPercent",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 23, 14, 44, 768, DateTimeKind.Local).AddTicks(3830));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 23, 14, 44, 784, DateTimeKind.Local).AddTicks(1010));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 23, 14, 44, 784, DateTimeKind.Local).AddTicks(1030));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 16, 14, 44, 784, DateTimeKind.Utc).AddTicks(2380));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 16, 14, 44, 784, DateTimeKind.Utc).AddTicks(3930));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 16, 14, 44, 784, DateTimeKind.Utc).AddTicks(3930));
        }
    }
}
