using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.Middleware;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SalesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/sales - Get all sales (public)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSales()
        {
            var sales = await _context.Sales
                .Include(s => s.SaleProducts)
                .ThenInclude(sp => sp.Product)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return sales;
        }

        // GET: api/sales/active - Get only active sales (public)
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetActiveSales()
        {
            var sales = await _context.Sales
                .Where(s => s.IsActive)
                .Include(s => s.SaleProducts)
                .ThenInclude(sp => sp.Product)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return sales;
        }

        // GET: api/sales/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Sale>> GetSale(int id)
        {
            var sale = await _context.Sales
                .Include(s => s.SaleProducts)
                .ThenInclude(sp => sp.Product)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null)
            {
                return NotFound();
            }

            return sale;
        }

        // POST: api/sales - Create new sale (admin only)
        [HttpPost]
        [RequireAdmin]
        public async Task<ActionResult<Sale>> PostSale([FromBody] CreateSaleRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var sale = new Sale
            {
                Name = request.Name,
                Description = request.Description,
                DiscountPercent = request.DiscountPercent,
                IsActive = request.IsActive ?? true,
                StartDate = request.StartDate ?? DateTime.Now,
                EndDate = request.EndDate,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            // Add products to sale
            if (request.ProductIds != null && request.ProductIds.Count > 0)
            {
                foreach (var productId in request.ProductIds)
                {
                    var saleProduct = new SaleProduct
                    {
                        SaleId = sale.Id,
                        ProductId = productId
                    };
                    _context.SaleProducts.Add(saleProduct);
                }
                await _context.SaveChangesAsync();
            }

            // Reload sale with products
            var createdSale = await _context.Sales
                .Include(s => s.SaleProducts)
                .ThenInclude(sp => sp.Product)
                .FirstOrDefaultAsync(s => s.Id == sale.Id);

            return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, createdSale);
        }

        // PUT: api/sales/5 - Update sale (admin only)
        [HttpPut("{id}")]
        [RequireAdmin]
        public async Task<IActionResult> PutSale(int id, [FromBody] CreateSaleRequest request)
        {
            var sale = await _context.Sales
                .Include(s => s.SaleProducts)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null)
            {
                return NotFound();
            }

            sale.Name = request.Name;
            sale.Description = request.Description;
            sale.DiscountPercent = request.DiscountPercent;
            sale.IsActive = request.IsActive ?? true;
            sale.StartDate = request.StartDate ?? DateTime.Now;
            sale.EndDate = request.EndDate;
            sale.UpdatedAt = DateTime.Now;

            // Update products
            if (request.ProductIds != null)
            {
                // Remove old products
                _context.SaleProducts.RemoveRange(sale.SaleProducts);

                // Add new products
                foreach (var productId in request.ProductIds)
                {
                    var saleProduct = new SaleProduct
                    {
                        SaleId = sale.Id,
                        ProductId = productId
                    };
                    _context.SaleProducts.Add(saleProduct);
                }
            }

            _context.Sales.Update(sale);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/sales/5 - Delete sale (admin only)
        [HttpDelete("{id}")]
        [RequireAdmin]
        public async Task<IActionResult> DeleteSale(int id)
        {
            var sale = await _context.Sales.FindAsync(id);

            if (sale == null)
            {
                return NotFound();
            }

            _context.Sales.Remove(sale);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/sales/{id}/products - Add product to sale (admin only)
        [HttpPost("{id}/products")]
        [RequireAdmin]
        public async Task<IActionResult> AddProductToSale(int id, [FromBody] AddProductToSaleRequest request)
        {
            var sale = await _context.Sales.FindAsync(id);
            if (sale == null)
            {
                return NotFound("Sale not found");
            }

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            // Check if product already in sale
            var exists = await _context.SaleProducts
                .AnyAsync(sp => sp.SaleId == id && sp.ProductId == request.ProductId);

            if (!exists)
            {
                var saleProduct = new SaleProduct
                {
                    SaleId = id,
                    ProductId = request.ProductId
                };
                _context.SaleProducts.Add(saleProduct);
                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        // DELETE: api/sales/{id}/products/{productId} - Remove product from sale (admin only)
        [HttpDelete("{id}/products/{productId}")]
        [RequireAdmin]
        public async Task<IActionResult> RemoveProductFromSale(int id, int productId)
        {
            var saleProduct = await _context.SaleProducts
                .FirstOrDefaultAsync(sp => sp.SaleId == id && sp.ProductId == productId);

            if (saleProduct == null)
            {
                return NotFound();
            }

            _context.SaleProducts.Remove(saleProduct);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTOs
    public class CreateSaleRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountPercent { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<int> ProductIds { get; set; } = new List<int>();
    }

    public class AddProductToSaleRequest
    {
        public int ProductId { get; set; }
    }
}
