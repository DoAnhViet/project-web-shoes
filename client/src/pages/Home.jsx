import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/api';
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;

        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.getAll(params),
          categoriesApi.getAll()
        ]);

        // Normalize products response (supports paged result { items, ... } or direct array)
        const productsData = productsRes.data?.items ?? productsRes.data?.value ?? productsRes.data ?? [];
        // Normalize categories response (supports { value: [...] } or direct array)
        const categoriesData = categoriesRes.data?.value ?? categoriesRes.data ?? [];

        setProducts(productsData);
        setCategories(categoriesData);
        if (productsData && productsData.length > 0) {
          setFeaturedProduct(productsData[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedCategory]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddFeaturedToCart = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/login');
      return;
    }

    if (featuredProduct) {
      addToCart({
        ...featuredProduct,
        size: featuredProduct.size,
        color: featuredProduct.color
      }, 1);
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
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-item ${selectedCategory === cat.id.toString() ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id.toString())}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
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
                <Link key={product.id} to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }} className="product-link">
                  <div className="product-card">
                    <span className="product-brand">{product.brand?.toUpperCase() || 'BRAND'}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">{formatPrice(product.price)}</p>
                    <div className="color-options">
                      <span className="color-dot" style={{ background: '#32CD32' }}></span>
                      <span className="color-dot" style={{ background: '#FFD700' }}></span>
                      <span className="color-dot active" style={{ background: '#1E90FF' }}></span>
                      <span className="color-dot" style={{ background: '#FF69B4' }}></span>
                    </div>
                    <div className="product-image">
                      <img src={product.imageUrl} alt={product.name} />
                    </div>
                    <div className="size-options">
                      <span className="size">40</span>
                      <span className="size active">42</span>
                      <span className="size">41</span>
                      <span className="size">43</span>
                    </div>
                    <div className="add-to-bag-btn">
                      View Details →
                    </div>
                  </div>
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
