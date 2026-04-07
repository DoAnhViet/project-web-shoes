import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi, salesApi } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [activeSales, setActiveSales] = useState([]);
  const [showSaleNotification, setShowSaleNotification] = useState(false);

  // Category name mapping for consistent filtering
  const categoryNameMap = {
    'giày thể thao': 'sports',
    'giày công sở': 'office', 
    'giày sneaker': 'sneaker',
    'men': 'men',
    'women': 'women',
    'kids': 'kids',
    'sale': 'sale',
    'giày nam': 'men',
    'giày nữ': 'women',
    'giày trẻ em': 'kids',
    'khuyến mãi': 'sale'
  };

  // Category ID mapping (same as Products.jsx)
  const catMap = {
    'men': 4,
    'women': 5,
    'kids': 6,
    'sale': 7,
    'sports': 1,
    'office': 2,
    'sneaker': 3
  };

  // Load products and categories
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // First load categories to get the mapping
      const categoriesRes = await categoriesApi.getAll();
      const categoriesData = categoriesRes.data?.value ?? categoriesRes.data ?? [];
      setCategories(categoriesData);
      
      // Now load products with proper category filtering
      const params = { pageSize: 10000 };
      if (selectedCategory) {
        // Try to find the category by name first
        const foundCategory = categoriesData.find(cat => 
          cat.name.toLowerCase() === selectedCategory.toLowerCase() ||
          categoryNameMap[cat.name.toLowerCase()] === selectedCategory
        );
        
        if (foundCategory) {
          params.categoryId = foundCategory.id;
        } else {
          // Fallback to name mapping
          const categoryKey = categoryNameMap[selectedCategory.toLowerCase()] || selectedCategory.toLowerCase();
          if (catMap[categoryKey]) {
            params.categoryId = catMap[categoryKey];
          } else {
            // If it's already a number (ID), use it directly
            const categoryId = parseInt(selectedCategory);
            if (!isNaN(categoryId)) {
              params.categoryId = categoryId;
            }
          }
        }
      }

      const productsRes = await productsApi.getAll(params);
      const productsData = productsRes.data?.items ?? productsRes.data?.value ?? productsRes.data ?? [];

      setProducts(productsData);
      if (productsData && productsData.length > 0) {
        setFeaturedProduct(productsData[0]);
      }
      
      // Load sales
      loadActiveSales();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Listen for product and sales updates
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'sales' || event.key === 'saleUpdated') {
        loadActiveSales();
      }
      if (event.key === 'productUpdated') {
        loadData();
      }
    };
    
    const handleCustomProductUpdate = () => {
      loadData();
    };
    
    const handleCustomSaleUpdate = () => {
      loadActiveSales();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productUpdated', handleCustomProductUpdate);
    window.addEventListener('saleUpdated', handleCustomSaleUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productUpdated', handleCustomProductUpdate);
      window.removeEventListener('saleUpdated', handleCustomSaleUpdate);
    };
  }, [loadData]);

  // Show notification when sales exist
  useEffect(() => {
    if (activeSales.length > 0) {
      setShowSaleNotification(true);
      const timer = setTimeout(() => setShowSaleNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeSales]);

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

  const handleAddFeaturedToCart = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/login');
      return;
    }

    if (featuredProduct) {
      navigate(`/product/${featuredProduct.id}`);
    }
  };

  // Slider controls
  const productsPerPage = 4;
  const totalSlides = Math.ceil(products.length / productsPerPage);
  
  const nextSlide = () => {
    setSliderIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setSliderIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const currentProducts = products.slice(
    sliderIndex * productsPerPage,
    (sliderIndex + 1) * productsPerPage
  );

  // Newsletter subscribe
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert('🎉 Cảm ơn bạn đã đăng ký nhận tin!');
      setEmail('');
    }
  };

  // Scroll to products section
  const scrollToProducts = () => {
    document.querySelector('.collection-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      {/* Sale Notification Banner */}
      {showSaleNotification && activeSales.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
          color: '#fff',
          padding: '15px 20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          🎉 CÓ {activeSales.length} CHƯƠNG TRÌNH SALE MỚI! Đừng bỏ lỡ cơ hội tiết kiệm! 🎉
        </div>
      )}
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-sidebar">
          <div className="category-list">
            <button
              className={`category-item ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              ALL SHOES
            </button>
            {categories.map(cat => {
              // Map category name to key for consistent filtering
              const categoryKey = categoryNameMap[cat.name.toLowerCase()] || cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  className={`category-item ${selectedCategory === categoryKey ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(categoryKey)}
                >
                  {cat.name.toUpperCase()}
                </button>
              );
            })}
          </div>
          <div className="hero-text-block">
            <h3>UNBEATABLE PERFORMANCE</h3>
            <p>We've dedicated ourselves to crafting the perfect footwear for every enthusiast.</p>
            <div className="year-badge">
              <span className="star">✱</span>
              <span className="year">2026</span>
            </div>
          </div>
        </div>

        <div className="hero-main">
          <h1 className="hero-title">
            <span className="italic">CRAFTED FOR</span>
            <span className="italic">CHAMPIONS</span>
          </h1>
          {featuredProduct && (
            <div className="hero-product-image">
              <img src={featuredProduct.imageUrl} alt={featuredProduct.name} />
            </div>
          )}
          <button className="explore-btn" onClick={scrollToProducts}>
            <span>EXPLORE MORE</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
          <button className="scroll-down-btn" onClick={scrollToProducts}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14"></path>
              <path d="m19 12-7 7-7-7"></path>
            </svg>
          </button>
        </div>

        <div className="hero-featured">
          {featuredProduct && (
            <div className="featured-card">
              <span className="limited-tag">LIMITED EDITION</span>
              <h3>{featuredProduct.name.toUpperCase()}</h3>
              <p className="featured-price">{formatPrice(featuredProduct.price)}</p>
              <div className="color-options">
                <span className="color-dot" style={{ background: '#FF6B35' }}></span>
                <span className="color-dot" style={{ background: '#FFD700' }}></span>
                <span className="color-dot" style={{ background: '#FF1493' }}></span>
                <span className="color-dot" style={{ background: '#8B5CF6' }}></span>
              </div>
              <button className="add-to-bag-btn" onClick={handleAddFeaturedToCart}>Add to Bag</button>
            </div>
          )}
        </div>
      </section>

      {/* Collection Section */}
      <section className="collection-section">
        <div className="collection-header">
          <div className="collection-tabs">
            <button className="tab-btn active">NEW COLLECTION</button>
            <button className="tab-btn">BEST SELLER</button>
          </div>
          <h2 className="collection-title">
            DISCOVER OUR LATEST<br />
            <span className="highlight">COLLECTION</span>
          </h2>
          <p className="collection-desc">
            Featuring the freshest arrival and the hottest shoes style, our collection is the perfect way to stay ahead of the fashion game and express your unique style
          </p>
          <div className="collection-thumbnails">
            {products.slice(0, 2).map((product, idx) => (
              <div key={idx} className="thumb-item">
                <img src={product.imageUrl} alt={product.name} />
              </div>
            ))}
            <span className="spark-icon">✦</span>
          </div>
          <button className="more-collection-btn">
            MORE <span className="arrow">↗</span><br />
            COLLECTION
          </button>
        </div>

        <div className="products-slider">
          <div className="slider-controls">
            <div className="slider-dots">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === sliderIndex ? 'active' : ''}`}
                  onClick={() => setSliderIndex(idx)}
                ></span>
              ))}
            </div>
            <div className="slider-arrows">
              <button className="arrow-btn prev" onClick={prevSlide}>←</button>
              <button className="arrow-btn next" onClick={nextSlide}>→ NEXT</button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="products-grid">
              {currentProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} className="product-card">
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
                    onClick={(e) => {
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
                    }}
                  >
                    Thêm vào giỏ
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <div className="newsletter-text">
            <h2>ĐĂNG KÝ NHẬN TIN</h2>
            <p>Nhận thông báo về sản phẩm mới và ưu đãi đặc biệt</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">ĐĂNG KÝ</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <h3 className="footer-logo">KICKS</h3>
            <p className="footer-tagline">Your go-to destination for the latest and greatest in footwear fashion.</p>
            <div className="footer-social">
              <a href="#" className="social-icon">📘</a>
              <a href="#" className="social-icon">📸</a>
              <a href="#" className="social-icon">🐦</a>
              <a href="#" className="social-icon">📺</a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Sản Phẩm</h4>
              <ul>
                <li><Link to="/">Giày Nam</Link></li>
                <li><Link to="/">Giày Nữ</Link></li>
                <li><Link to="/">Giày Thể Thao</Link></li>
                <li><Link to="/">Phụ Kiện</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Hỗ Trợ</h4>
              <ul>
                <li><Link to="/">Hướng Dẫn Mua Hàng</Link></li>
                <li><Link to="/">Chính Sách Đổi Trả</Link></li>
                <li><Link to="/">Vận Chuyển</Link></li>
                <li><Link to="/">FAQ</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Về Chúng Tôi</h4>
              <ul>
                <li><Link to="/">Giới Thiệu</Link></li>
                <li><Link to="/">Tuyển Dụng</Link></li>
                <li><Link to="/">Liên Hệ</Link></li>
                <li><Link to="/">Blog</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 KICKS. All rights reserved. Made with ❤️ in Vietnam</p>
          <div className="footer-payments">
            <span>💳 Visa</span>
            <span>💳 Mastercard</span>
            <span>📱 MoMo</span>
            <span>🏦 VNPay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
