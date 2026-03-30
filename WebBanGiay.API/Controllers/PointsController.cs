using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PointsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PointsController> _logger;
        
        // Points earning rate: 1000 VND = 1 point
        private const decimal EARN_RATE = 1000;
        // Points redemption rate: 100 points = 10,000 VND
        private const int REDEEM_RATE = 100;
        private const decimal REDEEM_VALUE = 10000;

        public PointsController(ApplicationDbContext context, ILogger<PointsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/points/{userId}
        [HttpGet("{userId}")]
        public async Task<ActionResult> GetUserPoints(int userId)
        {
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == userId);
            
            if (userPoints == null)
            {
                // Create new points record if doesn't exist
                userPoints = new UserPoints { UserId = userId, Points = 0 };
                _context.UserPoints.Add(userPoints);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                userId = userPoints.UserId,
                points = userPoints.Points,
                totalEarned = userPoints.TotalEarned,
                totalRedeemed = userPoints.TotalRedeemed,
                redeemValue = (userPoints.Points / REDEEM_RATE) * REDEEM_VALUE,
                rates = new
                {
                    earnRate = $"1000đ = 1 điểm",
                    redeemRate = $"100 điểm = 10.000đ"
                }
            });
        }

        // POST: api/points/earn
        [HttpPost("earn")]
        public async Task<ActionResult> EarnPoints([FromBody] EarnPointsRequest request)
        {
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == request.UserId);
            
            if (userPoints == null)
            {
                userPoints = new UserPoints { UserId = request.UserId };
                _context.UserPoints.Add(userPoints);
            }

            // Calculate points: orderAmount / 1000 = points
            int pointsToAdd = (int)(request.OrderAmount / EARN_RATE);
            
            userPoints.Points += pointsToAdd;
            userPoints.TotalEarned += pointsToAdd;
            userPoints.LastUpdated = DateTime.Now;

            // Record transaction
            var transaction = new PointsTransaction
            {
                UserId = request.UserId,
                Type = "earn",
                Points = pointsToAdd,
                Description = $"Mua hàng đơn {request.OrderCode}",
                OrderCode = request.OrderCode
            };
            _context.PointsTransactions.Add(transaction);

            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {request.UserId} earned {pointsToAdd} points from order {request.OrderCode}");

            return Ok(new
            {
                success = true,
                pointsEarned = pointsToAdd,
                newBalance = userPoints.Points,
                message = $"Bạn đã nhận {pointsToAdd} điểm thưởng!"
            });
        }

        // POST: api/points/redeem
        [HttpPost("redeem")]
        public async Task<ActionResult> RedeemPoints([FromBody] RedeemPointsRequest request)
        {
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == request.UserId);
            
            if (userPoints == null || userPoints.Points < request.PointsToRedeem)
            {
                return BadRequest(new { message = "Không đủ điểm để đổi thưởng" });
            }

            if (request.PointsToRedeem % REDEEM_RATE != 0)
            {
                return BadRequest(new { message = $"Điểm phải là bội số của {REDEEM_RATE}" });
            }

            decimal discountAmount = (request.PointsToRedeem / REDEEM_RATE) * REDEEM_VALUE;

            userPoints.Points -= request.PointsToRedeem;
            userPoints.TotalRedeemed += request.PointsToRedeem;
            userPoints.LastUpdated = DateTime.Now;

            // Record transaction
            var transaction = new PointsTransaction
            {
                UserId = request.UserId,
                Type = "redeem",
                Points = request.PointsToRedeem,
                Description = $"Đổi điểm giảm giá: {discountAmount:N0}đ"
            };
            _context.PointsTransactions.Add(transaction);

            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {request.UserId} redeemed {request.PointsToRedeem} points for {discountAmount}đ discount");

            return Ok(new
            {
                success = true,
                pointsRedeemed = request.PointsToRedeem,
                discountAmount = discountAmount,
                newBalance = userPoints.Points,
                message = $"Đã đổi {request.PointsToRedeem} điểm = {discountAmount:N0}đ giảm giá"
            });
        }

        // GET: api/points/{userId}/history
        [HttpGet("{userId}/history")]
        public async Task<ActionResult> GetPointsHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var transactions = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId)
                .OrderByDescending(pt => pt.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var total = await _context.PointsTransactions.CountAsync(pt => pt.UserId == userId);

            return Ok(new
            {
                transactions = transactions,
                page = page,
                pageSize = pageSize,
                totalCount = total,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }

        public class EarnPointsRequest
        {
            public int UserId { get; set; }
            public decimal OrderAmount { get; set; }
            public string OrderCode { get; set; } = string.Empty;
        }

        public class RedeemPointsRequest
        {
            public int UserId { get; set; }
            public int PointsToRedeem { get; set; }
        }
    }
}
