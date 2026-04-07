namespace WebBanGiay.API.Models
{
    public class Sale
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountPercent { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime StartDate { get; set; } = DateTime.Now;
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Many-to-Many relationship with Product
        public ICollection<SaleProduct> SaleProducts { get; set; } = new List<SaleProduct>();
    }
}
