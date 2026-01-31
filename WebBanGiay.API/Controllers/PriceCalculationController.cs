using Microsoft.AspNetCore.Mvc;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.PriceCalculators.Services;

namespace WebBanGiay.API.Controllers
{
    /// <summary>
    /// Controller for price calculation operations
    /// Demonstrates Decorator Pattern for composable price modifications
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PriceCalculationController : ControllerBase
    {
        private readonly ILogger<PriceCalculationController> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logger">Logger instance</param>
        public PriceCalculationController(ILogger<PriceCalculationController> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Calculate final price with multiple modifiers
        /// Demonstrates the Decorator Pattern with fluent API
        /// </summary>
        /// <param name="request">Price calculation request with modifiers</param>
        /// <returns>Calculated price with breakdown</returns>
        /// <response code="200">Price calculated successfully</response>
        /// <response code="400">Invalid request parameters</response>
        [HttpPost("calculate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<PriceCalculationDto> CalculatePrice([FromBody] PriceCalculationRequestDto request)
        {
            try
            {
                _logger.LogInformation("Price calculation requested with base price: {BasePrice}", request.BasePrice);

                // Validate base price
                if (request.BasePrice < 0)
                {
                    return BadRequest(new { error = "Base price cannot be negative" });
                }

                // Build calculator with decorators using fluent API
                var service = new PriceCalculationService();

                // Apply discount if provided
                if (request.DiscountPercentage.HasValue && request.DiscountPercentage.Value > 0)
                {
                    if (request.DiscountPercentage.Value < 0 || request.DiscountPercentage.Value > 100)
                    {
                        return BadRequest(new { error = "Discount percentage must be between 0 and 100" });
                    }
                    service.WithDiscount(request.DiscountPercentage.Value);
                }

                // Apply bulk discount if quantity provided
                if (request.Quantity.HasValue && request.Quantity.Value > 0)
                {
                    service.WithBulkDiscount(request.Quantity.Value);
                }

                // Apply tax if provided
                if (request.TaxPercentage.HasValue && request.TaxPercentage.Value > 0)
                {
                    if (request.TaxPercentage.Value < 0)
                    {
                        return BadRequest(new { error = "Tax percentage cannot be negative" });
                    }
                    service.WithTax(request.TaxPercentage.Value);
                }

                // Apply flat shipping if provided
                if (request.FlatShippingCost.HasValue && request.FlatShippingCost.Value > 0)
                {
                    service.WithFlatShipping(request.FlatShippingCost.Value);
                }

                // Apply percentage shipping if provided
                if (request.ShippingPercentage.HasValue && request.ShippingPercentage.Value > 0)
                {
                    if (request.ShippingPercentage.Value < 0)
                    {
                        return BadRequest(new { error = "Shipping percentage cannot be negative" });
                    }
                    service.WithPercentageShipping(request.ShippingPercentage.Value);
                }

                // Calculate final price
                var finalPrice = service.Calculate(request.BasePrice);

                // Build breakdown
                var breakdown = BuildBreakdown(request, service);

                // Calculate savings
                var savings = CalculateSavings(request.BasePrice, finalPrice);

                var response = new PriceCalculationDto
                {
                    FinalPrice = finalPrice,
                    Description = service.GetDescription(),
                    Breakdown = breakdown,
                    Savings = savings
                };

                _logger.LogInformation("Price calculation completed. Base: {Base}, Final: {Final}, Description: {Description}",
                    request.BasePrice, finalPrice, service.GetDescription());

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Invalid argument in price calculation: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during price calculation");
                return StatusCode(500, new { error = "An error occurred during calculation" });
            }
        }

        /// <summary>
        /// Get a simple price calculation example
        /// </summary>
        /// <returns>Example calculation</returns>
        [HttpGet("example")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<object> GetExample()
        {
            var example = new
            {
                description = "Example price calculation with multiple decorators",
                request = new
                {
                    basePrice = 100.00m,
                    discountPercentage = 10,
                    taxPercentage = 10,
                    flatShippingCost = 5.00m
                },
                response = new
                {
                    finalPrice = 104.50m,
                    description = "Base Price $100.00 → Discount 10% → Tax 10% → Shipping $5.00",
                    breakdown = new object[]
                    {
                        new { stepName = "Base Price", value = 100.00m, change = 0 },
                        new { stepName = "Discount 10%", value = 90.00m, change = -10.00m },
                        new { stepName = "Tax 10%", value = 99.00m, change = 9.00m },
                        new { stepName = "Shipping $5.00", value = 104.00m, change = 5.00m }
                    },
                    savings = 10.00m
                }
            };

            return Ok(example);
        }

        /// <summary>
        /// Build breakdown of price calculation steps
        /// </summary>
        private List<PriceBreakdownStep> BuildBreakdown(PriceCalculationRequestDto request, PriceCalculationService service)
        {
            var steps = new List<PriceBreakdownStep>();
            var currentPrice = request.BasePrice;

            // Base price
            steps.Add(new PriceBreakdownStep
            {
                StepName = $"Base Price ${request.BasePrice:F2}",
                Value = currentPrice,
                Change = 0
            });

            // Discount
            if (request.DiscountPercentage.HasValue && request.DiscountPercentage.Value > 0)
            {
                var previousPrice = currentPrice;
                currentPrice = previousPrice * (1 - request.DiscountPercentage.Value / 100);
                steps.Add(new PriceBreakdownStep
                {
                    StepName = $"Discount {request.DiscountPercentage.Value}%",
                    Value = Math.Round(currentPrice, 2),
                    Change = Math.Round(currentPrice - previousPrice, 2)
                });
            }

            // Bulk discount
            if (request.Quantity.HasValue && request.Quantity.Value > 0)
            {
                // This would be calculated based on quantity tiers
                // Keeping simple for example
            }

            // Tax
            if (request.TaxPercentage.HasValue && request.TaxPercentage.Value > 0)
            {
                var previousPrice = currentPrice;
                currentPrice = previousPrice * (1 + request.TaxPercentage.Value / 100);
                steps.Add(new PriceBreakdownStep
                {
                    StepName = $"Tax {request.TaxPercentage.Value}%",
                    Value = Math.Round(currentPrice, 2),
                    Change = Math.Round(currentPrice - previousPrice, 2)
                });
            }

            // Flat shipping
            if (request.FlatShippingCost.HasValue && request.FlatShippingCost.Value > 0)
            {
                var previousPrice = currentPrice;
                currentPrice = previousPrice + request.FlatShippingCost.Value;
                steps.Add(new PriceBreakdownStep
                {
                    StepName = $"Shipping ${request.FlatShippingCost.Value:F2}",
                    Value = Math.Round(currentPrice, 2),
                    Change = request.FlatShippingCost.Value
                });
            }

            // Percentage shipping
            if (request.ShippingPercentage.HasValue && request.ShippingPercentage.Value > 0)
            {
                var previousPrice = currentPrice;
                currentPrice = previousPrice * (1 + request.ShippingPercentage.Value / 100);
                steps.Add(new PriceBreakdownStep
                {
                    StepName = $"Shipping {request.ShippingPercentage.Value}%",
                    Value = Math.Round(currentPrice, 2),
                    Change = Math.Round(currentPrice - previousPrice, 2)
                });
            }

            return steps;
        }

        /// <summary>
        /// Calculate total savings from original price
        /// </summary>
        private decimal CalculateSavings(decimal basePrice, decimal finalPrice)
        {
            return Math.Max(0, basePrice - finalPrice);
        }
    }
}
