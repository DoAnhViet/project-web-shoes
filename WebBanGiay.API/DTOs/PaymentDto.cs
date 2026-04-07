namespace WebBanGiay.API.DTOs;

public class CreatePaymentDto
{
    public int OrderId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // "cod" hoặc "banking"
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class PaymentResponseDto
{
    public int Id { get; set; }
    public string PaymentCode { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? TransactionReference { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class BankingPaymentInfoDto
{
    public string AccountName { get; set; } = "DO ANH VIET";
    public string AccountNumber { get; set; } = "1907 3349 9870 13";
    public string BankName { get; set; } = "TECHCOMBANK";
    public string QrCodeUrl { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string TransferContent { get; set; } = string.Empty;
}

public class CompletePaymentDto
{
    public string TransactionReference { get; set; } = string.Empty;
    public string? Note { get; set; }
}