namespace WebBanGiay.API.Services.OrderStates
{
    /// <summary>
    /// State Pattern - Context/Manager that manages order state transitions
    /// Replaces the procedural IsValidStatusTransition method with OOP state objects
    /// </summary>
    public interface IOrderStateManager
    {
        IOrderState GetState(string statusName);
        bool IsValidTransition(string currentStatus, string newStatus);
        string[] GetAllowedTransitions(string currentStatus);
    }

    public class OrderStateManager : IOrderStateManager
    {
        private readonly Dictionary<string, IOrderState> _states;

        public OrderStateManager()
        {
            _states = new Dictionary<string, IOrderState>
            {
                ["pending"] = new PendingState(),
                ["confirmed"] = new ConfirmedState(),
                ["shipping"] = new ShippingState(),
                ["delivered"] = new DeliveredState(),
                ["cancelled"] = new CancelledState()
            };
        }

        public IOrderState GetState(string statusName)
        {
            if (_states.TryGetValue(statusName.ToLower(), out var state))
                return state;
            throw new ArgumentException($"Unknown order status: {statusName}");
        }

        public bool IsValidTransition(string currentStatus, string newStatus)
        {
            // Same status is allowed (idempotent)
            if (currentStatus.ToLower() == newStatus.ToLower())
                return true;

            var state = GetState(currentStatus);
            return state.CanTransitionTo(newStatus);
        }

        public string[] GetAllowedTransitions(string currentStatus)
        {
            return GetState(currentStatus).AllowedTransitions;
        }
    }
}
