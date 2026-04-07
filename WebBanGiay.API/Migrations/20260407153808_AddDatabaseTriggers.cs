using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebBanGiay.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 22, 38, 8, 416, DateTimeKind.Local).AddTicks(1790));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 22, 38, 8, 432, DateTimeKind.Local).AddTicks(9160));

            migrationBuilder.UpdateData(
                table: "Coupons",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 22, 38, 8, 432, DateTimeKind.Local).AddTicks(9170));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 15, 38, 8, 433, DateTimeKind.Utc).AddTicks(340));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 15, 38, 8, 433, DateTimeKind.Utc).AddTicks(1910));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 15, 38, 8, 433, DateTimeKind.Utc).AddTicks(1920));

            // === DATABASE TRIGGERS ===
            
            // 1. Auto-decrement stock when order item added
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS after_order_item_insert;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER after_order_item_insert
                AFTER INSERT ON OrderItems
                FOR EACH ROW
                BEGIN
                    UPDATE Products 
                    SET Stock = Stock - NEW.Quantity 
                    WHERE Id = NEW.ProductId AND Stock >= NEW.Quantity;
                END;
            ");

            // 2. Restore stock when order cancelled
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS after_order_cancel;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER after_order_cancel
                AFTER UPDATE ON Orders
                FOR EACH ROW
                BEGIN
                    IF NEW.Status = 'cancelled' AND OLD.Status != 'cancelled' THEN
                        UPDATE Products p
                        INNER JOIN OrderItems oi ON p.Id = oi.ProductId
                        SET p.Stock = p.Stock + oi.Quantity
                        WHERE oi.OrderId = NEW.Id;
                    END IF;
                END;
            ");

            // 3. Update product rating when review added
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS after_review_insert;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER after_review_insert
                AFTER INSERT ON Reviews
                FOR EACH ROW
                BEGIN
                    UPDATE Products
                    SET AverageRating = (SELECT AVG(Rating) FROM Reviews WHERE ProductId = NEW.ProductId),
                        ReviewCount = (SELECT COUNT(*) FROM Reviews WHERE ProductId = NEW.ProductId)
                    WHERE Id = NEW.ProductId;
                END;
            ");

            // 4. Update product rating when review edited
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS after_review_update;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER after_review_update
                AFTER UPDATE ON Reviews
                FOR EACH ROW
                BEGIN
                    UPDATE Products
                    SET AverageRating = (SELECT AVG(Rating) FROM Reviews WHERE ProductId = NEW.ProductId)
                    WHERE Id = NEW.ProductId;
                END;
            ");

            // 5. Update product rating when review deleted
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS after_review_delete;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER after_review_delete
                AFTER DELETE ON Reviews
                FOR EACH ROW
                BEGIN
                    UPDATE Products
                    SET AverageRating = COALESCE((SELECT AVG(Rating) FROM Reviews WHERE ProductId = OLD.ProductId), 0),
                        ReviewCount = (SELECT COUNT(*) FROM Reviews WHERE ProductId = OLD.ProductId)
                    WHERE Id = OLD.ProductId;
                END;
            ");

            // 6. Validate coupon usage limit
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS before_coupon_usage_update;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER before_coupon_usage_update
                BEFORE UPDATE ON Coupons
                FOR EACH ROW
                BEGIN
                    IF NEW.UsageLimit > 0 AND NEW.UsedCount > NEW.UsageLimit THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'Coupon usage limit exceeded';
                    END IF;
                END;
            ");

            // 7. Auto-update order timestamps
            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS before_order_update;
            ");
            
            migrationBuilder.Sql(@"
                CREATE TRIGGER before_order_update
                BEFORE UPDATE ON Orders
                FOR EACH ROW
                BEGIN
                    SET NEW.UpdatedAt = UTC_TIMESTAMP();
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove all triggers
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS after_order_item_insert;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS after_order_cancel;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS after_review_insert;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS after_review_update;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS after_review_delete;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS before_coupon_usage_update;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS before_order_update;");
        }
    }
}
