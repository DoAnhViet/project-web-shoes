namespace WebBanGiay.API.Services.Payment
{
    /// <summary>
    /// Payment processor interface
    /// </summary>
    public interface IPaymentProcessor
    {
        string GetPaymentMethodName();
        Task<bool> ProcessPaymentAsync(decimal amount, string transactionId);
    }

    /// <summary>
    /// Credit Card payment processor
    /// </summary>
    public class CreditCardPaymentProcessor : IPaymentProcessor
    {
        public string GetPaymentMethodName() => "Credit Card";

        public async Task<bool> ProcessPaymentAsync(decimal amount, string transactionId)
        {
            // Simulate payment processing
            await Task.Delay(100);
            return true;
        }
    }

    /// <summary>
    /// Bank transfer payment processor
    /// </summary>
    public class BankTransferPaymentProcessor : IPaymentProcessor
    {
        public string GetPaymentMethodName() => "Bank Transfer";

        public async Task<bool> ProcessPaymentAsync(decimal amount, string transactionId)
        {
            // Simulate payment processing
            await Task.Delay(150);
            return true;
        }
    }

    /// <summary>
    /// E-wallet payment processor
    /// </summary>
    public class EWalletPaymentProcessor : IPaymentProcessor
    {
        public string GetPaymentMethodName() => "E-Wallet";

        public async Task<bool> ProcessPaymentAsync(decimal amount, string transactionId)
        {
            // Simulate payment processing
            await Task.Delay(80);
            return true;
        }
    }

    /// <summary>
    /// COD (Cash on Delivery) payment processor
    /// </summary>
    public class CodPaymentProcessor : IPaymentProcessor
    {
        public string GetPaymentMethodName() => "Cash on Delivery";

        public async Task<bool> ProcessPaymentAsync(decimal amount, string transactionId)
        {
            // COD doesn't need immediate processing, just mark as pending
            await Task.Delay(10);
            return true;
        }
    }

    /// <summary>
    /// Banking (QR Code) payment processor
    /// </summary>
    public class BankingPaymentProcessor : IPaymentProcessor
    {
        public string GetPaymentMethodName() => "Banking Transfer";

        public async Task<bool> ProcessPaymentAsync(decimal amount, string transactionId)
        {
            // Banking transfer needs verification, mark as pending
            await Task.Delay(50);
            return true;
        }
    }

    /// <summary>
    /// Factory to create payment processors
    /// </summary>
    public interface IPaymentProcessorFactory
    {
        IPaymentProcessor CreatePaymentProcessor(string paymentMethod);
    }

    public class PaymentProcessorFactory : IPaymentProcessorFactory
    {
        public IPaymentProcessor CreatePaymentProcessor(string paymentMethod)
        {
            return paymentMethod.ToLower() switch
            {
                "cod" => new CodPaymentProcessor(),
                "banking" => new BankingPaymentProcessor(),
                "creditcard" => new CreditCardPaymentProcessor(),
                "banktransfer" => new BankTransferPaymentProcessor(),
                "ewallet" => new EWalletPaymentProcessor(),
                _ => throw new ArgumentException($"Unknown payment method: {paymentMethod}")
            };
        }
    }
}
