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

            // Seed categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Giày thể thao", Description = "Giày dành cho hoạt động thể thao" },
                new Category { Id = 2, Name = "Giày công sở", Description = "Giày lịch sự cho môi trường công sở" },
                new Category { Id = 3, Name = "Giày sneaker", Description = "Giày sneaker phong cách" }
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
                    ImageUrl = "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/u3rcvb1r7e9bjpxynzfn/air-max-270-mens-shoes-KkLcGR.png",
                    CategoryId = 1,
                    Brand = "Nike",
                    Size = "42",
                    Color = "Đen"
                },
                new Product
                {
                    Id = 2,
                    Name = "Adidas Ultraboost",
                    Description = "Giày chạy bộ Adidas Ultraboost",
                    Price = 4500000,
                    Stock = 30,
                    ImageUrl = "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_Light_Shoes_Black_GY9350_01_standard.jpg",
                    CategoryId = 1,
                    Brand = "Adidas",
                    Size = "41",
                    Color = "Trắng"
                },
                new Product
                {
                    Id = 3,
                    Name = "Giày da Oxford",
                    Description = "Giày da Oxford cao cấp cho doanh nhân",
                    Price = 2800000,
                    Stock = 20,
                    ImageUrl = "https://product.hstatic.net/200000033444/product/den_d_1_e7bb8cbe65014a1da5ca53e7b28cc42d_master.jpg",
                    CategoryId = 2,
                    Brand = "Clarks",
                    Size = "40",
                    Color = "Nâu"
                }
            );
        }
    }
}
