import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsApi, reviewsApi } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated, user } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [error, setError] = useState(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const [validationError, setValidationError] = useState('');
    
    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                const response = await productsApi.getById(id);
                setProduct(response.data);
                setSelectedColor(response.data.color);
                setError(null);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Không thể tải chi tiết sản phẩm');
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [id]);

    // Load reviews
    useEffect(() => {
        const loadReviews = async () => {
            try {
                setReviewsLoading(true);
                const response = await reviewsApi.getByProduct(id);
                setReviews(response.data?.items || response.data || []);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };
        if (id) loadReviews();
    }, [id]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!newReview.comment.trim()) return;

        try {
            setSubmittingReview(true);
            await reviewsApi.create({
                productId: parseInt(id),
                reviewerId: user?.email || 'anonymous',
                rating: newReview.rating,
                comment: newReview.comment
            });
            
            // Reload reviews
            const response = await reviewsApi.getByProduct(id);
            setReviews(response.data?.items || response.data || []);
            setNewReview({ rating: 5, comment: '' });
            setShowReviewForm(false);
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Không thể gửi đánh giá. Vui lòng thử lại!');
        } finally {
            setSubmittingReview(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleAddToCart = () => {
        setValidationError('');

        // Check if user is logged in
        if (!isAuthenticated) {
            setValidationError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
            return;
        }

        if (!selectedSize) {
            setValidationError('Vui lòng chọn kích cỡ');
            return;
        }

        if (quantity <= 0) {
            setValidationError('Số lượng phải lớn hơn 0');
            return;
        }

        if (quantity > product.stock) {
            setValidationError(`Số lượng tối đa: ${product.stock}`);
            return;
        }

        addToCart({
            ...product,
            size: selectedSize,
            color: selectedColor
        }, quantity);

        setAddedToCart(true);
        setValidationError('');
        setTimeout(() => {
            setAddedToCart(false);
        }, 3000);
    };

    const handleQuantityChange = (value) => {
        const num = parseInt(value) || 1;
        setQuantity(Math.max(1, Math.min(num, product.stock)));
    };

    if (loading) {
        return (
            <div className="product-detail-container">
                <div className="loading-spinner">⏳ Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-container">
                <div className="error-message">Sản phẩm không tìm thấy</div>
            </div>
        );
    }

    return (
        <div className="product-detail-container">
            <div className="breadcrumb">
                <Link to="/" className="btn-back-breadcrumb">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Trang chủ
                </Link>
                <span className="separator">/</span>
                <span>{product.name}</span>
            </div>

            <div className="product-detail-wrapper">
                <div className="product-image-gallery">
                    <div className="main-image-container">
                        <img src={product.imageUrl} alt={product.name} className="product-image-main" />
                        {product.stock === 0 && <div className="out-of-stock-overlay">Hết hàng</div>}
                    </div>
                </div>

                <div className="product-info-wrapper">
                    <div className="product-header-section">
                        <span className="product-brand">{product.brand}</span>
                        <h1 className="product-title">{product.name}</h1>
                        <div className="product-rating-section">
                            <div className="rating-stars">⭐ {product.averageRating?.toFixed(1) || '5.0'}</div>
                            <span className="review-count">({product.reviewCount || 0} đánh giá)</span>
                        </div>
                    </div>

                    <div className="product-price-info">
                        <div className="price-display">{formatPrice(product.price)}</div>
                        <div className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {product.stock > 0 ? `✓ Còn ${product.stock} sản phẩm` : '✕ Hết hàng'}
                        </div>
                    </div>

                    <div className="product-description-section">
                        <h3>Mô tả sản phẩm</h3>
                        <p>{product.description}</p>
                    </div>

                    <div className="product-selection-area">
                        <div className="color-selector">
                            <label>Màu sắc:</label>
                            <div className="color-option selected">
                                <span className="color-name">{selectedColor}</span>
                            </div>
                        </div>

                        <div className="size-selector">
                            <label htmlFor="size">Kích cỡ *</label>
                            <select
                                id="size"
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className={`size-select ${selectedSize ? 'selected' : ''}`}
                            >
                                <option value="">Chọn kích cỡ</option>
                                <option value={product.size}>{product.size}</option>
                            </select>
                            {!selectedSize && <span className="required-notice">*Bắt buộc</span>}
                        </div>

                        <div className="quantity-selector">
                            <label htmlFor="quantity">Số lượng:</label>
                            <div className="quantity-control">
                                <button
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={product.stock === 0}
                                >
                                    −
                                </button>
                                <input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={product.stock}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    disabled={product.stock === 0}
                                    className="quantity-input"
                                />
                                <button
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={product.stock === 0}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {validationError && (
                        <div className="validation-error-box">
                            ⚠️ {validationError}
                        </div>
                    )}

                    <div className="product-action-buttons">
                        <button
                            className={`btn-add-to-cart ${addedToCart ? 'success' : ''}`}
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            {addedToCart ? '✓ Đã thêm vào giỏ' : '🛒 Thêm vào giỏ hàng'}
                        </button>
                        {addedToCart && (
                            <button
                                className="btn-view-cart"
                                onClick={() => navigate('/cart')}
                            >
                                Xem giỏ hàng →
                            </button>
                        )}
                        <button className="btn-wishlist">♡ Yêu thích</button>
                    </div>

                    <div className="product-benefits">
                        <div className="benefit-item">
                            <span className="benefit-icon">✅</span>
                            <span>Chính hãng 100%</span>
                        </div>
                        <div className="benefit-item">
                            <span className="benefit-icon">🚚</span>
                            <span>Giao hàng miễn phí</span>
                        </div>
                        <div className="benefit-item">
                            <span className="benefit-icon">↩️</span>
                            <span>Đổi trả 7 ngày</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                <div className="reviews-header">
                    <h2>Đánh giá sản phẩm</h2>
                    <div className="reviews-summary">
                        <div className="average-rating">
                            <span className="rating-number">{averageRating}</span>
                            <div className="stars">
                                {[1,2,3,4,5].map(star => (
                                    <span key={star} className={`star ${star <= Math.round(averageRating) ? 'filled' : ''}`}>★</span>
                                ))}
                            </div>
                            <span className="total-reviews">({reviews.length} đánh giá)</span>
                        </div>
                        <button 
                            className="btn-write-review"
                            onClick={() => isAuthenticated ? setShowReviewForm(!showReviewForm) : navigate('/login')}
                        >
                            ✍️ Viết đánh giá
                        </button>
                    </div>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                    <form className="review-form" onSubmit={handleSubmitReview}>
                        <div className="rating-input">
                            <label>Đánh giá của bạn:</label>
                            <div className="star-rating">
                                {[1,2,3,4,5].map(star => (
                                    <span 
                                        key={star}
                                        className={`star-input ${star <= newReview.rating ? 'active' : ''}`}
                                        onClick={() => setNewReview({...newReview, rating: star})}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                        <textarea
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                            value={newReview.comment}
                            onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                            required
                        />
                        <div className="review-form-actions">
                            <button type="button" onClick={() => setShowReviewForm(false)}>Hủy</button>
                            <button type="submit" disabled={submittingReview}>
                                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Reviews List */}
                <div className="reviews-list">
                    {reviewsLoading ? (
                        <p className="loading-text">Đang tải đánh giá...</p>
                    ) : reviews.length === 0 ? (
                        <p className="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="review-top">
                                    <div className="reviewer-info">
                                        <span className="reviewer-avatar">👤</span>
                                        <span className="reviewer-name">{review.reviewerId}</span>
                                    </div>
                                    <span className="review-date">{formatDate(review.createdAt)}</span>
                                </div>
                                <div className="review-rating">
                                    {[1,2,3,4,5].map(star => (
                                        <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>★</span>
                                    ))}
                                </div>
                                <p className="review-comment">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
