using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebBanGiay.API.Migrations
{
    /// <inheritdoc />
    public partial class SyncOrdersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First drop OrderItems (child) then Orders (parent) due to FK constraint
            migrationBuilder.Sql("DROP TABLE IF EXISTS OrderItems;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS Orders;");
            
            // Recreate Orders table with all columns
            migrationBuilder.Sql(@"
                CREATE TABLE Orders (
                    Id INT NOT NULL AUTO_INCREMENT,
                    OrderCode VARCHAR(50) NOT NULL,
                    UserId INT NULL,
                    FullName VARCHAR(100) NOT NULL,
                    Email VARCHAR(255) NOT NULL,
                    Phone VARCHAR(20) NOT NULL,
                    Address VARCHAR(500) NOT NULL,
                    City VARCHAR(100) NOT NULL DEFAULT '',
                    District VARCHAR(100) NOT NULL DEFAULT '',
                    Ward VARCHAR(100) NOT NULL DEFAULT '',
                    Note VARCHAR(500) NULL,
                    Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
                    ShippingFee DECIMAL(18,2) NOT NULL,
                    Discount DECIMAL(18,2) NOT NULL DEFAULT 0,
                    Total DECIMAL(18,2) NOT NULL,
                    PaymentMethod VARCHAR(20) NOT NULL,
                    PaymentStatus VARCHAR(20) NOT NULL,
                    Status VARCHAR(20) NOT NULL,
                    CreatedAt DATETIME(6) NOT NULL,
                    UpdatedAt DATETIME(6) NULL,
                    PRIMARY KEY (Id),
                    UNIQUE KEY IX_Orders_OrderCode (OrderCode),
                    KEY IX_Orders_Email (Email),
                    KEY IX_Orders_UserId (UserId),
                    CONSTRAINT FK_Orders_Users_UserId FOREIGN KEY (UserId) REFERENCES Users (Id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            
            // Recreate OrderItems table
            migrationBuilder.Sql(@"
                CREATE TABLE OrderItems (
                    Id INT NOT NULL AUTO_INCREMENT,
                    OrderId INT NOT NULL,
                    ProductId INT NOT NULL,
                    ProductName VARCHAR(200) NOT NULL,
                    ProductImage VARCHAR(500) NOT NULL,
                    Size VARCHAR(20) NOT NULL,
                    Color VARCHAR(50) NOT NULL,
                    Price DECIMAL(18,2) NOT NULL,
                    Quantity INT NOT NULL,
                    LineTotal DECIMAL(18,2) NOT NULL,
                    PRIMARY KEY (Id),
                    KEY IX_OrderItems_OrderId (OrderId),
                    KEY IX_OrderItems_ProductId (ProductId),
                    CONSTRAINT FK_OrderItems_Orders_OrderId FOREIGN KEY (OrderId) REFERENCES Orders (Id) ON DELETE CASCADE,
                    CONSTRAINT FK_OrderItems_Products_ProductId FOREIGN KEY (ProductId) REFERENCES Products (Id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to revert
        }
    }
}
