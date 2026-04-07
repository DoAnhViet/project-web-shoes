using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;
using WebBanGiay.API.Services.Payment;
using WebBanGiay.API.Middleware;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPaymentProcessorFactory _paymentFactory;
        private readonly ILogger<PaymentsController> _logger;

        // Bank account info for QR payments
        private const string BANK_ACCOUNT_NAME = "DO ANH VIET";
        private const string BANK_ACCOUNT_NUMBER = "1907 3349 9870 13";
        private const string BANK_NAME = "TECHCOMBANK";

        public PaymentsController(
            ApplicationDbContext context, 
            IPaymentProcessorFactory paymentFactory,
            ILogger<PaymentsController> logger)
        {
            _context = context;
            _paymentFactory = paymentFactory;
            _logger = logger;
        }

        /// <summary>
        /// Create a new payment
        /// POST /api/payments
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<PaymentResponseDto>> CreatePayment([FromBody] CreatePaymentDto dto)
        {
            try
            {
                // Validate order exists
                var order = await _context.Orders.FindAsync(dto.OrderId);
                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                // Validate payment method
                if (dto.PaymentMethod != "cod" && dto.PaymentMethod != "banking")
                {
                    return BadRequest(new { message = "Payment method must be 'cod' or 'banking'" });
                }

                // Generate payment code
                var paymentCode = "PAY" + DateTime.UtcNow.Ticks.ToString("X").ToUpper();

                // Create payment record
                var payment = new Payment
                {
                    PaymentCode = paymentCode,
                    OrderId = dto.OrderId,
                    PaymentMethod = dto.PaymentMethod,
                    Amount = dto.Amount,
                    Status = dto.PaymentMethod == "cod" ? "pending" : "pending",
                    Note = dto.Note,
                    CreatedAt = DateTime.UtcNow
                };

                // Add banking info for QR payments
                if (dto.PaymentMethod == "banking")
                {
                    payment.BankAccountName = BANK_ACCOUNT_NAME;
                    payment.BankAccountNumber = BANK_ACCOUNT_NUMBER;
                    payment.BankName = BANK_NAME;
                    // In real implementation, you would generate actual QR code URL
                    payment.QrCodeUrl = $"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="; // Placeholder
                }

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                // Use Factory Pattern to process payment
                var processor = _paymentFactory.CreatePaymentProcessor(dto.PaymentMethod);
                var processResult = await processor.ProcessPaymentAsync(dto.Amount, paymentCode);

                _logger.LogInformation($"Payment created: {paymentCode}, Method: {dto.PaymentMethod}");

                return Ok(new PaymentResponseDto
                {
                    Id = payment.Id,
                    PaymentCode = payment.PaymentCode,
                    OrderId = payment.OrderId,
                    PaymentMethod = payment.PaymentMethod,
                    Amount = payment.Amount,
                    Status = payment.Status,
                    BankAccountName = payment.BankAccountName,
                    BankAccountNumber = payment.BankAccountNumber,
                    BankName = payment.BankName,
                    QrCodeUrl = payment.QrCodeUrl,
                    TransactionReference = payment.TransactionReference,
                    Note = payment.Note,
                    CreatedAt = payment.CreatedAt,
                    CompletedAt = payment.CompletedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating payment: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get payment by ID
        /// GET /api/payments/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentResponseDto>> GetPayment(int id)
        {
            try
            {
                var payment = await _context.Payments
                    .Include(p => p.Order)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }

                return Ok(new PaymentResponseDto
                {
                    Id = payment.Id,
                    PaymentCode = payment.PaymentCode,
                    OrderId = payment.OrderId,
                    PaymentMethod = payment.PaymentMethod,
                    Amount = payment.Amount,
                    Status = payment.Status,
                    BankAccountName = payment.BankAccountName,
                    BankAccountNumber = payment.BankAccountNumber,
                    BankName = payment.BankName,
                    QrCodeUrl = payment.QrCodeUrl,
                    TransactionReference = payment.TransactionReference,
                    Note = payment.Note,
                    CreatedAt = payment.CreatedAt,
                    CompletedAt = payment.CompletedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting payment: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get banking info for QR payment
        /// GET /api/payments/banking-info/{paymentId}
        /// </summary>
        [HttpGet("banking-info/{paymentId}")]
        public async Task<ActionResult<BankingPaymentInfoDto>> GetBankingInfo(int paymentId)
        {
            try
            {
                var payment = await _context.Payments.FindAsync(paymentId);
                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }

                if (payment.PaymentMethod != "banking")
                {
                    return BadRequest(new { message = "Payment is not a banking payment" });
                }

                return Ok(new BankingPaymentInfoDto
                {
                    AccountName = BANK_ACCOUNT_NAME,
                    AccountNumber = BANK_ACCOUNT_NUMBER,
                    BankName = BANK_NAME,
                    QrCodeUrl = payment.QrCodeUrl ?? "",
                    Amount = payment.Amount,
                    TransferContent = $"Thanh toan don hang {payment.PaymentCode}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting banking info: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Complete a payment (for banking method)
        /// POST /api/payments/{id}/complete
        /// </summary>
        [HttpPost("{id}/complete")]
        [AllowAnonymous]
        public async Task<ActionResult> CompletePayment(int id, [FromBody] CompletePaymentDto dto)
        {
            try
            {
                var payment = await _context.Payments
                    .Include(p => p.Order)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }

                if (payment.Status != "pending")
                {
                    return BadRequest(new { message = "Payment is not pending" });
                }

                // Update payment status
                payment.Status = "completed";
                payment.CompletedAt = DateTime.UtcNow;
                payment.TransactionReference = dto.TransactionReference;
                if (!string.IsNullOrEmpty(dto.Note))
                {
                    payment.Note = dto.Note;
                }

                // Update order payment status
                payment.Order.PaymentStatus = "completed";

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment completed: {payment.PaymentCode}");

                return Ok(new { message = "Payment completed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error completing payment: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get payment history (admin only)
        /// GET /api/payments
        /// </summary>
        [HttpGet]
        [RequireAdmin]
        public async Task<ActionResult<PagedResult<PaymentResponseDto>>> GetPayments(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            try
            {
                var query = _context.Payments.Include(p => p.Order).AsQueryable();

                // Filter by status if provided
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(p => p.Status == status);
                }

                var totalCount = await query.CountAsync();

                var payments = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new PaymentResponseDto
                    {
                        Id = p.Id,
                        PaymentCode = p.PaymentCode,
                        OrderId = p.OrderId,
                        PaymentMethod = p.PaymentMethod,
                        Amount = p.Amount,
                        Status = p.Status,
                        BankAccountName = p.BankAccountName,
                        BankAccountNumber = p.BankAccountNumber,
                        BankName = p.BankName,
                        QrCodeUrl = p.QrCodeUrl,
                        TransactionReference = p.TransactionReference,
                        Note = p.Note,
                        CreatedAt = p.CreatedAt,
                        CompletedAt = p.CompletedAt
                    })
                    .ToListAsync();

                return Ok(new PagedResult<PaymentResponseDto>
                {
                    Items = payments,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting payments: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}