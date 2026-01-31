using WebBanGiay.API.Models;

namespace WebBanGiay.API.Observers
{
    /// <summary>
    /// Subject that notifies observers about review changes
    /// Implements the Subject role in the Observer Pattern
    /// </summary>
    public class ReviewSubject
    {
        private readonly List<IReviewObserver> _observers = new();
        private readonly ILogger<ReviewSubject> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logger">Logger for diagnostic messages</param>
        public ReviewSubject(ILogger<ReviewSubject> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Subscribe an observer to review change notifications
        /// </summary>
        /// <param name="observer">Observer to add</param>
        public void Subscribe(IReviewObserver observer)
        {
            if (observer == null)
            {
                _logger.LogWarning("Attempted to subscribe null observer");
                return;
            }

            if (_observers.Contains(observer))
            {
                _logger.LogWarning("Observer already subscribed, skipping duplicate");
                return;
            }

            _observers.Add(observer);
            _logger.LogInformation($"Observer {observer.GetType().Name} subscribed. Total observers: {_observers.Count}");
        }

        /// <summary>
        /// Unsubscribe an observer from review change notifications
        /// </summary>
        /// <param name="observer">Observer to remove</param>
        public void Unsubscribe(IReviewObserver observer)
        {
            if (observer == null)
            {
                _logger.LogWarning("Attempted to unsubscribe null observer");
                return;
            }

            if (_observers.Remove(observer))
            {
                _logger.LogInformation($"Observer {observer.GetType().Name} unsubscribed. Total observers: {_observers.Count}");
            }
            else
            {
                _logger.LogWarning($"Observer {observer.GetType().Name} not found for unsubscribe");
            }
        }

        /// <summary>
        /// Notify all observers that a new review was added
        /// </summary>
        /// <param name="product">Product that received the review</param>
        /// <param name="review">The new review</param>
        public async Task NotifyReviewAdded(Product product, Review review)
        {
            _logger.LogInformation($"Notifying {_observers.Count} observers about new review for product {product.Id}");

            var tasks = _observers.Select(observer =>
            {
                return observer.OnReviewAdded(product, review).ContinueWith(task =>
                {
                    if (task.IsFaulted)
                    {
                        _logger.LogError(task.Exception, 
                            $"Error in {observer.GetType().Name}.OnReviewAdded");
                    }
                });
            });

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Notify all observers that a review was updated
        /// </summary>
        /// <param name="product">Product whose review was updated</param>
        /// <param name="oldReview">Original review</param>
        /// <param name="newReview">Updated review</param>
        public async Task NotifyReviewUpdated(Product product, Review oldReview, Review newReview)
        {
            _logger.LogInformation($"Notifying {_observers.Count} observers about review update for product {product.Id}");

            var tasks = _observers.Select(observer =>
            {
                return observer.OnReviewUpdated(product, oldReview, newReview).ContinueWith(task =>
                {
                    if (task.IsFaulted)
                    {
                        _logger.LogError(task.Exception,
                            $"Error in {observer.GetType().Name}.OnReviewUpdated");
                    }
                });
            });

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Notify all observers that a review was deleted
        /// </summary>
        /// <param name="product">Product whose review was deleted</param>
        /// <param name="review">The deleted review</param>
        public async Task NotifyReviewDeleted(Product product, Review review)
        {
            _logger.LogInformation($"Notifying {_observers.Count} observers about review deletion for product {product.Id}");

            var tasks = _observers.Select(observer =>
            {
                return observer.OnReviewDeleted(product, review).ContinueWith(task =>
                {
                    if (task.IsFaulted)
                    {
                        _logger.LogError(task.Exception,
                            $"Error in {observer.GetType().Name}.OnReviewDeleted");
                    }
                });
            });

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Get the count of subscribed observers
        /// </summary>
        /// <returns>Number of observers</returns>
        public int GetObserverCount() => _observers.Count;

        /// <summary>
        /// Check if an observer is subscribed
        /// </summary>
        /// <param name="observer">Observer to check</param>
        /// <returns>True if subscribed, false otherwise</returns>
        public bool IsSubscribed(IReviewObserver observer) => _observers.Contains(observer);
    }
}
