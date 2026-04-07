import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import './Wishlist.css';

function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddToCart = (product) => {
    addToCart({
      ...product,
      size: '40', // Default size
      color: 'Đen', // Default color
      saleDiscount: product.saleDiscount || 0
    }, 1);
  };

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-empty">
          <div className="empty-icon">💔</div>
          <h2>Danh sách yêu thích trống</h2>
          <p>Hãy thêm sản phẩm yêu thích để theo dõi và mua sắm dễ dàng hơn</p>
          <Link to="/products" className="btn-browse">
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>❤️ Sản phẩm yêu thích</h1>
        <p>{wishlist.length} sản phẩm</p>
      </div>

      <div className="wishlist-actions">
        <button className="btn-clear" onClick={clearWishlist}>
          🗑️ Xóa tất cả
        </button>
      </div>

      <div className="wishlist-grid">
        {wishlist.map(product => (
          <div key={product.id} className="wishlist-card">
            <button 
              className="btn-remove"
              onClick={() => removeFromWishlist(product.id)}
              title="Xóa khỏi yêu thích"
            >
              ✕
            </button>
            
            <Link to={`/product/${product.id}`} className="product-image">
              <img 
                src={product.imageUrl || '/placeholder.jpg'} 
                alt={product.name}
                onError={(e) => { e.target.src = '/placeholder.jpg'; }}
              />
            </Link>

            <div className="product-info">
              <Link to={`/product/${product.id}`} className="product-name">
                {product.name}
              </Link>
              {product.brand && (
                <span className="product-brand">{product.brand}</span>
              )}
              <div className="product-price">{formatPrice(product.price)}</div>
            </div>

            <div className="product-actions">
              <button 
                className="btn-add-cart"
                onClick={() => handleAddToCart(product)}
              >
                🛒 Thêm vào giỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
