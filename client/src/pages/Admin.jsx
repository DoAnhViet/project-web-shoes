import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/api';
import './Admin.css';

function Admin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    brand: '',
    size: '',
    color: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll()
        ]);
        // Handle paged result format { items: [...] } or direct array
        const productsData = productsRes.data?.items ?? productsRes.data ?? [];
        const categoriesData = categoriesRes.data?.value ?? categoriesRes.data ?? [];
        setProducts(productsData);
        setCategories(categoriesData);
        
        // Load orders from localStorage
        const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(storedOrders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Stock must be 0 or greater';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Image URL is required';
    if (!formData.categoryId) newErrors.categoryId = 'Please select a category';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.size.trim()) newErrors.size = 'Size is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: parseInt(formData.categoryId)
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, { ...data, id: editingProduct.id });
      } else {
        await productsApi.create(data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      setErrors({});

      // Reload data
      const productsRes = await productsApi.getAll();
      setProducts(productsRes.data?.items ?? productsRes.data ?? []);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data || error.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId.toString(),
      brand: product.brand,
      size: product.size,
      color: product.color
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await productsApi.delete(id);
        const productsRes = await productsApi.getAll();
        setProducts(productsRes.data?.items ?? productsRes.data ?? []);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      imageUrl: '',
      categoryId: '',
      brand: '',
      size: '',
      color: ''
    });
    setErrors({});
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: ''
    });
    setErrors({});
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!categoryFormData.name.trim()) newErrors.name = 'Category name is required';
    if (!categoryFormData.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, categoryFormData);
      } else {
        await categoriesApi.create(categoryFormData);
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();

      // Reload categories
      const categoriesRes = await categoriesApi.getAll();
      setCategories(categoriesRes.data?.value ?? categoriesRes.data ?? []);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data || error.message));
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await categoriesApi.delete(id);
        const categoriesRes = await categoriesApi.getAll();
        setCategories(categoriesRes.data?.value ?? categoriesRes.data ?? []);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Không thể xóa danh mục này');
      }
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    resetCategoryForm();
    setShowCategoryModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Order management functions
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', color: 'orange', icon: '⏳' },
      confirmed: { label: 'Đã xác nhận', color: 'blue', icon: '✓' },
      shipping: { label: 'Đang giao hàng', color: 'purple', icon: '🚚' },
      delivered: { label: 'Đã giao hàng', color: 'green', icon: '✅' },
      cancelled: { label: 'Đã hủy', color: 'red', icon: '✕' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      cod: 'COD',
      bank: 'Chuyển khoản',
      card: 'Thẻ',
      momo: 'MoMo'
    };
    return methods[method] || method;
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => {
      if (order.orderId === orderId) {
        const updates = { status: newStatus };
        // Auto update payment status for delivered orders with COD
        if (newStatus === 'delivered' && order.paymentMethod === 'cod') {
          updates.paymentStatus = 'completed';
        }
        return { ...order, ...updates };
      }
      return order;
    });
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // Update selected order if viewing
    if (selectedOrder?.orderId === orderId) {
      const updated = updatedOrders.find(o => o.orderId === orderId);
      setSelectedOrder(updated);
    }
  };

  const handleUpdatePaymentStatus = (orderId, paymentStatus) => {
    const updatedOrders = orders.map(order => 
      order.orderId === orderId ? { ...order, paymentStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    if (selectedOrder?.orderId === orderId) {
      setSelectedOrder({ ...selectedOrder, paymentStatus });
    }
  };

  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === orderFilter);

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0)
  };

  const totalStock = Array.isArray(products) ? products.reduce((sum, p) => sum + (p?.stock || 0), 0) : 0;
  const totalValue = Array.isArray(products) ? products.reduce((sum, p) => sum + ((p?.price || 0) * (p?.stock || 0)), 0) : 0;

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" width="40" height="40">
            <path fill="currentColor" d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.197.618.298 1.02.298.86 0 1.962-.378 3.277-.944L21 8.719z" />
          </svg>
          <span>Admin</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="7" height="9" x="3" y="3" rx="1"></rect>
              <rect width="7" height="5" x="14" y="3" rx="1"></rect>
              <rect width="7" height="9" x="14" y="12" rx="1"></rect>
              <rect width="7" height="5" x="3" y="16" rx="1"></rect>
            </svg>
            Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            Products
          </button>
          <button
            className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
              <path d="M7 7h.01"></path>
            </svg>
            Categories
          </button>
          <button
            className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"></path>
              <path d="M15 3v4a2 2 0 0 0 2 2h4"></path>
            </svg>
            Orders
            {orderStats.pending > 0 && <span className="badge">{orderStats.pending}</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-left">
            <h1>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'products' ? 'Products' : activeTab === 'orders' ? 'Orders' : 'Categories'}</h1>
            <p className="header-subtitle">{activeTab === 'orders' ? 'Manage customer orders' : 'Manage your shoe store inventory'}</p>
          </div>
          <div className="header-right">
            {activeTab === 'products' && (
              <button className="add-btn" onClick={openAddModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
                Add Product
              </button>
            )}
            {activeTab === 'categories' && (
              <button className="add-btn" onClick={openAddCategoryModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
                Add Category
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">{products.length}</span>
                  <span className="stat-label">Total Products</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">{categories.length}</span>
                  <span className="stat-label">Categories</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">{totalStock}</span>
                  <span className="stat-label">Total Stock</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">{formatPrice(totalValue)}</span>
                  <span className="stat-label">Inventory Value</span>
                </div>
              </div>
            </div>

            <div className="recent-products">
              <h3>Recent Products</h3>
              <div className="recent-list">
                {products.slice(0, 5).map(product => (
                  <div key={product.id} className="recent-item">
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="recent-info">
                      <span className="recent-name">{product.name}</span>
                      <span className="recent-brand">{product.brand}</span>
                    </div>
                    <span className="recent-price">{formatPrice(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="products-section">
            <div className="products-grid">
              {Array.isArray(products) && products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="product-actions" style={{ opacity: 1, display: 'flex', position: 'absolute', top: '12px', right: '12px', gap: '8px', zIndex: 10 }}>
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEdit(product)} 
                        title="Chỉnh sửa"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #111', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDelete(product.id)} 
                        title="Xoá"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #111', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <span className="product-brand">{product.brand}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-meta">
                      <span className="product-price">{formatPrice(product.price)}</span>
                      <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="product-details">
                      <span>Size: {product.size}</span>
                      <span>Color: {product.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="categories-section">
            <div className="categories-grid">
              {Array.isArray(categories) && categories.map(category => (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <div className="category-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                        <path d="M7 7h.01"></path>
                      </svg>
                    </div>
                    <div className="category-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEditCategory(category)} 
                        title="Chỉnh sửa"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #111', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeleteCategory(category.id)} 
                        title="Xoá"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #111', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span className="category-count">
                    {products.filter(p => p.categoryId === category.id).length} products
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            {/* Order Stats */}
            <div className="order-stats-grid">
              <div className="order-stat-card total">
                <span className="stat-number">{orderStats.total}</span>
                <span className="stat-label">Tổng đơn</span>
              </div>
              <div className="order-stat-card pending">
                <span className="stat-number">{orderStats.pending}</span>
                <span className="stat-label">Chờ xác nhận</span>
              </div>
              <div className="order-stat-card shipping">
                <span className="stat-number">{orderStats.shipping}</span>
                <span className="stat-label">Đang giao</span>
              </div>
              <div className="order-stat-card delivered">
                <span className="stat-number">{orderStats.delivered}</span>
                <span className="stat-label">Đã giao</span>
              </div>
              <div className="order-stat-card revenue">
                <span className="stat-number">{formatPrice(orderStats.totalRevenue)}</span>
                <span className="stat-label">Doanh thu</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="order-filter-tabs">
              <button 
                className={`filter-tab ${orderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setOrderFilter('all')}
              >
                Tất cả ({orders.length})
              </button>
              <button 
                className={`filter-tab ${orderFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setOrderFilter('pending')}
              >
                Chờ xác nhận ({orderStats.pending})
              </button>
              <button 
                className={`filter-tab ${orderFilter === 'confirmed' ? 'active' : ''}`}
                onClick={() => setOrderFilter('confirmed')}
              >
                Đã xác nhận ({orderStats.confirmed})
              </button>
              <button 
                className={`filter-tab ${orderFilter === 'shipping' ? 'active' : ''}`}
                onClick={() => setOrderFilter('shipping')}
              >
                Đang giao ({orderStats.shipping})
              </button>
              <button 
                className={`filter-tab ${orderFilter === 'delivered' ? 'active' : ''}`}
                onClick={() => setOrderFilter('delivered')}
              >
                Đã giao ({orderStats.delivered})
              </button>
              <button 
                className={`filter-tab ${orderFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setOrderFilter('cancelled')}
              >
                Đã hủy ({orderStats.cancelled})
              </button>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="empty-orders">
                <p>Không có đơn hàng nào</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th>Khách hàng</th>
                      <th>Sản phẩm</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const statusInfo = getStatusInfo(order.status);
                      return (
                        <tr key={order.orderId}>
                          <td className="order-id-cell">
                            <span className="order-id">{order.orderId}</span>
                          </td>
                          <td>
                            {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="customer-cell">
                            <span className="customer-name">{order.shippingInfo?.fullName}</span>
                            <span className="customer-phone">{order.shippingInfo?.phone}</span>
                          </td>
                          <td className="items-cell">
                            <span className="items-count">{order.items?.length} sản phẩm</span>
                          </td>
                          <td className="total-cell">
                            <span className="order-total">{formatPrice(order.total)}</span>
                          </td>
                          <td>
                            <span className={`payment-badge ${order.paymentStatus}`}>
                              {getPaymentMethodName(order.paymentMethod)}
                              {order.paymentStatus === 'completed' ? ' ✓' : ''}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button 
                              className="view-btn"
                              onClick={() => handleViewOrder(order)}
                            >
                              👁️ Xem
                            </button>
                            {order.status === 'pending' && (
                              <button 
                                className="confirm-btn"
                                onClick={() => handleUpdateOrderStatus(order.orderId, 'confirmed')}
                              >
                                ✓ Xác nhận
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button 
                                className="ship-btn"
                                onClick={() => handleUpdateOrderStatus(order.orderId, 'shipping')}
                              >
                                🚚 Giao hàng
                              </button>
                            )}
                            {order.status === 'shipping' && (
                              <button 
                                className="deliver-btn"
                                onClick={() => handleUpdateOrderStatus(order.orderId, 'delivered')}
                              >
                                ✅ Đã giao
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className={errors.name ? 'input-error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group full">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows="3"
                    className={errors.description ? 'input-error' : ''}
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className={errors.categoryId ? 'input-error' : ''}
                  >
                    <option value="">Select category</option>
                    {Array.isArray(categories) && categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
                </div>
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Nike, Adidas..."
                    className={errors.brand ? 'input-error' : ''}
                  />
                  {errors.brand && <span className="error-text">{errors.brand}</span>}
                </div>
                <div className="form-group">
                  <label>Price (VNĐ) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={errors.price ? 'input-error' : ''}
                  />
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={errors.stock ? 'input-error' : ''}
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>
                <div className="form-group">
                  <label>Size *</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="42"
                    className={errors.size ? 'input-error' : ''}
                  />
                  {errors.size && <span className="error-text">{errors.size}</span>}
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="Black, White..."
                    className={errors.color ? 'input-error' : ''}
                  />
                  {errors.color && <span className="error-text">{errors.color}</span>}
                </div>
                <div className="form-group full">
                  <label>Image URL *</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className={errors.imageUrl ? 'input-error' : ''}
                  />
                  {errors.imageUrl && <span className="error-text">{errors.imageUrl}</span>}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="close-btn" onClick={() => setShowCategoryModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="modal-form">
              <div className="form-group full">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  placeholder="e.g., Áo, Giày, Quần..."
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group full">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  placeholder="Enter category description"
                  rows="3"
                  className={errors.description ? 'input-error' : ''}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng #{selectedOrder.orderId}</h2>
              <button className="close-btn" onClick={() => setShowOrderModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="order-modal-content">
              {/* Order Info */}
              <div className="order-info-grid">
                <div className="info-section">
                  <h4>Thông tin đơn hàng</h4>
                  <p><strong>Mã đơn:</strong> {selectedOrder.orderId}</p>
                  <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</p>
                  <p><strong>Trạng thái:</strong> 
                    <select 
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.orderId, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Chờ xác nhận</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="shipping">Đang giao hàng</option>
                      <option value="delivered">Đã giao hàng</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </p>
                </div>
                <div className="info-section">
                  <h4>Khách hàng</h4>
                  <p><strong>Họ tên:</strong> {selectedOrder.shippingInfo?.fullName}</p>
                  <p><strong>SĐT:</strong> {selectedOrder.shippingInfo?.phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.shippingInfo?.email}</p>
                </div>
                <div className="info-section">
                  <h4>Địa chỉ giao hàng</h4>
                  <p>{selectedOrder.shippingInfo?.address}</p>
                  <p>{selectedOrder.shippingInfo?.ward}, {selectedOrder.shippingInfo?.district}</p>
                  <p>{selectedOrder.shippingInfo?.city}</p>
                  {selectedOrder.shippingInfo?.note && <p><em>Ghi chú: {selectedOrder.shippingInfo.note}</em></p>}
                </div>
                <div className="info-section">
                  <h4>Thanh toán</h4>
                  <p><strong>Phương thức:</strong> {getPaymentMethodName(selectedOrder.paymentMethod)}</p>
                  <p><strong>Trạng thái:</strong> 
                    <select 
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => handleUpdatePaymentStatus(selectedOrder.orderId, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Chưa thanh toán</option>
                      <option value="completed">Đã thanh toán</option>
                    </select>
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items-section">
                <h4>Sản phẩm đặt hàng</h4>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Đơn giá</th>
                      <th>SL</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="item-cell">
                          <img src={item.image} alt={item.name} />
                          <div>
                            <span className="item-name">{item.name}</span>
                            {item.size && <span className="item-variant">Size: {item.size}</span>}
                          </div>
                        </td>
                        <td>{formatPrice(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Total */}
              <div className="order-total-section">
                <div className="total-row">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>Phí vận chuyển:</span>
                  <span>{selectedOrder.shipping === 0 ? 'Miễn phí' : formatPrice(selectedOrder.shipping)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="total-row discount">
                    <span>Giảm giá:</span>
                    <span>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
