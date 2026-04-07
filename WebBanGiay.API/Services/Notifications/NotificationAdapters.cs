using WebBanGiay.API.Services.Notifications.ExternalProviders;

namespace WebBanGiay.API.Services.Notifications
{
    /// <summary>
    /// Adapter Pattern - Adapts ISmtpEmailProvider (external third-party interface)
    /// to our INotificationChannel (internal application interface)
    /// </summary>
    public class SmtpEmailAdapter : INotificationChannel
    {
        private readonly ISmtpEmailProvider _smtpProvider;
        private readonly ILogger<SmtpEmailAdapter> _logger;

        public SmtpEmailAdapter(ISmtpEmailProvider smtpProvider, ILogger<SmtpEmailAdapter> logger)
        {
            _smtpProvider = smtpProvider;
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string message, string subject = "")
        {
            _logger.LogInformation("Adapting to SMTP provider for {Recipient}", recipient);
            var htmlBody = $"<html><body><p>{message}</p></body></html>";
            var fromAddress = "noreply@webbangiay.com";
            await _smtpProvider.SendEmailAsync(recipient, subject, htmlBody, fromAddress);
            _logger.LogInformation("SMTP email adapted and sent to {Recipient}", recipient);
        }
    }

    /// <summary>
    /// Adapter Pattern - Adapts ITwilioSmsProvider (external third-party interface)
    /// to our INotificationChannel (internal application interface)
    /// </summary>
    public class TwilioSmsAdapter : INotificationChannel
    {
        private readonly ITwilioSmsProvider _twilioProvider;
        private readonly ILogger<TwilioSmsAdapter> _logger;

        public TwilioSmsAdapter(ITwilioSmsProvider twilioProvider, ILogger<TwilioSmsAdapter> logger)
        {
            _twilioProvider = twilioProvider;
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string message, string subject = "")
        {
            _logger.LogInformation("Adapting to Twilio SMS for {Recipient}", recipient);
            var fromNumber = "+84900000000";
            await _twilioProvider.SendSmsAsync(recipient, message, fromNumber);
            _logger.LogInformation("Twilio SMS adapted and sent to {Recipient}", recipient);
        }
    }
}
