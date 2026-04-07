using WebBanGiay.API.Models;

namespace WebBanGiay.API.Services.Builders
{
    /// <summary>
    /// Builder Pattern - Fluent API for constructing complex Order objects
    /// Replaces manual 15+ field assignment with a clean, readable builder chain
    /// </summary>
    public interface IOrderBuilder
    {
        IOrderBuilder SetCustomerInfo(int? userId, string fullName, string email, string phone);
        IOrderBuilder SetShippingAddress(string address, string city, string district, string ward);
        IOrderBuilder SetNote(string? note);
        IOrderBuilder SetPricing(decimal subtotal, decimal shippingFee, decimal discount, decimal total);
        IOrderBuilder SetPayment(string paymentMethod);
        IOrderBuilder AddItem(OrderItem item);
        IOrderBuilder AddItems(IEnumerable<OrderItem> items);
        Order Build();
    }

    public class OrderBuilder : IOrderBuilder
    {
        private readonly Order _order;

        public OrderBuilder()
        {
            _order = new Order
            {
                OrderCode = "ORD" + DateTime.UtcNow.Ticks.ToString("X").ToUpper(),
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>()
            };
        }

        public IOrderBuilder SetCustomerInfo(int? userId, string fullName, string email, string phone)
        {
            _order.UserId = userId;
            _order.FullName = fullName;
            _order.Email = email;
            _order.Phone = phone;
            return this;
        }

        public IOrderBuilder SetShippingAddress(string address, string city, string district, string ward)
        {
            _order.Address = address;
            _order.City = city;
            _order.District = district;
            _order.Ward = ward;
            return this;
        }

        public IOrderBuilder SetNote(string? note)
        {
            _order.Note = note;
            return this;
        }

        public IOrderBuilder SetPricing(decimal subtotal, decimal shippingFee, decimal discount, decimal total)
        {
            _order.Subtotal = subtotal;
            _order.ShippingFee = shippingFee;
            _order.Discount = discount;
            _order.Total = total;
            return this;
        }

        public IOrderBuilder SetPayment(string paymentMethod)
        {
            _order.PaymentMethod = paymentMethod;
            _order.PaymentStatus = paymentMethod == "cod" ? "pending" : "completed";
            return this;
        }

        public IOrderBuilder AddItem(OrderItem item)
        {
            _order.OrderItems.Add(item);
            return this;
        }

        public IOrderBuilder AddItems(IEnumerable<OrderItem> items)
        {
            foreach (var item in items)
                _order.OrderItems.Add(item);
            return this;
        }

        public Order Build()
        {
            if (string.IsNullOrEmpty(_order.FullName))
                throw new InvalidOperationException("Customer name is required");
            if (!_order.OrderItems.Any())
                throw new InvalidOperationException("Order must have at least one item");

            return _order;
        }
    }
}
