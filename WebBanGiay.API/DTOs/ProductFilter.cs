namespace WebBanGiay.API.DTOs
{
    /// <summary>
    /// Filter criteria for product queries
    /// </summary>
    public class ProductFilter
    {
        public string? SearchKeyword { get; set; }
        public int? CategoryId { get; set; }
        public string? Brand { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? Gender { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
