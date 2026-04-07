namespace WebBanGiay.API.Services.OrderStates
{
    /// <summary>
    /// State Pattern - Pending state: initial order state
    /// Can transition to: confirmed, cancelled
    /// </summary>
    public class PendingState : IOrderState
    {
        public string StateName => "pending";
        public string[] AllowedTransitions => new[] { "confirmed", "cancelled" };
        public bool CanTransitionTo(string targetStatus) =>
            AllowedTransitions.Contains(targetStatus.ToLower());
    }

    /// <summary>
    /// State Pattern - Confirmed state: order has been confirmed by admin
    /// Can transition to: shipping, cancelled
    /// </summary>
    public class ConfirmedState : IOrderState
    {
        public string StateName => "confirmed";
        public string[] AllowedTransitions => new[] { "shipping", "cancelled" };
        public bool CanTransitionTo(string targetStatus) =>
            AllowedTransitions.Contains(targetStatus.ToLower());
    }

    /// <summary>
    /// State Pattern - Shipping state: order is being delivered
    /// Can transition to: delivered, cancelled
    /// </summary>
    public class ShippingState : IOrderState
    {
        public string StateName => "shipping";
        public string[] AllowedTransitions => new[] { "delivered", "cancelled" };
        public bool CanTransitionTo(string targetStatus) =>
            AllowedTransitions.Contains(targetStatus.ToLower());
    }

    /// <summary>
    /// State Pattern - Delivered state: terminal state, order completed
    /// Cannot transition to any other state
    /// </summary>
    public class DeliveredState : IOrderState
    {
        public string StateName => "delivered";
        public string[] AllowedTransitions => Array.Empty<string>();
        public bool CanTransitionTo(string targetStatus) => false;
    }

    /// <summary>
    /// State Pattern - Cancelled state: terminal state, order cancelled
    /// Cannot transition to any other state
    /// </summary>
    public class CancelledState : IOrderState
    {
        public string StateName => "cancelled";
        public string[] AllowedTransitions => Array.Empty<string>();
        public bool CanTransitionTo(string targetStatus) => false;
    }
}
