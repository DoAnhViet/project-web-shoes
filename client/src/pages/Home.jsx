import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/api';
import './Home.css';

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [featuredProduct, setFeaturedProduct] = useState(null);

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

        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        if (productsRes.data.length > 0) {
          setFeaturedProduct(productsRes.data[0]);
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

  const formatPriceUSD = (price) => {
    return '$' + Math.round(price / 24000);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <svg viewBox="0 0 24 24" width="50" height="50">
            <path fill="currentColor" d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.197.618.298 1.02.298.86 0 1.962-.378 3.277-.944L21 8.719z"/>
          </svg>
        </div>
        <nav className="nav-menu">
          <a href="#" className="nav-item">New & Featured</a>
          <a href="#" className="nav-item">Men</a>
          <a href="#" className="nav-item">Women</a>
          <a href="#" className="nav-item">Kids</a>
          <a href="#" className="nav-item sale">Sale</a>
        </nav>
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
            </svg>
          </button>
          <button className="icon-btn cart-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
          </button>
          <Link to="/admin" className="admin-link-btn">Admin</Link>
        </div>
      </header>

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
          <button className="explore-btn">
            <span>EXPLORE MORE</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
          <button className="scroll-down-btn">
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
              <p className="featured-price">{formatPriceUSD(featuredProduct.price)}</p>
              <div className="color-options">
                <span className="color-dot" style={{background: '#FF6B35'}}></span>
                <span className="color-dot" style={{background: '#FFD700'}}></span>
                <span className="color-dot" style={{background: '#FF1493'}}></span>
                <span className="color-dot" style={{background: '#8B5CF6'}}></span>
              </div>
              <button className="add-to-bag-btn">Add to Bag</button>
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
            DISCOVER OUR LATEST<br/>
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
            MORE <span className="arrow">↗</span><br/>
            COLLECTION
          </button>
        </div>

        <div className="products-slider">
          <div className="slider-controls">
            <div className="slider-dots">
              {products.slice(0, 4).map((_, idx) => (
                <span key={idx} className={`dot ${idx === 0 ? 'active' : ''}`}></span>
              ))}
            </div>
            <div className="slider-arrows">
              <button className="arrow-btn prev">←</button>
              <button className="arrow-btn next">→ NEXT</button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <span className="product-brand">{product.brand.toUpperCase()}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">{formatPriceUSD(product.price)}</p>
                  <div className="color-options">
                    <span className="color-dot" style={{background: '#32CD32'}}></span>
                    <span className="color-dot" style={{background: '#FFD700'}}></span>
                    <span className="color-dot active" style={{background: '#1E90FF'}}></span>
                    <span className="color-dot" style={{background: '#FF69B4'}}></span>
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
                  <button className="add-to-bag-btn">Add to Bag</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2026 ShoeStore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
