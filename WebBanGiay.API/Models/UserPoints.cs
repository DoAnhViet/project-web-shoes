namespace WebBanGiay.API.Models
{
    public class UserPoints
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int Points { get; set; } = 0;
        public int TotalEarned { get; set; } = 0;
        public int TotalRedeemed { get; set; } = 0;
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }

    public class PointsTransaction
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } = string.Empty; // "earn" or "redeem"
        public int Points { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? OrderCode { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
