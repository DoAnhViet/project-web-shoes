import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsApi } from '../api/api';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [error, setError] = useState(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const [validationError, setValidationError] = useState('');

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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleAddToCart = () => {
        setValidationError('');

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

            {/* bottom back button removed to avoid duplicate navigation controls */}
        </div>
    );
}

export default ProductDetail;
