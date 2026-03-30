using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<UserPoints> UserPoints { get; set; }
        public DbSet<PointsTransaction> PointsTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            // Product -> Reviews (One-to-Many)
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order -> OrderItems (One-to-Many)
            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order indexes
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.OrderCode)
                .IsUnique();
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.Email);

            // Cart -> CartItems (One-to-Many)
            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.CartItems)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            // CartItem -> Product
            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany()
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Cart indexes
            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.SessionId);
            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.UserId);

            // Seed categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Giày thể thao", Description = "Giày dành cho hoạt động thể thao" },
                new Category { Id = 2, Name = "Giày công sở", Description = "Giày lịch sự cho môi trường công sở" },
                new Category { Id = 3, Name = "Giày sneaker", Description = "Giày sneaker phong cách" }
            );

            // Seed coupons
            modelBuilder.Entity<Coupon>().HasData(
                new Coupon 
                { 
                    Id = 1, 
                    Code = "WELCOME10", 
                    Description = "Giảm 10% cho đơn hàng đầu tiên",
                    DiscountType = "percent",
                    DiscountValue = 10,
                    MinOrderAmount = 0,
                    UsageLimit = 0,
                    IsActive = true
                },
                new Coupon 
                { 
                    Id = 2, 
                    Code = "SAVE50K", 
                    Description = "Giảm 50.000đ cho đơn từ 500.000đ",
                    DiscountType = "fixed",
                    DiscountValue = 50000,
                    MinOrderAmount = 500000,
                    UsageLimit = 100,
                    IsActive = true
                },
                new Coupon 
                { 
                    Id = 3, 
                    Code = "FREESHIP", 
                    Description = "Miễn phí ship cho đơn từ 300.000đ",
                    DiscountType = "fixed",
                    DiscountValue = 30000,
                    MinOrderAmount = 300000,
                    UsageLimit = 0,
                    IsActive = true
                }
            );

            // Seed products
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    Id = 1,
                    Name = "Nike Air Max 270",
                    Description = "Giày thể thao cao cấp Nike Air Max 270",
                    Price = 3200000,
                    Stock = 50,
                    ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
                    CategoryId = 1,
                    Brand = "Nike",
                    Size = "42",
                    Color = "Đen",
                    BulkDiscountRules = "[{\"minQty\":2,\"discount\":5},{\"minQty\":5,\"discount\":10}]"
                },
                new Product
                {
                    Id = 2,
                    Name = "Adidas Ultraboost",
                    Description = "Giày chạy bộ Adidas Ultraboost",
                    Price = 4500000,
                    Stock = 30,
                    ImageUrl = "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500",
                    CategoryId = 1,
                    Brand = "Adidas",
                    Size = "41",
                    Color = "Trắng",
                    BulkDiscountRules = "[{\"minQty\":3,\"discount\":8},{\"minQty\":6,\"discount\":15}]"
                },
                new Product
                {
                    Id = 3,
                    Name = "Giày da Oxford",
                    Description = "Giày da Oxford cao cấp cho doanh nhân",
                    Price = 2800000,
                    Stock = 20,
                    ImageUrl = "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500",
                    CategoryId = 2,
                    Brand = "Clarks",
                    Size = "40",
                    Color = "Nâu"
                }
            );
        }
    }
}
