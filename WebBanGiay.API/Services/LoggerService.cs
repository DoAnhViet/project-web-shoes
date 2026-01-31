namespace WebBanGiay.API.Services
{
    /// <summary>
    /// Singleton Logger Service - centralized logging across the application
    /// </summary>
    public interface ILoggerService
    {
        void LogInfo(string message);
        void LogWarning(string message);
        void LogError(string message, Exception? ex = null);
    }

    public class LoggerService : ILoggerService
    {
        private static LoggerService? _instance;
        private static readonly object _lock = new object();
        private readonly ILogger<LoggerService> _logger;

        private LoggerService(ILogger<LoggerService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Get or create singleton instance
        /// </summary>
        public static LoggerService GetInstance(ILogger<LoggerService> logger)
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new LoggerService(logger);
                    }
                }
            }
            return _instance;
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
