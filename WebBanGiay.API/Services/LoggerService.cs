namespace WebBanGiay.API.Services
{
    /// <summary>
    /// Singleton Logger Service - centralized logging across the application
    /// Registered as a singleton in the DI container to ensure only one instance exists
    /// </summary>
    public interface ILoggerService
    {
        void LogInfo(string message);
        void LogWarning(string message);
        void LogError(string message, Exception? ex = null);
    }

    public class LoggerService : ILoggerService
    {
        private readonly ILogger<LoggerService> _logger;

        public LoggerService(ILogger<LoggerService> logger)
        {
            _logger = logger;
        }

        public void LogInfo(string message)
        {
            _logger.LogInformation("ℹ️ {Message}", message);
        }

        public void LogWarning(string message)
        {
            _logger.LogWarning("⚠️ {Message}", message);
        }

        public void LogError(string message, Exception? ex = null)
        {
            _logger.LogError(ex, "❌ {Message}", message);
        }
    }
}
