namespace WebBanGiay.API.Models;

public class Payment
{
    public int Id { get; set; }
    public string PaymentCode { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // "cod" hoặc "banking"
    public decimal Amount { get; set; }
    public string Status { get; set; } = "pending"; // pending, completed, failed, cancelled
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? TransactionReference { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    // Navigation property
    public Order Order { get; set; } = null!;
}