using System.Text.Json.Serialization;

namespace WebBanGiay.API.Models
{
    public class SaleProduct
    {
        public int SaleId { get; set; }
        
        // Don't serialize Sale to prevent circular references
        [JsonIgnore]
        public Sale Sale { get; set; } = null!;
        
        public int ProductId { get; set; }
        
        // Include Product details in JSON response
        public Product Product { get; set; } = null!;
    }
}
