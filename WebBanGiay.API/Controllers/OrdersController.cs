using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Middleware;
using WebBanGiay.API.Models;
using WebBanGiay.API.Services;
using WebBanGiay.API.Services.PricingStrategies;
using WebBanGiay.API.Services.Commands;
using WebBanGiay.API.Services.Notifications;
using WebBanGiay.API.Services.OrderStates;
using WebBanGiay.API.Services.Builders;
using WebBanGiay.API.PriceCalculators.Services;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrdersController> _logger;
        private readonly ILoggerService _loggerService;              // Pattern 1: Singleton
        private readonly IPricingContext _pricingContext;              // Pattern 2: Strategy
        private readonly ICommandInvoker _commandInvoker;             // Pattern 4: Command
        private readonly INotificationService _notificationService;   // Pattern 6: Adapter
        private readonly IOrderStateManager _orderStateManager;       // Pattern 7: State

        public OrdersController(
            ApplicationDbContext context,
            ILogger<OrdersController> logger,
            ILoggerService loggerService,
            IPricingContext pricingContext,
            ICommandInvoker commandInvoker,
            INotificationService notificationService,
            IOrderStateManager orderStateManager)
        {
            _context = context;
            _logger = logger;
            _loggerService = loggerService;
            _pricingContext = pricingContext;
            _commandInvoker = commandInvoker;
            _notificationService = notificationService;
            _orderStateManager = orderStateManager;
        }

        /// <summary>
        /// Get all orders with pagination
        /// GET /api/orders?pageNumber=1&pageSize=10&status=pending
        /// </summary>
        [HttpGet]
        [RequireAdmin]
        public async Task<ActionResult<PagedResult<OrderResponseDto>>> GetOrders(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? email = null)
        {
            try
            {
                var query = _context.Orders
                    .Include(o => o.OrderItems)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(o => o.Status == status);
                }

                if (!string.IsNullOrEmpty(email))
                {
                    query = query.Where(o => o.Email == email);
                }

                var totalItems = await query.CountAsync();
                var orders = await query
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var orderDtos = orders.Select(MapToResponseDto).ToList();

                return Ok(new PagedResult<OrderResponseDto>
                {
                    Items = orderDtos,
                    TotalCount = totalItems,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders");
                return StatusCode(500, new { message = "Error getting orders" });
            }
        }

        /// <summary>
        /// Get orders for a specific customer by email
        /// GET /api/orders/my?email=user@example.com
        /// </summary>
        [HttpGet("my")]
        public async Task<ActionResult<PagedResult<OrderResponseDto>>> GetMyOrders(
            [FromQuery] string email,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                var query = _context.Orders
                    .Include(o => o.OrderItems)
                    .Where(o => o.Email == email);

                var totalItems = await query.CountAsync();
                var orders = await query
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var orderDtos = orders.Select(MapToResponseDto).ToList();

                return Ok(new PagedResult<OrderResponseDto>
                {
                    Items = orderDtos,
                    TotalCount = totalItems,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders for email {Email}", email);
                return StatusCode(500, new { message = "Error getting orders" });
            }
        }

        /// <summary>
        /// Get order by ID
        /// GET /api/orders/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(int id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order {Id}", id);
                return StatusCode(500, new { message = "Error getting order" });
            }
        }

        /// <summary>
        /// Get order by order code
        /// GET /api/orders/code/ORD123ABC
        /// </summary>
        [HttpGet("code/{orderCode}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrderByCode(string orderCode)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by code {OrderCode}", orderCode);
                return StatusCode(500, new { message = "Error getting order" });
            }
        }

        /// <summary>
        /// Create a new order
        /// POST /api/orders
        /// Uses: Strategy (pricing), Decorator (price calc), Builder (order construction),
        ///       Command (persistence), Singleton (logging), Adapter (notification)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderDto dto)
        {
            try
            {
                // Validate
                if (string.IsNullOrEmpty(dto.FullName) || string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.Address))
                {
                    return BadRequest(new { message = "Full name, phone and address are required" });
                }

                if (dto.Items == null || dto.Items.Count == 0)
                {
                    return BadRequest(new { message = "Order must have at least one item" });
                }

                // ============ STRATEGY PATTERN ============
                // Select pricing strategy based on order characteristics
                var totalQuantity = dto.Items.Sum(i => i.Quantity);
                var strategy = _pricingContext.ResolveStrategy(totalQuantity, isVip: false, isSeasonalSale: false);
                _pricingContext.SetStrategy(strategy);
                _loggerService.LogInfo($"[Strategy] Selected pricing strategy: {strategy.GetName()} for quantity {totalQuantity}");

                // Calculate subtotal using the selected strategy
                var subtotal = dto.Items.Sum(i => _pricingContext.CalculatePrice(i.Price, i.Quantity));

                // ============ DECORATOR PATTERN ============
                // Build price calculation chain with decorators
                var priceService = new PriceCalculationService();
                var shippingFee = subtotal >= 500000 ? 0m : 30000m;
                if (shippingFee > 0)
                {
                    priceService.WithFlatShipping(shippingFee);
                }
                var decoratedTotal = priceService.Calculate(subtotal);
                _loggerService.LogInfo($"[Decorator] Price calculation: base={subtotal}, decorated={decoratedTotal}, shipping={shippingFee}");

                // Use frontend discount (bulk + coupon + points) for backward compatibility
                var discount = dto.Discount;
                var total = decoratedTotal - discount;

                // ============ BUILDER PATTERN ============
                // Construct order using fluent builder API
                var orderItems = dto.Items.Select(i => new OrderItem
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    ProductImage = i.ProductImage,
                    Size = i.Size,
                    Color = i.Color,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    LineTotal = i.Price * i.Quantity
                }).ToList();

                var order = new OrderBuilder()
                    .SetCustomerInfo(dto.UserId, dto.FullName, dto.Email, dto.Phone)
                    .SetShippingAddress(dto.Address, dto.City, dto.District, dto.Ward)
                    .SetNote(dto.Note)
                    .SetPricing(subtotal, shippingFee, discount, total)
                    .SetPayment(dto.PaymentMethod)
                    .AddItems(orderItems)
                    .Build();

                _loggerService.LogInfo($"[Builder] Order built: {order.OrderCode}, items={order.OrderItems.Count}");

                // ============ COMMAND PATTERN ============
                // Execute order creation through command invoker
                var createCommand = new CreateOrderCommand(_context, order, _loggerService);
                var createdOrder = await _commandInvoker.ExecuteCommandAsync(createCommand);

                // ============ SINGLETON PATTERN ============
                // Log business event using singleton logger service
                _loggerService.LogInfo($"[Singleton] Order {order.OrderCode} created. Strategy: {strategy.GetName()}, Total: {total}");

                // ============ ADAPTER PATTERN ============
                // Send notification via adapted email channel
                try
                {
                    await _notificationService.SendNotificationAsync(
                        dto.Email,
                        $"Your order {order.OrderCode} has been placed. Total: {total:N0} VND",
                        "email",
                        "Order Confirmation - WebBanGiay");
                }
                catch (Exception notifEx)
                {
                    _loggerService.LogWarning($"Notification failed (non-critical): {notifEx.Message}");
                }

                return CreatedAtAction(nameof(GetOrder), new { id = createdOrder.Id }, MapToResponseDto(createdOrder));
            }
            catch (Exception ex)
            {
                _loggerService.LogError("Error creating order", ex);
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { message = "Error creating order" });
            }
        }

        /// <summary>
        /// Update order status
        /// PUT /api/orders/5/status
        /// Uses: State (transition validation), Singleton (logging), Adapter (notification)
        /// </summary>
        [HttpPut("{id}/status")]
        [RequireAdmin]
        public async Task<ActionResult<OrderResponseDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                var currentStatus = order.Status.ToLower();
                var newStatus = dto.Status.ToLower();

                // ============ STATE PATTERN ============
                // Validate status transition using State objects
                if (!_orderStateManager.IsValidTransition(currentStatus, newStatus))
                {
                    var allowed = _orderStateManager.GetAllowedTransitions(currentStatus);
                    _loggerService.LogWarning($"[State] Invalid transition: {currentStatus} -> {newStatus}");
                    return BadRequest(new
                    {
                        message = $"Cannot change status from '{currentStatus}' to '{newStatus}'. Invalid transition.",
                        allowedTransitions = allowed
                    });
                }

                order.Status = newStatus;
                order.UpdatedAt = DateTime.UtcNow;

                // Auto-complete payment when delivered with COD
                if (order.Status == "delivered" && order.PaymentMethod == "cod")
                {
                    order.PaymentStatus = "completed";
                }

                await _context.SaveChangesAsync();

                // ============ SINGLETON PATTERN ============
                _loggerService.LogInfo($"[State] Order {id} status: {currentStatus} -> {newStatus}");

                // ============ ADAPTER PATTERN ============
                try
                {
                    await _notificationService.SendNotificationAsync(
                        order.Email,
                        $"Your order {order.OrderCode} status has been updated to: {newStatus}",
                        "email",
                        "Order Status Update - WebBanGiay");
                }
                catch (Exception notifEx)
                {
                    _loggerService.LogWarning($"Notification failed (non-critical): {notifEx.Message}");
                }

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _loggerService.LogError("Error updating order status", ex);
                _logger.LogError(ex, "Error updating order status");
                return StatusCode(500, new { message = "Error updating order status" });
            }
        }

        /// <summary>
        /// Update payment status
        /// PUT /api/orders/5/payment-status
        /// </summary>
        [HttpPut("{id}/payment-status")]
        [RequireAdmin]
        public async Task<ActionResult<OrderResponseDto>> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                var validStatuses = new[] { "pending", "completed" };
                if (!validStatuses.Contains(dto.PaymentStatus.ToLower()))
                {
                    return BadRequest(new { message = "Invalid payment status. Valid values: pending, completed" });
                }

                order.PaymentStatus = dto.PaymentStatus.ToLower();
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _loggerService.LogInfo($"Order {id} payment status updated to {dto.PaymentStatus}");

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment status");
                return StatusCode(500, new { message = "Error updating payment status" });
            }
        }

        /// <summary>
        /// Cancel order
        /// DELETE /api/orders/5
        /// Uses: State (validation), Command (execution), Adapter (notification)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> CancelOrder(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                // ============ STATE PATTERN ============
                if (!_orderStateManager.IsValidTransition(order.Status, "cancelled"))
                {
                    return BadRequest(new { message = $"Cannot cancel order with status '{order.Status}'" });
                }

                // ============ COMMAND PATTERN ============
                var cancelCommand = new CancelOrderCommand(_context, id, _loggerService);
                await _commandInvoker.ExecuteCommandAsync(cancelCommand);

                // ============ SINGLETON PATTERN ============
                _loggerService.LogInfo($"Order {id} cancelled successfully");

                // ============ ADAPTER PATTERN ============
                try
                {
                    await _notificationService.SendNotificationAsync(
                        order.Email,
                        $"Your order {order.OrderCode} has been cancelled.",
                        "email",
                        "Order Cancelled - WebBanGiay");
                }
                catch (Exception notifEx)
                {
                    _loggerService.LogWarning($"Notification failed (non-critical): {notifEx.Message}");
                }

                return Ok(new { message = "Order cancelled successfully" });
            }
            catch (Exception ex)
            {
                _loggerService.LogError("Error cancelling order", ex);
                _logger.LogError(ex, "Error cancelling order");
                return StatusCode(500, new { message = "Error cancelling order" });
            }
        }

        /// <summary>
        /// Get order statistics
        /// GET /api/orders/stats
        /// </summary>
        [HttpGet("stats")]
        [RequireAdmin]
        public async Task<ActionResult> GetOrderStats()
        {
            try
            {
                var stats = new
                {
                    total = await _context.Orders.CountAsync(),
                    pending = await _context.Orders.CountAsync(o => o.Status == "pending"),
                    confirmed = await _context.Orders.CountAsync(o => o.Status == "confirmed"),
                    shipping = await _context.Orders.CountAsync(o => o.Status == "shipping"),
                    delivered = await _context.Orders.CountAsync(o => o.Status == "delivered"),
                    cancelled = await _context.Orders.CountAsync(o => o.Status == "cancelled"),
                    totalRevenue = await _context.Orders.Where(o => o.Status == "delivered").SumAsync(o => o.Total)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order stats");
                return StatusCode(500, new { message = "Error getting order stats" });
            }
        }

        private static OrderResponseDto MapToResponseDto(Order order)
        {
            return new OrderResponseDto
            {
                Id = order.Id,
                OrderCode = order.OrderCode,
                UserId = order.UserId,
                FullName = order.FullName,
                Email = order.Email,
                Phone = order.Phone,
                Address = order.Address,
                City = order.City,
                District = order.District,
                Ward = order.Ward,
                Note = order.Note,
                Subtotal = order.Subtotal,
                ShippingFee = order.ShippingFee,
                Discount = order.Discount,
                Total = order.Total,
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentStatus,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                Items = order.OrderItems.Select(i => new OrderItemResponseDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    ProductImage = i.ProductImage,
                    Size = i.Size,
                    Color = i.Color,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    LineTotal = i.LineTotal
                }).ToList()
            };
        }
    }
}
