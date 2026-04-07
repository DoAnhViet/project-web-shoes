import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Products.css';

// Utility to get sale discount for a product
const getSaleDiscount = (product) => {
  if (product && product.discountPercent && product.discountPercent > 0) {
    return product.discountPercent;
  }
  try {
    const productId = product?.id;
    if (!productId) return 0;
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const activeSale = sales.find(sale =>
      sale.isActive && sale.productIds.includes(String(productId))
    );
    return activeSale ? activeSale.discountPercent : 0;
  } catch {
    return 0;
  }
};

function Products() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for filtering
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    brand: '',
    size: '',
    color: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const applyFiltersAndSort = useCallback((productsData) => {
    let filtered = [...productsData];

    // Filter by price range
    if (filters.priceMin) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.priceMax));
    }

    // Filter by brand
    if (filters.brand) {
      filtered = filtered.filter(p => p.brand?.toLowerCase() === filters.brand.toLowerCase());
    }

    // Filter by size (if product has size field)
    if (filters.size) {
      filtered = filtered.filter(p => p.size?.includes(filters.size));
    }

    // Filter by color (if product has color field)
    if (filters.color) {
      filtered = filtered.filter(p => p.color?.toLowerCase().includes(filters.color.toLowerCase()));
    }

    // Sort products
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setProducts(filtered);
  }, [filters, sortBy]);

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
        
        setAllProducts(productsData); // Store all products
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [category, searchQuery]);

  // Apply filters and sorting whenever filters or sortBy changes
  useEffect(() => {
    applyFiltersAndSort(allProducts);
  }, [allProducts, applyFiltersAndSort]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      brand: '',
      size: '',
      color: ''
    });
  };

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
        <button 
          className="btn-toggle-filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
        
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

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-section">
            <h3>Giá</h3>
            <div className="price-range">
              <input
                type="number"
                placeholder="Từ"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Đến"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>Thương hiệu</h3>
            <select 
              value={filters.brand} 
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="Nike">Nike</option>
              <option value="Adidas">Adidas</option>
              <option value="Puma">Puma</option>
              <option value="Converse">Converse</option>
              <option value="Vans">Vans</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Size</h3>
            <select 
              value={filters.size} 
              onChange={(e) => handleFilterChange('size', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="38">38</option>
              <option value="39">39</option>
              <option value="40">40</option>
              <option value="41">41</option>
              <option value="42">42</option>
              <option value="43">43</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Màu sắc</h3>
            <input
              type="text"
              placeholder="Nhập màu..."
              value={filters.color}
              onChange={(e) => handleFilterChange('color', e.target.value)}
            />
          </div>

          <button className="btn-clear-filters" onClick={clearFilters}>
            🗑️ Xóa bộ lọc
          </button>
        </div>
      )}

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
          {products.map(product => {
            const saleDiscount = getSaleDiscount(product);
            const salePrice = saleDiscount > 0 ? product.price * (1 - saleDiscount / 100) : null;

            return (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="product-card"
            >
              {saleDiscount > 0 && (
                <span className="sale-badge">-{saleDiscount}%</span>
              )}
              <div className="product-image">
                <img src={product.imageUrl} alt={product.name} />
              </div>
              <div className="product-info">
                <span className="product-brand">{product.brand?.toUpperCase() || 'BRAND'}</span>
                <h3 className="product-name">{product.name}</h3>
                {salePrice ? (
                  <div className="product-price-wrapper">
                    <p className="product-price sale-price">{formatPrice(salePrice)}</p>
                    <p className="product-price original-price" style={{textDecoration: 'line-through', color: '#999', fontSize: '0.85em'}}>{formatPrice(product.price)}</p>
                  </div>
                ) : (
                  <p className="product-price">{formatPrice(product.price)}</p>
                )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;
