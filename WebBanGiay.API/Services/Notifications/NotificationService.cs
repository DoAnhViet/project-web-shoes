namespace WebBanGiay.API.Services.Notifications
{
    /// <summary>
    /// Notification interface
    /// </summary>
    public interface INotificationChannel
    {
        Task SendAsync(string recipient, string message, string subject = "");
    }

    /// <summary>
    /// Email notification channel
    /// </summary>
    public class EmailNotificationChannel : INotificationChannel
    {
        private readonly ILogger<EmailNotificationChannel> _logger;

        public EmailNotificationChannel(ILogger<EmailNotificationChannel> logger)
        {
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string message, string subject = "")
        {
            _logger.LogInformation("📧 Sending email to {Recipient} with subject '{Subject}'", recipient, subject);
            await Task.Delay(100);
            _logger.LogInformation("✅ Email sent successfully to {Recipient}", recipient);
        }
    }

    /// <summary>
    /// SMS notification channel
    /// </summary>
    public class SmsNotificationChannel : INotificationChannel
    {
        private readonly ILogger<SmsNotificationChannel> _logger;

        public SmsNotificationChannel(ILogger<SmsNotificationChannel> logger)
        {
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string message, string subject = "")
        {
            _logger.LogInformation("📱 Sending SMS to {Recipient}: {Message}", recipient, message);
            await Task.Delay(50);
            _logger.LogInformation("✅ SMS sent successfully to {Recipient}", recipient);
        }
    }

    /// <summary>
    /// Push notification channel
    /// </summary>
    public class PushNotificationChannel : INotificationChannel
    {
        private readonly ILogger<PushNotificationChannel> _logger;

        public PushNotificationChannel(ILogger<PushNotificationChannel> logger)
        {
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string message, string subject = "")
        {
            _logger.LogInformation("🔔 Sending push notification to {Recipient}: {Message}", recipient, message);
            await Task.Delay(30);
            _logger.LogInformation("✅ Push notification sent successfully to {Recipient}", recipient);
        }
    }

    /// <summary>
    /// Notification service to manage multiple channels
    /// </summary>
    public interface INotificationService
    {
        Task SendNotificationAsync(string recipient, string message, string channel = "email", string subject = "");
        Task SendMultiChannelNotificationAsync(string recipient, string message, string[] channels, string subject = "");
    }

    public class NotificationService : INotificationService
    {
        private readonly Dictionary<string, INotificationChannel> _channels;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ILogger<NotificationService> logger, ILogger<EmailNotificationChannel> emailLogger, ILogger<SmsNotificationChannel> smsLogger, ILogger<PushNotificationChannel> pushLogger)
        {
            _logger = logger;
            _channels = new Dictionary<string, INotificationChannel>
            {
                { "email", new EmailNotificationChannel(emailLogger) },
                { "sms", new SmsNotificationChannel(smsLogger) },
                { "push", new PushNotificationChannel(pushLogger) }
            };
        }

        public async Task SendNotificationAsync(string recipient, string message, string channel = "email", string subject = "")
        {
            if (_channels.TryGetValue(channel.ToLower(), out var notificationChannel))
            {
                await notificationChannel.SendAsync(recipient, message, subject);
            }
            else
            {
                _logger.LogWarning("⚠️ Unknown notification channel: {Channel}", channel);
            }
        }

        public async Task SendMultiChannelNotificationAsync(string recipient, string message, string[] channels, string subject = "")
        {
            var tasks = channels.Select(ch => SendNotificationAsync(recipient, message, ch, subject));
            await Task.WhenAll(tasks);
        }
    }
}
