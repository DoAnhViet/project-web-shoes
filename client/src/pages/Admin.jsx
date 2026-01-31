import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/api';
import './Admin.css';

function Admin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
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
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
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
      setProducts(productsRes.data);
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
        setProducts(productsRes.data);
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
      setCategories(categoriesRes.data);
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
        setCategories(categoriesRes.data);
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

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

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
            <h1>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'products' ? 'Products' : 'Categories'}</h1>
            <p className="header-subtitle">Manage your shoe store inventory</p>
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
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="product-actions">
                      <button className="action-btn edit" onClick={() => handleEdit(product)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(product.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
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
              {categories.map(category => (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <div className="category-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                        <path d="M7 7h.01"></path>
                      </svg>
                    </div>
                    <div className="category-actions">
                      <button className="action-btn edit" onClick={() => handleEditCategory(category)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteCategory(category.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
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
                    {categories.map(cat => (
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
    </div>
  );
}

export default Admin;
