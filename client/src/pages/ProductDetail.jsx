import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsApi, reviewsApi, salesApi } from '../api/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { isAuthenticated, user } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [error, setError] = useState(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [productSizeInventory, setProductSizeInventory] = useState({});
    const [saleDiscount, setSaleDiscount] = useState(0);
    
    const parseSizeInventory = (sizeString) => {
        if (!sizeString || typeof sizeString !== 'string') {
            console.warn('[parseSizeInventory] Empty or invalid sizeString:', sizeString);
            return {};
        }
        
        console.log('[parseSizeInventory] Input:', sizeString);
        
        // Try new format first (38:10, 39:8, 40:5)
        const entries = sizeString.split(',').map(entry => entry.trim()).filter(Boolean);
        let result = {};
        let hasValidNewFormat = false;
        
        for (let entry of entries) {
            if (entry.includes(':')) {
                const [sizePart, qtyPart] = entry.split(':').map(part => part.trim());
                const qty = parseInt(qtyPart, 10);
                if (sizePart && !Number.isNaN(qty)) {
                    result[sizePart] = qty;
                    hasValidNewFormat = true;
                }
            }
        }
        
        // If new format found, return it
        if (hasValidNewFormat && Object.keys(result).length > 0) {
            console.log('[parseSizeInventory] Parsed new format:', result);
            return result;
        }
        
        // Fall back to old format parsing (e.g., "50 lượng" -> distribute equally)
        // If string doesn't contain ':', assume it's old format and distribute stock equally
        result = {};
        for (let entry of entries) {
            if (!entry.includes(':')) {
                // Old format like "50 lượng" or "50"
                const match = entry.match(/^(\d+)/);
                if (match) {
                    const totalQty = parseInt(match[1], 10);
                    // Distribute to common shoe sizes
                    const commonSizes = [36, 37, 38, 39, 40, 41, 42, 43];
                    const qtyPerSize = Math.floor(totalQty / commonSizes.length);
                    const remainder = totalQty % commonSizes.length;
                    
                    commonSizes.forEach((size, idx) => {
                        result[size.toString()] = qtyPerSize + (idx < remainder ? 1 : 0);
                    });
                    hasValidNewFormat = true;
                    console.log('[parseSizeInventory] Parsed old format, distributed:', result);
                    break;
                }
            }
        }
        
        console.log('[parseSizeInventory] Final result:', result);
        return result;
    };

    const formatSizeInventory = (inventory) => {
        return Object.entries(inventory)
            .map(([size, qty]) => `${size}:${qty}`)
            .join(', ');
    };
    
    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const getCachedProductInventory = () => {
        try {
            const allInventory = JSON.parse(localStorage.getItem('productInventory') || '{}');
            return allInventory[id] || null;
        } catch {
            return null;
        }
    };

    const loadProductInventory = () => {
        console.log('[loadProductInventory] Called');
        const cached = getCachedProductInventory();
        console.log('[loadProductInventory] Cached inventory:', cached);
        if (cached && Object.keys(cached).length > 0) {
            console.log('[loadProductInventory] Using cached inventory');
            setProductSizeInventory(cached);
            return;
        }

        // Only parse if product exists
        if (!product) {
            console.log('[loadProductInventory] Product not loaded yet');
            return;
        }

        console.log('[loadProductInventory] Parsing product size:', product?.size);
        const parsed = parseSizeInventory(product?.size || '');
        console.log('[loadProductInventory] Parsed inventory:', parsed);
        setProductSizeInventory(parsed);
    };

    useEffect(() => {
        if (product) {
            console.log('[useEffect] Product changed, loading inventory');
            loadProductInventory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product, id]);

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === 'productInventory' || event.key === 'lastOrderSync') {
                loadProductInventory();
            }
        };

        const handleFocus = () => {
            loadProductInventory();
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Listen for product updates from admin
    useEffect(() => {
        const handleProductUpdate = (event) => {
            if (event.key === 'adminProductUpdate') {
                const updateData = JSON.parse(event.newValue || '{}');
                // If updated product is this one, refresh
                if (updateData.productId === parseInt(id)) {
                    loadProductFromAPI();
                }
            }
        };
        
        window.addEventListener('storage', handleProductUpdate);
        return () => window.removeEventListener('storage', handleProductUpdate);
    }, [id]);

    // Fallback: if no size inventory but product has stock, create default sizes
    let finalSizeInventory = productSizeInventory;
    if (Object.keys(finalSizeInventory).length === 0 && product?.stock > 0) {
        console.log('[ProductDetail] Không tìm thấy kho size, tạo size mặc định');
        // Create default sizes with equal distribution
        const commonSizes = [36, 37, 38, 39, 40, 41, 42, 43];
        const qtyPerSize = Math.floor(product.stock / commonSizes.length);
        const remainder = product.stock % commonSizes.length;
        
        finalSizeInventory = {};
        commonSizes.forEach((size, idx) => {
            finalSizeInventory[size.toString()] = qtyPerSize + (idx < remainder ? 1 : 0);
        });
        console.log('[ProductDetail] Kho size mặc định:', finalSizeInventory);
    }
    
    const availableSizeOptions = Object.entries(finalSizeInventory).map(([size, qty]) => ({
        size,
        quantity: qty
    }));

    console.log('[ProductDetail] finalSizeInventory:', finalSizeInventory);
    console.log('[ProductDetail] availableSizeOptions:', availableSizeOptions);
    console.log('[ProductDetail] product?.size:', product?.size);

    const totalSizeStock = Object.values(finalSizeInventory).reduce((sum, qty) => sum + (qty || 0), 0);
    const selectedSizeStock = selectedSize ? (finalSizeInventory[selectedSize] ?? 0) : null;
    const totalStock = totalSizeStock || product?.stock || 0;

    const availableSizes = availableSizeOptions.map(option => option.size);

    const loadProductFromAPI = async () => {
        try {
            setLoading(true);
            console.log('[loadProductFromAPI] Loading product with id:', id);
            // Add cache busting with timestamp
            const response = await fetch(`http://localhost:5240/api/products/${id}?t=${Date.now()}`);
            console.log('[loadProductFromAPI] API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('[loadProductFromAPI] Full API response:', data);
                console.log('[loadProductFromAPI] Product keys:', Object.keys(data));
                
                // Handle different response formats
                let productData = data;
                if (data.data) {
                    console.log('[loadProductFromAPI] Using data.data format');
                    productData = data.data;
                }
                
                console.log('[loadProductFromAPI] Product size field:', productData.size);
                console.log('[loadProductFromAPI] Product stock field:', productData.stock);
                setProduct(productData);
                setSelectedColor(productData.color);
                // Reset size inventory to force re-parse
                setProductSizeInventory({});
                setError(null);
            } else {
                console.error('[loadProductFromAPI] API error:', response.status, response.statusText);
                setError('Không thể tải chi tiết sản phẩm');
            }
        } catch (err) {
            console.error('[loadProductFromAPI] Error:', err);
            setError('Không thể tải chi tiết sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    // Load product data on component mount or when id changes
    useEffect(() => {
        if (id) {
            loadProductFromAPI();
        }
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

    // Set default size when product loads
    useEffect(() => {
        if (product && availableSizes.length > 0 && !selectedSize) {
            const defaultSize = availableSizeOptions.find(option => option.quantity > 0)?.size || availableSizes[0];
            setSelectedSize(defaultSize);
        }
    }, [product, availableSizes, selectedSize, availableSizeOptions]);

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

    const loadSaleDiscount = async () => {
        try {
            if (!product) return;
            const res = await salesApi.getActive();
            const salesData = res.data?.value ?? res.data ?? [];
            const activeSale = salesData.find(s => {
                // Handle both API format (saleProducts) and legacy format (productIds)
                if (s.saleProducts) {
                    return s.saleProducts.some(sp => sp.productId === product.id || String(sp.productId) === String(product.id));
                }
                // Legacy format fallback
                return s.productIds && s.productIds.includes(String(product.id));
            });
            setSaleDiscount(activeSale ? activeSale.discountPercent : 0);
        } catch (err) {
            console.error('Error loading sale discount:', err);
        }
    };

    // Load sale discount when product changes or sales updated
    useEffect(() => {
        loadSaleDiscount();
        const handleSalesUpdate = (event) => {
            if (!event.key || event.key === 'saleUpdated') {
                loadSaleDiscount();
            }
        };
        window.addEventListener('saleUpdated', handleSalesUpdate);
        window.addEventListener('storage', handleSalesUpdate);
        return () => {
            window.removeEventListener('saleUpdated', handleSalesUpdate);
            window.removeEventListener('storage', handleSalesUpdate);
        };
    }, [product]);

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

        const stockForSelectedSize = selectedSizeStock ?? product.stock;
        if (quantity > stockForSelectedSize) {
            setValidationError(`Số lượng tối đa cho size ${selectedSize}: ${stockForSelectedSize}`);
            return;
        }

        addToCart({
            ...product,
            size: selectedSize,
            color: selectedColor,
            selectedSizeStock: stockForSelectedSize,
            sizeInventory: productSizeInventory,
            sizeString: product.size,
            saleDiscount: saleDiscount
        }, quantity);

        // Update local inventory after adding to cart
        const updatedInventory = {
            ...productSizeInventory,
            [selectedSize]: Math.max(0, (productSizeInventory[selectedSize] || 0) - quantity)
        };
        setProductSizeInventory(updatedInventory);

        // Save to localStorage
        const allInventory = JSON.parse(localStorage.getItem('productInventory') || '{}');
        allInventory[id] = updatedInventory;
        localStorage.setItem('productInventory', JSON.stringify(allInventory));

        setAddedToCart(true);
        setValidationError('');
        setQuantity(1);
        setSelectedSize('');
        setTimeout(() => {
            setAddedToCart(false);
        }, 3000);
    };

    const handleQuantityChange = (value) => {
        const num = parseInt(value) || 1;
        const maxQty = selectedSizeStock ?? product.stock;
        setQuantity(Math.max(1, Math.min(num, Math.max(0, maxQty))));
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
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="product-image-main" />
                        ) : (
                            <div className="product-image-main" style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                Không có ảnh
                            </div>
                        )}
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
                        {saleDiscount > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="price-display" style={{ textDecoration: 'line-through', color: '#999', fontSize: '14px' }}>
                                    {formatPrice(product.price)}
                                </div>
                                <div className="price-display" style={{ color: '#ff6b6b', fontSize: '24px', fontWeight: 'bold' }}>
                                    {formatPrice(product.price * (1 - saleDiscount / 100))}
                                </div>
                                <span style={{ background: '#ff6b6b', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                    -{saleDiscount}%
                                </span>
                            </div>
                        ) : (
                            <div className="price-display">{formatPrice(product.price)}</div>
                        )}
                        <div className={`stock-status ${totalStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {totalStock > 0 ? `✓ Còn ${totalStock} sản phẩm` : '✕ Hết hàng'}
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
                                {availableSizeOptions.map(option => (
                                    <option key={option.size} value={option.size} disabled={option.quantity === 0}>
                                        {option.size}{option.quantity != null ? ` (${option.quantity})` : ''}
                                    </option>
                                ))}
                            </select>
                            {!selectedSize && <span className="required-notice">*Bắt buộc</span>}
                        </div>

                        <div className="quantity-selector">
                            <label htmlFor="quantity">Số lượng:</label>
                            <div className="quantity-control">
                                <button
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={totalStock === 0}
                                >
                                    −
                                </button>
                                <input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={selectedSizeStock ?? totalStock}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    disabled={totalStock === 0}
                                    className="quantity-input"
                                />
                                <button
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={totalStock === 0}
                                >
                                    +
                                </button>
                            </div>
                            {selectedSize && (
                                <div className="size-stock-info">
                                    Số lượng còn size {selectedSize}: {selectedSizeStock ?? 0}
                                </div>
                            )}
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
                        <button 
                            className={`btn-wishlist ${isInWishlist(product.id) ? 'active' : ''}`}
                            onClick={() => toggleWishlist(product)}
                        >
                            {isInWishlist(product.id) ? '❤️ Đã yêu thích' : '♡ Yêu thích'}
                        </button>
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
