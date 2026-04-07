using WebBanGiay.API.Services.Notifications.ExternalProviders;

namespace WebBanGiay.API.Services.Notifications
{
    /// <summary>
    /// Notification channel interface - our internal application interface
    /// </summary>
    public interface INotificationChannel
    {
        Task SendAsync(string recipient, string message, string subject = "");
    }

    /// <summary>
    /// Push notification channel (internal implementation, no adapter needed)
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
            _logger.LogInformation("Sending push notification to {Recipient}: {Message}", recipient, message);
            await Task.Delay(30);
            _logger.LogInformation("Push notification sent successfully to {Recipient}", recipient);
        }
    }

    /// <summary>
    /// Notification service interface
    /// </summary>
    public interface INotificationService
    {
        Task SendNotificationAsync(string recipient, string message, string channel = "email", string subject = "");
        Task SendMultiChannelNotificationAsync(string recipient, string message, string[] channels, string subject = "");
    }

    /// <summary>
    /// Notification service - uses Adapter Pattern for email/SMS channels
    /// Email channel uses SmtpEmailAdapter (adapts ISmtpEmailProvider to INotificationChannel)
    /// SMS channel uses TwilioSmsAdapter (adapts ITwilioSmsProvider to INotificationChannel)
    /// Push channel uses PushNotificationChannel directly (no adapter needed)
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly Dictionary<string, INotificationChannel> _channels;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ILogger<NotificationService> logger,
            SmtpEmailAdapter emailAdapter,
            TwilioSmsAdapter smsAdapter,
            PushNotificationChannel pushChannel)
        {
            _logger = logger;
            // Adapter Pattern: email and sms channels are adapters wrapping external providers
            _channels = new Dictionary<string, INotificationChannel>
            {
                { "email", emailAdapter },
                { "sms", smsAdapter },
                { "push", pushChannel }
            };
        }

        public async Task SendNotificationAsync(string recipient, string message, string channel = "email", string subject = "")
        {
            if (_channels.TryGetValue(channel.ToLower(), out var notificationChannel))
            {
                _logger.LogInformation("Sending {Channel} notification to {Recipient}", channel, recipient);
                await notificationChannel.SendAsync(recipient, message, subject);
            }
            else
            {
                _logger.LogWarning("Unknown notification channel: {Channel}", channel);
            }
        }

        public async Task SendMultiChannelNotificationAsync(string recipient, string message, string[] channels, string subject = "")
        {
            var tasks = channels.Select(ch => SendNotificationAsync(recipient, message, ch, subject));
            await Task.WhenAll(tasks);
        }
    }
}
