using WebBanGiay.API.Models;

namespace WebBanGiay.API.Observers
{
    /// <summary>
    /// Observer interface for the Review system
    /// Implements the Observer Pattern to decouple review creation from product updates
    /// </summary>
    public interface IReviewObserver
    {
        /// <summary>
        /// Called when a new review is added to a product
        /// </summary>
        /// <param name="product">Product that received the new review</param>
        /// <param name="review">The new review that was added</param>
        /// <returns>Task for async operation</returns>
        Task OnReviewAdded(Product product, Review review);

        /// <summary>
        /// Called when a review is updated
        /// </summary>
        /// <param name="product">Product whose review was updated</param>
        /// <param name="oldReview">The original review before update</param>
        /// <param name="newReview">The updated review</param>
        /// <returns>Task for async operation</returns>
        Task OnReviewUpdated(Product product, Review oldReview, Review newReview);

        /// <summary>
        /// Called when a review is deleted
        /// </summary>
        /// <param name="product">Product whose review was deleted</param>
        /// <param name="review">The deleted review</param>
        /// <returns>Task for async operation</returns>
        Task OnReviewDeleted(Product product, Review review);
    }
}
