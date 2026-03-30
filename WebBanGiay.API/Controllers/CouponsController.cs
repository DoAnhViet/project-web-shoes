using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CouponsController> _logger;

        public CouponsController(ApplicationDbContext context, ILogger<CouponsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/coupons
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Coupon>>> GetCoupons()
        {
            var coupons = await _context.Coupons
                .Where(c => c.IsActive)
                .OrderBy(c => c.Code)
                .ToListAsync();
            
            return Ok(coupons);
        }

        // POST: api/coupons/validate
        [HttpPost("validate")]
        public async Task<ActionResult> ValidateCoupon([FromBody] ValidateCouponRequest request)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToUpper() == request.Code.ToUpper() && c.IsActive);

            if (coupon == null)
            {
                return BadRequest(new { message = "Mã giảm giá không hợp lệ" });
            }

            // Check expiry
            if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate.Value < DateTime.Now)
            {
                return BadRequest(new { message = "Mã giảm giá đã hết hạn" });
            }

            // Check usage limit
            if (coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit)
            {
                return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng" });
            }

            // Check min order amount
            if (request.OrderAmount < coupon.MinOrderAmount)
            {
                return BadRequest(new 
                { 
                    message = $"Đơn hàng tối thiểu {coupon.MinOrderAmount:N0}đ để sử dụng mã này" 
                });
            }

            // Calculate discount
            decimal discountAmount = 0;
            if (coupon.DiscountType == "percent")
            {
                discountAmount = request.OrderAmount * (coupon.DiscountValue / 100);
            }
            else if (coupon.DiscountType == "fixed")
            {
                discountAmount = coupon.DiscountValue;
            }

            return Ok(new
            {
                valid = true,
                coupon = new
                {
                    coupon.Code,
                    coupon.Description,
                    coupon.DiscountType,
                    coupon.DiscountValue
                },
                discountAmount = discountAmount,
                finalAmount = request.OrderAmount - discountAmount
            });
        }

        // POST: api/coupons/apply
        [HttpPost("apply")]
        public async Task<ActionResult> ApplyCoupon([FromBody] ApplyCouponRequest request)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToUpper() == request.Code.ToUpper() && c.IsActive);

            if (coupon == null)
            {
                return BadRequest(new { message = "Mã giảm giá không hợp lệ" });
            }

            // Increment usage count
            coupon.UsedCount++;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Coupon {coupon.Code} applied. Usage: {coupon.UsedCount}/{coupon.UsageLimit}");

            return Ok(new { message = "Áp dụng mã giảm giá thành công" });
        }

        public class ValidateCouponRequest
        {
            public string Code { get; set; } = string.Empty;
            public decimal OrderAmount { get; set; }
        }

        public class ApplyCouponRequest
        {
            public string Code { get; set; } = string.Empty;
        }
    }
}
