import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi, salesApi } from '../api/api';
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
  const [allProducts, setAllProducts] = useState([]); // Store all products for filtering
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [activeSales, setActiveSales] = useState([]);
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    brand: '',
    size: '',
    color: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const categoryNames = {
    'men': 'Giày Nam',
    'women': 'Giày Nữ',
    'kids': 'Giày Trẻ Em',
    'sale': 'Giảm Giá',
    'sports': 'Giày Thể Thao',
    'office': 'Giày Công Sở',
    'sneaker': 'Giày Sneaker'
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { pageSize: 10000 };
      const catMap = {
        'men': 4,
        'women': 5,
        'kids': 6,
        'sale': 7,
        'sports': 1,
        'office': 2,
        'sneaker': 3
      };
      if (category && category !== 'sale' && catMap[category]) {
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

      // If this is the sale category page, only show products currently in active sales
      if (category === 'sale') {
        const salesRes = await salesApi.getActive();
        const activeSalesData = salesRes.data?.value ?? salesRes.data ?? [];
        const activeSalesIds = new Set(
          activeSalesData.flatMap(sale => {
            if (sale.saleProducts) {
              return sale.saleProducts.map(sp => String(sp.productId));
            }
            return sale.productIds ? sale.productIds.map(String) : [];
          })
        );
        productsData = productsData.filter(p => activeSalesIds.has(String(p.id)));
      }
      
      setAllProducts(productsData); // Store all products
      applyFiltersAndSort(productsData); // Apply filters
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery]);

  useEffect(() => {
    loadProducts();
    loadActiveSales();
  }, [loadProducts]);

  // Listen for products and sales updates (both cross-tab and same-tab)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'sales' || event.key === 'saleUpdated') {
        loadActiveSales();
        if (category === 'sale') {
          loadProducts();
        }
      }
      if (event.key === 'productUpdated') {
        loadProducts();
      }
    };
    
    const handleCustomProductUpdate = () => {
      loadProducts();
    };
    
    const handleCustomSaleUpdate = () => {
      loadActiveSales();
      if (category === 'sale') {
        loadProducts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productUpdated', handleCustomProductUpdate);
    window.addEventListener('saleUpdated', handleCustomSaleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productUpdated', handleCustomProductUpdate);
      window.removeEventListener('saleUpdated', handleCustomSaleUpdate);
    };
  }, [loadProducts, category]);

  const loadActiveSales = async () => {
    try {
      const res = await salesApi.getActive();
      const salesData = res.data?.value ?? res.data ?? [];
      setActiveSales(salesData);
    } catch (err) {
      console.error('Error loading sales:', err);
      setActiveSales([]);
    }
  };

  // Apply filters and sorting whenever filters or sortBy changes
  useEffect(() => {
    if (allProducts.length > 0) {
      applyFiltersAndSort(allProducts);
    }
  }, [filters, sortBy]);

  const applyFiltersAndSort = (productsData) => {
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
  };

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

  const getSaleDiscount = (productId) => {
    const sale = activeSales.find(s => {
      if (s.saleProducts) {
        return s.saleProducts.some(sp => sp.productId === productId || String(sp.productId) === String(productId));
      }
      return s.productIds?.includes(String(productId));
    });
    return sale ? sale.discountPercent : 0;
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/login');
      return;
    }

    const saleDiscount = getSaleDiscount(product.id);
    addToCart({
      ...product,
      size: product.size,
      color: product.color,
      saleDiscount: saleDiscount || 0
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
          {products.map(product => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`} 
              className="product-card"
            >
              {category === 'sale' && (
                <span className="sale-badge">SALE</span>
              )}
              <div className="product-image" style={{ position: 'relative' }}>
                <img src={product.imageUrl} alt={product.name} />
                {getSaleDiscount(product.id) > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#ff6b6b',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 10
                  }}>
                    -{getSaleDiscount(product.id)}%
                  </div>
                )}
              </div>
              <div className="product-info">
                <span className="product-brand">{product.brand?.toUpperCase() || 'BRAND'}</span>
                <h3 className="product-name">{product.name}</h3>
                {getSaleDiscount(product.id) > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p className="product-price" style={{ textDecoration: 'line-through', color: '#999', margin: '0', fontSize: '12px' }}>
                      {formatPrice(product.price)}
                    </p>
                    <p className="product-price" style={{ color: '#ff6b6b', margin: '0' }}>
                      {formatPrice(product.price * (1 - getSaleDiscount(product.id) / 100))}
                    </p>
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
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
