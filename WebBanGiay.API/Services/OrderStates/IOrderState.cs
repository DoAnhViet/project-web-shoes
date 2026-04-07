namespace WebBanGiay.API.Services.OrderStates
{
    /// <summary>
    /// State Pattern - Interface representing an order's current state
    /// Each concrete state defines its own valid transitions
    /// </summary>
    public interface IOrderState
    {
        string StateName { get; }
        bool CanTransitionTo(string targetStatus);
        string[] AllowedTransitions { get; }
    }
}
