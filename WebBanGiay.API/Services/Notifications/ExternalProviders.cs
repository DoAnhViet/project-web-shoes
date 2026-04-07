namespace WebBanGiay.API.Services.Notifications.ExternalProviders
{
    /// <summary>
    /// Adapter Pattern - External SMTP email provider interface (third-party SDK)
    /// Has a different method signature than our INotificationChannel
    /// </summary>
    public interface ISmtpEmailProvider
    {
        Task SendEmailAsync(string toAddress, string subject, string htmlBody, string fromAddress);
    }

    /// <summary>
    /// Adapter Pattern - External Twilio SMS provider interface (third-party SDK)
    /// Has a different method signature than our INotificationChannel
    /// </summary>
    public interface ITwilioSmsProvider
    {
        Task SendSmsAsync(string phoneNumber, string messageBody, string fromNumber);
    }

    /// <summary>
    /// Concrete SMTP provider (simulates real SMTP library like MailKit/SendGrid)
    /// </summary>
    public class SmtpEmailProvider : ISmtpEmailProvider
    {
        public async Task SendEmailAsync(string toAddress, string subject, string htmlBody, string fromAddress)
        {
            // Simulates calling an actual SMTP library (e.g., SendGrid, MailKit)
            await Task.Delay(50);
        }
    }

    /// <summary>
    /// Concrete Twilio SMS provider (simulates real Twilio SDK)
    /// </summary>
    public class TwilioSmsProvider : ITwilioSmsProvider
    {
        public async Task SendSmsAsync(string phoneNumber, string messageBody, string fromNumber)
        {
            // Simulates calling Twilio REST API
            await Task.Delay(50);
        }
    }
}
