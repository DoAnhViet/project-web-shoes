import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Products.css';

function Products() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const categoryNames = {
    'men': 'Giày Nam',
    'women': 'Giày Nữ',
    'kids': 'Giày Trẻ Em',
    'sale': 'Giảm Giá',
    'sports': 'Giày Thể Thao',
    'office': 'Giày Công Sở',
    'sneaker': 'Giày Sneaker'
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const params = {};
        const catMap = {
          'men': 4,
          'women': 5,
          'kids': 6,
          'sale': 7,
          'sports': 1,
          'office': 2,
          'sneaker': 3
        };
        if (category && catMap[category]) {
          params.categoryId = catMap[category];
        }
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await productsApi.getAll(params);
        let productsData = response.data?.items ?? response.data?.value ?? response.data ?? [];
        
        // Client-side search filter if API doesn't support search
        if (searchQuery && productsData.length > 0) {
          const query = searchQuery.toLowerCase();
          productsData = productsData.filter(p => 
            p.name?.toLowerCase().includes(query) ||
            p.brand?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
          );
        }
        
        // Sort products
        let sortedProducts = [...productsData];
        if (sortBy === 'price-low') {
          sortedProducts.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
          sortedProducts.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'name') {
          sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        setProducts(sortedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [category, sortBy, searchQuery]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/login');
      return;
    }

    addToCart({
      ...product,
      size: product.size,
      color: product.color
    }, 1);
  };

  const pageTitle = searchQuery 
    ? `Kết quả tìm kiếm: "${searchQuery}"` 
    : category 
      ? categoryNames[category] || 'Sản Phẩm' 
      : 'Tất Cả Sản Phẩm';

  return (
    <div className="products-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <span>{pageTitle}</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <p>{products.length} sản phẩm</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <span>Sắp xếp:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="price-low">Giá thấp → cao</option>
            <option value="price-high">Giá cao → thấp</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : products.length === 0 ? (
        <div className="no-products">
          <p>Không có sản phẩm nào trong danh mục này</p>
          <Link to="/" className="back-home-btn">Quay lại trang chủ</Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`} 
              className="product-card"
            >
              {category === 'sale' && (
                <span className="sale-badge">SALE</span>
              )}
              <div className="product-image">
                <img src={product.imageUrl} alt={product.name} />
              </div>
              <div className="product-info">
                <span className="product-brand">{product.brand?.toUpperCase() || 'BRAND'}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{formatPrice(product.price)}</p>
                <div className="product-meta">
                  <span className="product-size">Size: {product.size}</span>
                  <span className="product-color">{product.color}</span>
                </div>
              </div>
              <button 
                className="add-to-cart-btn"
                onClick={(e) => handleAddToCart(product, e)}
              >
                Thêm vào giỏ
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
