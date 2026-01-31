namespace WebBanGiay.API.Services.Commands
{
    /// <summary>
    /// Command pattern interface for order operations
    /// </summary>
    public interface ICommand
    {
        Task ExecuteAsync();
    }

    /// <summary>
    /// DTO for order command
    /// </summary>
    public class OrderCommandDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
    }

    /// <summary>
    /// Command to create an order
    /// </summary>
    public class CreateOrderCommand : ICommand
    {
        private readonly OrderCommandDto _orderData;
        private readonly ILogger<CreateOrderCommand> _logger;

        public CreateOrderCommand(OrderCommandDto orderData, ILogger<CreateOrderCommand> logger)
        {
            _orderData = orderData;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            _logger.LogInformation("📦 Executing CreateOrderCommand for Product {ProductId}, Quantity {Quantity}",
                _orderData.ProductId, _orderData.Quantity);

            // Simulate order creation logic
            await Task.Delay(100);

            _logger.LogInformation("✅ Order created successfully for customer {CustomerEmail}",
                _orderData.CustomerEmail);
        }
    }

    /// <summary>
    /// Command to cancel an order
    /// </summary>
    public class CancelOrderCommand : ICommand
    {
        private readonly int _orderId;
        private readonly ILogger<CancelOrderCommand> _logger;

        public CancelOrderCommand(int orderId, ILogger<CancelOrderCommand> logger)
        {
            _orderId = orderId;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            _logger.LogInformation("❌ Cancelling order {OrderId}", _orderId);
            await Task.Delay(50);
            _logger.LogInformation("✅ Order {OrderId} cancelled successfully", _orderId);
        }
    }

    /// <summary>
    /// Command invoker to execute commands
    /// </summary>
    public interface ICommandInvoker
    {
        Task ExecuteCommandAsync(ICommand command);
    }

    public class CommandInvoker : ICommandInvoker
    {
        private readonly ILogger<CommandInvoker> _logger;

        public CommandInvoker(ILogger<CommandInvoker> logger)
        {
            _logger = logger;
        }

        public async Task ExecuteCommandAsync(ICommand command)
        {
            try
            {
                _logger.LogInformation("⚙️ Invoking command: {CommandType}", command.GetType().Name);
                await command.ExecuteAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Command execution failed");
                throw;
            }
        }
    }
}
