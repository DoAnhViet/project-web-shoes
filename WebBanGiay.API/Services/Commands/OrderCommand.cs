using WebBanGiay.API.Data;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Services.Commands
{
    /// <summary>
    /// Command Pattern - Interface for commands that return a result
    /// </summary>
    public interface ICommand<TResult>
    {
        Task<TResult> ExecuteAsync();
    }

    /// <summary>
    /// Command Pattern - Interface for void commands
    /// </summary>
    public interface ICommand
    {
        Task ExecuteAsync();
    }

    /// <summary>
    /// Command Pattern - Creates an order in the database
    /// Encapsulates the order persistence logic as a command object
    /// </summary>
    public class CreateOrderCommand : ICommand<Order>
    {
        private readonly ApplicationDbContext _context;
        private readonly Order _order;
        private readonly ILoggerService _loggerService;

        public CreateOrderCommand(ApplicationDbContext context, Order order, ILoggerService loggerService)
        {
            _context = context;
            _order = order;
            _loggerService = loggerService;
        }

        public async Task<Order> ExecuteAsync()
        {
            _loggerService.LogInfo($"Executing CreateOrderCommand for order {_order.OrderCode}");
            _context.Orders.Add(_order);
            await _context.SaveChangesAsync();
            _loggerService.LogInfo($"Order {_order.OrderCode} persisted successfully with ID {_order.Id}");
            return _order;
        }
    }

    /// <summary>
    /// Command Pattern - Cancels an order in the database
    /// Encapsulates the order cancellation logic as a command object
    /// </summary>
    public class CancelOrderCommand : ICommand
    {
        private readonly ApplicationDbContext _context;
        private readonly int _orderId;
        private readonly ILoggerService _loggerService;

        public CancelOrderCommand(ApplicationDbContext context, int orderId, ILoggerService loggerService)
        {
            _context = context;
            _orderId = orderId;
            _loggerService = loggerService;
        }

        public async Task ExecuteAsync()
        {
            var order = await _context.Orders.FindAsync(_orderId);
            if (order == null)
                throw new InvalidOperationException($"Order {_orderId} not found");

            order.Status = "cancelled";
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _loggerService.LogInfo($"Order {_orderId} cancelled via CancelOrderCommand");
        }
    }

    /// <summary>
    /// Command Pattern - Invoker that executes command objects
    /// Provides centralized logging and error handling for all commands
    /// </summary>
    public interface ICommandInvoker
    {
        Task<TResult> ExecuteCommandAsync<TResult>(ICommand<TResult> command);
        Task ExecuteCommandAsync(ICommand command);
    }

    public class CommandInvoker : ICommandInvoker
    {
        private readonly ILoggerService _loggerService;

        public CommandInvoker(ILoggerService loggerService)
        {
            _loggerService = loggerService;
        }

        public async Task<TResult> ExecuteCommandAsync<TResult>(ICommand<TResult> command)
        {
            _loggerService.LogInfo($"Invoking command: {command.GetType().Name}");
            try
            {
                var result = await command.ExecuteAsync();
                _loggerService.LogInfo($"Command {command.GetType().Name} completed successfully");
                return result;
            }
            catch (Exception ex)
            {
                _loggerService.LogError($"Command {command.GetType().Name} failed: {ex.Message}", ex);
                throw;
            }
        }

        public async Task ExecuteCommandAsync(ICommand command)
        {
            _loggerService.LogInfo($"Invoking command: {command.GetType().Name}");
            try
            {
                await command.ExecuteAsync();
                _loggerService.LogInfo($"Command {command.GetType().Name} completed successfully");
            }
            catch (Exception ex)
            {
                _loggerService.LogError($"Command {command.GetType().Name} failed: {ex.Message}", ex);
                throw;
            }
        }
    }
}
