using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebBanGiay.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCartTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing tables if they exist and recreate
            migrationBuilder.Sql("DROP TABLE IF EXISTS CartItems;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS Carts;");
            
            // Create Carts table
            migrationBuilder.Sql(@"
                CREATE TABLE Carts (
                    Id INT NOT NULL AUTO_INCREMENT,
                    UserId INT NULL,
                    SessionId VARCHAR(100) NULL,
                    CreatedAt DATETIME(6) NOT NULL,
                    UpdatedAt DATETIME(6) NULL,
                    PRIMARY KEY (Id),
                    KEY IX_Carts_SessionId (SessionId),
                    KEY IX_Carts_UserId (UserId),
                    CONSTRAINT FK_Carts_Users_UserId FOREIGN KEY (UserId) REFERENCES Users (Id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            
            // Create CartItems table
            migrationBuilder.Sql(@"
                CREATE TABLE CartItems (
                    Id INT NOT NULL AUTO_INCREMENT,
                    CartId INT NOT NULL,
                    ProductId INT NOT NULL,
                    Size VARCHAR(20) NOT NULL,
                    Color VARCHAR(50) NOT NULL,
                    Quantity INT NOT NULL DEFAULT 1,
                    Price DECIMAL(18,2) NOT NULL,
                    CreatedAt DATETIME(6) NOT NULL,
                    PRIMARY KEY (Id),
                    KEY IX_CartItems_CartId (CartId),
                    KEY IX_CartItems_ProductId (ProductId),
                    CONSTRAINT FK_CartItems_Carts_CartId FOREIGN KEY (CartId) REFERENCES Carts (Id) ON DELETE CASCADE,
                    CONSTRAINT FK_CartItems_Products_ProductId FOREIGN KEY (ProductId) REFERENCES Products (Id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS CartItems;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS Carts;");
        }
    }
}
