import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi, ordersApi, usersApi } from '../api/api';
import { useNotification } from '../context/NotificationContext';
import './Admin.css';

const PASSWORD_UNCHANGED_MASK = '********';

function Admin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [showAdminNotifications, setShowAdminNotifications] = useState(false);
  const [ordersLoadError, setOrdersLoadError] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [saleData, setSaleData] = useState({ discountPercent: '', saleName: '' });
  const [activeSales, setActiveSales] = useState([]);
  const { addNotification } = useNotification();
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
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'Customer',
    isActive: true
  });
  const [editUserForm, setEditUserForm] = useState({
    id: null,
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'Customer',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  // Helper to safely format date
  const formatDate = (dateValue, includeTime = false) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return includeTime 
      ? date.toLocaleString('vi-VN')
      : date.toLocaleDateString('vi-VN');
  };

  const loadOrders = async () => {
    try {
      const ordersRes = await ordersApi.getAll({ pageNumber: 1, pageSize: 100 });
      const apiOrders = ordersRes.data?.items || ordersRes.data || [];
      const normalizedApiOrders = apiOrders.map(order => normalizeOrder(order));

      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const hasInvalidOrders = localOrders.some(order => {
          if (!order || !Array.isArray(order.items)) return true;
          const totalValue = typeof order.total === 'number'
            ? order.total
            : typeof order.totalPrice === 'number'
              ? order.totalPrice
              : Number(order.total ?? order.totalAmount ?? order.totalPrice);
          return Number.isNaN(totalValue);
        });
        if (hasInvalidOrders) {
          console.warn('Found invalid orders in localStorage, clearing...');
          localStorage.removeItem('orders');
          localOrders = [];
        }
      } catch (e) {
        console.error('Error parsing localStorage orders:', e);
        localStorage.removeItem('orders');
        localOrders = [];
      }

      const validLocalOrders = localOrders.filter(local => {
        const localTotal = typeof local.total === 'number'
          ? local.total
          : typeof local.totalPrice === 'number'
            ? local.totalPrice
            : Number(local.total ?? local.totalAmount ?? local.totalPrice);

        const hasOrderId = Boolean(local.orderCode || local.orderId || local.id);
        return hasOrderId &&
               (local.shippingInfo || local.fullName || local.customerInfo) &&
               !isNaN(localTotal) &&
               Array.isArray(local.items);
      });

      const localOnlyOrders = validLocalOrders
        .filter(local => {
          const localOrderId = local.orderCode || local.orderId || local.id;
          return !normalizedApiOrders.some(api => api.orderId === localOrderId);
        })
        .map(local => normalizeOrder(local));

      // Sort orders by date (newest first)
      const allOrders = [...normalizedApiOrders, ...localOnlyOrders].sort((a, b) => {
        const dateA = new Date(a.orderDate || a.createdAt || a.date || 0);
        const dateB = new Date(b.orderDate || b.createdAt || b.date || 0);
        return dateB - dateA; // Newest first
      });

      setOrders(allOrders);
      setOrdersLoadError('');
    } catch (orderError) {
      console.error('Error fetching orders from API, using localStorage:', orderError);
      setOrdersLoadError('Không thể tải đơn hàng từ API, đang hiển thị dữ liệu cục bộ');
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const normalizedOrders = storedOrders
        .filter(order => order && typeof order === 'object')
        .map(order => normalizeOrder(order))
        .filter(order => order.orderId !== 'UNKNOWN' && order.total >= 0)
        .sort((a, b) => {
          const dateA = new Date(a.orderDate || a.createdAt || a.date || 0);
          const dateB = new Date(b.orderDate || b.createdAt || b.date || 0);
          return dateB - dateA; // Newest first
        });
      setOrders(normalizedOrders);
    }
  };

  const loadUsers = async () => {
    try {
      const usersRes = await usersApi.getAll();
      const usersData = usersRes.data ?? [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('[Admin] Error fetching users:', error);
      addNotification('❌ Không thể tải danh sách người dùng', 4000);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll()
        ]);
        const productsData = productsRes.data?.items ?? productsRes.data ?? [];
        const categoriesData = categoriesRes.data?.value ?? categoriesRes.data ?? [];
        
        setProducts(productsData);
        setCategories(categoriesData);
        await loadUsers();
        loadActiveSales();
        await loadOrders();
      } catch (error) {
        console.error('[Admin] Error fetching data:', error);
      }
    };

    loadData();
    loadAdminNotifications();

    const interval = setInterval(loadOrders, 10000);

    const handleStorage = (event) => {
      if (event.key === 'notifications_admin') {
        loadAdminNotifications();
      }
      if (event.key === 'orders' || event.key === 'lastOrderSync') {
        loadOrders();
      }
    };

    const handleFocus = () => {
      loadOrders();
      loadAdminNotifications();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetNewUserForm = () => {
    setNewUserForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: 'Customer',
      isActive: true
    });
  };

  const handleEditUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openEditUserModal = (user) => {
    setEditUserForm({
      id: user.id,
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      password: PASSWORD_UNCHANGED_MASK,
      role: user.role || 'Customer',
      isActive: !!user.isActive
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editUserForm.id) return;

    if (
      editUserForm.password &&
      editUserForm.password !== PASSWORD_UNCHANGED_MASK &&
      editUserForm.password.length < 6
    ) {
      addNotification('❌ Mật khẩu tối thiểu 6 ký tự', 4000);
      return;
    }

    try {
      setIsUpdatingUser(true);
      await usersApi.update(editUserForm.id, {
        fullName: editUserForm.fullName,
        phone: editUserForm.phone,
        address: editUserForm.address,
        password: editUserForm.password && editUserForm.password !== PASSWORD_UNCHANGED_MASK
          ? editUserForm.password
          : null,
        role: editUserForm.role,
        isActive: editUserForm.isActive
      });

      addNotification('✅ Cập nhật user thành công', 3000);
      setShowEditUserModal(false);
      await loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật user';
      addNotification(`❌ ${errorMessage}`, 4000);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Xóa user ${user.email}?`)) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      await usersApi.delete(user.id);
      addNotification('✅ Đã xóa user', 3000);
      await loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể xóa user';
      addNotification(`❌ ${errorMessage}`, 4000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUserForm.fullName.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
      addNotification('❌ Vui lòng nhập họ tên, email và mật khẩu', 4000);
      return;
    }

    if (newUserForm.password.length < 6) {
      addNotification('❌ Mật khẩu tối thiểu 6 ký tự', 4000);
      return;
    }

    try {
      setIsCreatingUser(true);
      await usersApi.create({
        fullName: newUserForm.fullName,
        email: newUserForm.email,
        password: newUserForm.password,
        phone: newUserForm.phone,
        address: newUserForm.address,
        role: newUserForm.role,
        isActive: newUserForm.isActive
      });

      addNotification('✅ Tạo user thành công', 3000);
      resetNewUserForm();
      setShowUserModal(false);
      await loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo user';
      addNotification(`❌ ${errorMessage}`, 4000);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const parseSizeInventory = (sizeString) => {
    let totalStock = 0;
    const entries = sizeString.split(',').map(item => item.trim()).filter(Boolean);
    entries.forEach(entry => {
      if (entry.includes(':')) {
        const parts = entry.split(':').map(part => part.trim());
        const qty = parseInt(parts[1], 10);
        if (!isNaN(qty)) {
          totalStock += qty;
        }
      }
    });
    return totalStock;
  };

  const validateSizeFormat = (sizeString) => {
    if (!sizeString.trim()) return { valid: false, message: 'Vui lòng nhập size inventory' };
    
    const entries = sizeString.split(',').map(item => item.trim()).filter(Boolean);
    if (entries.length === 0) return { valid: false, message: 'Vui lòng nhập size inventory' };
    
    for (let entry of entries) {
      if (!entry.includes(':')) {
        return { valid: false, message: `"${entry}" - thiếu dấu ':' giữa size và số lượng` };
      }
      
      const [size, qty] = entry.split(':').map(part => part.trim());
      if (!size) return { valid: false, message: 'Size không được để trống' };
      if (!qty) return { valid: false, message: `Size "${size}" - thiếu số lượng` };
      
      const quantity = parseInt(qty, 10);
      if (isNaN(quantity)) return { valid: false, message: `Size "${size}" - số lượng phải là số: "${qty}"` };
      if (quantity < 0) return { valid: false, message: `Size "${size}" - số lượng không được âm` };
    }
    
    return { valid: true, message: '' };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'size') {
      const validation = validateSizeFormat(value);
      const totalStock = validation.valid ? parseSizeInventory(value) : 0;
      setFormData(prev => ({
        ...prev,
        size: value,
        stock: totalStock > 0 ? totalStock.toString() : prev.stock
      }));
      
      // Update size validation error in real-time
      if (value.trim() && !validation.valid) {
        setErrors(prev => ({
          ...prev,
          size: validation.message
        }));
      } else if (value.trim() && validation.valid) {
        setErrors(prev => ({
          ...prev,
          size: ''
        }));
      }
      return;
    }

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
    
    // Validate size format
    const sizeValidation = validateSizeFormat(formData.size);
    if (!sizeValidation.valid) {
      newErrors.size = sizeValidation.message;
    }
    
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

      let productId;
      if (editingProduct) {
        await productsApi.update(editingProduct.id, { ...data, id: editingProduct.id });
        productId = editingProduct.id;
        addNotification(`✅ Đã cập nhật sản phẩm "${data.name}"`, 3000);
      } else {
        const response = await productsApi.create(data);
        productId = response.data?.id || response.data;
        addNotification(`✅ Đã thêm sản phẩm mới "${data.name}"`, 3000);
      }

      // Trigger product update event for ProductDetail to refresh
      localStorage.setItem('adminProductUpdate', JSON.stringify({ 
        productId: productId,
        timestamp: Date.now()
      }));

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      setErrors({});

      // Reload data
      const productsRes = await productsApi.getAll();
      setProducts(productsRes.data?.items ?? productsRes.data ?? []);
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.title
        || error.message 
        || 'Không thể lưu sản phẩm';
      addNotification(`❌ Lỗi: ${errorMsg}`, 5000);
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
    const product = products.find(p => p.id === id);
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await productsApi.delete(id);
        addNotification(`🗑️ Đã xóa sản phẩm "${product?.name || id}"`, 3000);
        const productsRes = await productsApi.getAll();
        setProducts(productsRes.data?.items ?? productsRes.data ?? []);
      } catch (error) {
        console.error('Error deleting product:', error);
        addNotification(`❌ Không thể xóa sản phẩm`, 5000);
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
        addNotification(`✅ Đã cập nhật danh mục "${categoryFormData.name}"`, 3000);
      } else {
        await categoriesApi.create(categoryFormData);
        addNotification(`✅ Đã thêm danh mục mới "${categoryFormData.name}"`, 3000);
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();

      // Reload categories
      const categoriesRes = await categoriesApi.getAll();
      setCategories(categoriesRes.data?.value ?? categoriesRes.data ?? []);
    } catch (error) {
      console.error('Error saving category:', error);
      addNotification(`❌ Lỗi: ${error.response?.data?.message || error.message}`, 5000);
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
    const category = categories.find(c => c.id === id);
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await categoriesApi.delete(id);
        addNotification(`🗑️ Đã xóa danh mục "${category?.name || id}"`, 3000);
        const categoriesRes = await categoriesApi.getAll();
        setCategories(categoriesRes.data?.value ?? categoriesRes.data ?? []);
      } catch (error) {
        console.error('Error deleting category:', error);
        addNotification(`❌ Không thể xóa danh mục`, 5000);
      }
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    resetCategoryForm();
    setShowCategoryModal(true);
  };

  const openAddUserModal = () => {
    resetNewUserForm();
    setShowUserModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Sale Management Functions
  const loadActiveSales = () => {
    try {
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      setActiveSales(sales.filter(s => s.isActive));
    } catch (err) {
      console.error('Error loading sales:', err);
    }
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    const idString = String(productId);
    if (newSelected.has(idString)) {
      newSelected.delete(idString);
    } else {
      newSelected.add(idString);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      const allIds = new Set(products.map(p => String(p.id)));
      setSelectedProducts(allIds);
    }
  };

  const handleCreateSale = async () => {
    console.log('[Admin] handleCreateSale called - selectedProducts:', selectedProducts.size);

    if (!saleData.saleName.trim()) {
      addNotification('❌ Vui lòng nhập tên chương trình sale', 3000);
      return;
    }
    if (!saleData.discountPercent || parseFloat(saleData.discountPercent) <= 0 || parseFloat(saleData.discountPercent) > 100) {
      addNotification('❌ Giảm giá phải từ 1-100%', 3000);
      return;
    }
    if (selectedProducts.size === 0) {
      addNotification('❌ Vui lòng chọn ít nhất 1 sản phẩm', 3000);
      return;
    }

    try {
      const productCount = selectedProducts.size;
      const productIdsArray = Array.from(selectedProducts).map(String);
      const productIdsInt = Array.from(selectedProducts).map(Number);
      const discountValue = parseInt(saleData.discountPercent);

      // Batch update discountPercent in database via API
      console.log('[Admin] Updating discount in DB:', productIdsInt, discountValue);
      await productsApi.batchUpdateDiscount(productIdsInt, discountValue);
      console.log('[Admin] DB update successful');

      // Update local products state
      setProducts(prev => prev.map(p =>
        selectedProducts.has(p.id) ? { ...p, discountPercent: discountValue } : p
      ));

      const newSale = {
        id: `sale_${Date.now()}`,
        name: saleData.saleName,
        discountPercent: discountValue,
        productIds: productIdsArray,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      sales.push(newSale);
      localStorage.setItem('sales', JSON.stringify(sales));

      setActiveSales(sales.filter(sale => sale.isActive === true));
      setSaleData({ discountPercent: '', saleName: '' });
      setSelectedProducts(new Set());
      setShowSaleModal(false);
      addNotification(`✅ Tạo chương trình sale "${saleData.saleName}" thành công! Áp dụng cho ${productCount} sản phẩm`, 3000);

      localStorage.setItem('saleUpdated', JSON.stringify({ timestamp: Date.now() }));
    } catch (err) {
      console.error('[Admin Sale] Error creating sale:', err);
      addNotification('❌ Không thể tạo chương trình sale: ' + (err.response?.data?.message || err.message), 5000);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Xóa chương trình sale này?')) {
      try {
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        const saleToDelete = sales.find(s => s.id === saleId);

        // Reset discountPercent to 0 in database for affected products
        if (saleToDelete && saleToDelete.productIds) {
          const productIdsInt = saleToDelete.productIds.map(Number);
          await productsApi.batchUpdateDiscount(productIdsInt, 0);

          // Update local state
          const affectedIds = new Set(productIdsInt);
          setProducts(prev => prev.map(p =>
            affectedIds.has(p.id) ? { ...p, discountPercent: 0 } : p
          ));
        }

        const updated = sales.filter(s => s.id !== saleId);
        localStorage.setItem('sales', JSON.stringify(updated));
        setActiveSales(updated.filter(sale => sale.isActive === true));
        addNotification('✅ Đã xóa chương trình sale', 3000);
        localStorage.setItem('saleUpdated', JSON.stringify({ timestamp: Date.now() }));
      } catch (err) {
        console.error('Error deleting sale:', err);
        addNotification('❌ Không thể xóa chương trình sale', 3000);
      }
    }
  };

  const _getProductSaleDiscount = (productId) => {
    const activeSale = activeSales.find(sale => 
      sale.productIds.includes(String(productId))
    );
    return activeSale ? activeSale.discountPercent : 0;
  };

  const normalizeOrder = (order) => {
    const orderId = order.orderCode || order.orderId || order.id || 'UNKNOWN';
    const totalValue = Number(order.total ?? order.totalAmount ?? order.totalPrice ?? 0);
    const subtotalValue = Number(order.subtotal ?? order.subtotalAmount ?? order.total ?? 0);
    const shippingValue = Number(order.shippingFee ?? order.shipping ?? order.shippingCost ?? 0);

    const shippingInfo = order.shippingInfo || {
      fullName: order.fullName || order.customerInfo?.fullName || '',
      email: order.email || order.customerInfo?.email || '',
      phone: order.phone || order.customerInfo?.phone || '',
      address: order.address || order.customerInfo?.address || '',
      city: order.city || order.customerInfo?.city || '',
      district: order.district || order.customerInfo?.district || order.customerInfo?.postalCode || '',
      ward: order.ward || order.customerInfo?.ward || ''
    };

    return {
      id: order.id || null,
      orderId,
      orderCode: order.orderCode || order.orderId || null,
      userId: order.userId || null,
      orderDate: order.createdAt || order.orderDate || order.date || new Date().toISOString(),
      shippingInfo,
      total: totalValue,
      subtotal: subtotalValue,
      shipping: shippingValue,
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || 'cod',
      paymentStatus: order.paymentStatus || 'pending',
      items: Array.isArray(order.items)
        ? order.items.map(item => ({
            id: item.productId || item.id,
            name: item.productName || item.name,
            image: item.productImage || item.image,
            size: item.size,
            color: item.color,
            price: item.price,
            quantity: item.quantity
          }))
        : []
    };
  };

  const getAdminNotificationKey = () => 'notifications_admin';

  const loadAdminNotifications = () => {
    try {
      const saved = localStorage.getItem(getAdminNotificationKey());
      setAdminNotifications(saved ? JSON.parse(saved) : []);
    } catch (err) {
      console.error('Error loading admin notifications:', err);
      setAdminNotifications([]);
    }
  };

  const _addAdminNotification = (message, orderId = null) => {
    const notifications = JSON.parse(localStorage.getItem(getAdminNotificationKey()) || '[]');
    const newNotification = {
      id: `admin_${Date.now()}`,
      message,
      orderId,
      timestamp: new Date().toISOString()
    };
    const updated = [newNotification, ...notifications].slice(0, 20);
    localStorage.setItem(getAdminNotificationKey(), JSON.stringify(updated));
    setAdminNotifications(updated);
  };

  const notifyUser = (order, message) => {
    if (!order?.userId) return;
    const key = `notifications_user_${order.userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const newNotification = {
      id: `user_${Date.now()}`,
      message,
      orderId: order.orderId,
      timestamp: new Date().toISOString()
    };
    existing.unshift(newNotification);
    localStorage.setItem(key, JSON.stringify(existing));
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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const currentOrder = orders.find(order => order.orderId === orderId);
      if (!currentOrder) return;

      let updatedOrder = { ...currentOrder, status: newStatus };
      if (newStatus === 'delivered' && currentOrder.paymentMethod === 'cod') {
        updatedOrder.paymentStatus = 'completed';
      }

      if (currentOrder.id) {
        const response = await ordersApi.updateStatus(currentOrder.id, newStatus);
        updatedOrder = normalizeOrder(response.data);
      }

      const updatedOrders = orders.map(order =>
        order.orderId === orderId ? { ...order, ...updatedOrder } : order
      );

      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      localStorage.setItem('lastOrderSync', Date.now().toString());

      if (selectedOrder?.orderId === orderId) {
        const updated = updatedOrders.find(o => o.orderId === orderId);
        setSelectedOrder(updated);
      }

      if (newStatus === 'confirmed' && updatedOrder.userId) {
        notifyUser(updatedOrder, `Đơn hàng ${updatedOrder.orderId} đã được xác nhận. Cảm ơn bạn đã mua sắm!`);
      }

      addNotification?.('✅ Cập nhật trạng thái đơn hàng thành công', 3000);
    } catch (error) {
      console.error('Error updating order status:', error);
      addNotification?.('❌ Không thể cập nhật trạng thái đơn hàng', 5000);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      const currentOrder = orders.find(order => order.orderId === orderId);
      if (!currentOrder) return;

      let updatedOrder = { ...currentOrder, paymentStatus };
      if (currentOrder.id) {
        const response = await ordersApi.updatePaymentStatus(currentOrder.id, paymentStatus);
        updatedOrder = normalizeOrder(response.data);
      }

      const updatedOrders = orders.map(order =>
        order.orderId === orderId ? { ...order, ...updatedOrder } : order
      );

      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      localStorage.setItem('lastOrderSync', Date.now().toString());

      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(updatedOrder);
      }

      addNotification?.('✅ Cập nhật trạng thái thanh toán thành công', 3000);
    } catch (error) {
      console.error('Error updating payment status:', error);
      addNotification?.('❌ Không thể cập nhật trạng thái thanh toán', 5000);
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

  // Generate alerts list for dashboard
  const alertsList = [];
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  if (lowStockProducts.length > 0) {
    alertsList.push({
      type: 'warning',
      title: 'Sản phẩm sắp hết hàng',
      message: `${lowStockProducts.length} sản phẩm có tồn kho ≤ 5`
    });
  }

  if (outOfStockProducts.length > 0) {
    alertsList.push({
      type: 'danger',
      title: 'Hết hàng',
      message: `${outOfStockProducts.length} sản phẩm đã hết hàng`
    });
  }

  if (activeSales.length === 0) {
    alertsList.push({
      type: 'info',
      title: 'Chưa có khuyến mãi',
      message: 'Tạo chương trình giảm giá để tăng doanh số'
    });
  }

  const normalizedSearchText = userSearchText.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch = !normalizedSearchText ||
      (user.fullName || '').toLowerCase().includes(normalizedSearchText);

    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;

    const userStatus = user.isActive ? 'active' : 'locked';
    const matchesStatus = userStatusFilter === 'all' || userStatus === userStatusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
          <div className="sidebar-section">
            <div className="sidebar-section-title">Tổng quan</div>
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
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Quản lý</div>
            <button
              className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              Sản phẩm
              {products.filter(p => p.stock <= 5).length > 0 && <span className="badge warning">{products.filter(p => p.stock <= 5).length}</span>}
            </button>
            <button
              className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                <path d="M7 7h.01"></path>
              </svg>
              Danh mục
            </button>
            <button
              className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"></path>
                <path d="M15 3v4a2 2 0 0 0 2 2h4"></path>
              </svg>
              Đơn hàng
              {orderStats.pending > 0 && <span className="badge danger">{orderStats.pending}</span>}
            </button>
            <button
              className={`nav-btn ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"></path>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
              Quản lí user
              <span className="badge">{users.length}</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Marketing</div>
            <button
              className={`nav-btn ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26H22L17.18 12.14L19.34 18.2L12 14.46L4.66 18.2L6.82 12.14L2 8.26H8.91L12 2Z"></path>
              </svg>
              Khuyến mãi
              {activeSales.length > 0 && <span className="badge success">{activeSales.length}</span>}
            </button>
          </div>
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
            <h1>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'products' ? 'Products' : activeTab === 'categories' ? 'Categories' : activeTab === 'orders' ? 'Orders' : activeTab === 'permissions' ? 'Quản lí user' : 'Sales Management'}</h1>
            <p className="header-subtitle">{activeTab === 'orders' ? 'Manage customer orders' : activeTab === 'sales' ? 'Create and manage discount campaigns' : activeTab === 'permissions' ? 'Quản lí tài khoản, quyền và trạng thái người dùng' : 'Manage your shoe store inventory'}</p>
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
            {activeTab === 'permissions' && (
              <button className="add-btn" onClick={openAddUserModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <path d="M20 8v6"></path>
                  <path d="M17 11h6"></path>
                </svg>
                Tạo user
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {/* Overview Stats */}
            <div className="dashboard-section">
              <h2 className="section-title">📊 Tổng quan</h2>
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{products.length}</span>
                    <span className="stat-label">Tổng sản phẩm</span>
                    <span className="stat-change">+{products.filter(p => new Date(p.createdAt || 0) > new Date(Date.now() - 30*24*60*60*1000)).length} tháng này</span>
                  </div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{formatPrice(totalValue)}</span>
                    <span className="stat-label">Giá trị kho</span>
                    <span className="stat-change">💰 Tổng giá trị</span>
                  </div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                      <path d="M3 6h18"></path>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{totalStock}</span>
                    <span className="stat-label">Tổng tồn kho</span>
                    <span className="stat-change">{products.filter(p => p.stock <= 5).length} sản phẩm sắp hết</span>
                  </div>
                </div>
                <div className="stat-card info">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{orders.length}</span>
                    <span className="stat-label">Tổng đơn hàng</span>
                    <span className="stat-change">{orders.filter(o => new Date(o.orderDate || o.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length} tuần này</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section">
              <h2 className="section-title">⚡ Hành động nhanh</h2>
              <div className="quick-actions">
                <button className="action-card" onClick={() => setActiveTab('products')}>
                  <div className="action-icon">📦</div>
                  <div className="action-info">
                    <span className="action-title">Thêm sản phẩm</span>
                    <span className="action-desc">Thêm sản phẩm mới vào kho</span>
                  </div>
                </button>
                <button className="action-card" onClick={() => setActiveTab('categories')}>
                  <div className="action-icon">🏷️</div>
                  <div className="action-info">
                    <span className="action-title">Quản lý danh mục</span>
                    <span className="action-desc">Thêm/sửa danh mục sản phẩm</span>
                  </div>
                </button>
                <button className="action-card" onClick={() => setActiveTab('sales')}>
                  <div className="action-icon">🏷️</div>
                  <div className="action-info">
                    <span className="action-title">Tạo khuyến mãi</span>
                    <span className="action-desc">Thiết lập chương trình giảm giá</span>
                  </div>
                </button>
                <button className="action-card" onClick={() => setActiveTab('orders')}>
                  <div className="action-icon">📋</div>
                  <div className="action-info">
                    <span className="action-title">Xem đơn hàng</span>
                    <span className="action-desc">Kiểm tra đơn hàng gần đây</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity & Alerts */}
            <div className="dashboard-row">
              <div className="dashboard-section">
                <h2 className="section-title">🚨 Cảnh báo</h2>
                <div className="alerts-list">
                  {products.filter(p => p.stock <= 5).length > 0 && (
                    <div className="alert-item warning">
                      <span className="alert-icon">⚠️</span>
                      <div className="alert-content">
                        <span className="alert-title">Sản phẩm sắp hết hàng</span>
                        <span className="alert-desc">{products.filter(p => p.stock <= 5).length} sản phẩm có tồn kho ≤ 5</span>
                      </div>
                    </div>
                  )}
                  {products.filter(p => p.stock === 0).length > 0 && (
                    <div className="alert-item danger">
                      <span className="alert-icon">❌</span>
                      <div className="alert-content">
                        <span className="alert-title">Hết hàng</span>
                        <span className="alert-desc">{products.filter(p => p.stock === 0).length} sản phẩm đã hết hàng</span>
                      </div>
                    </div>
                  )}
                  {activeSales.length === 0 && (
                    <div className="alert-item info">
                      <span className="alert-icon">💡</span>
                      <div className="alert-content">
                        <span className="alert-title">Chưa có khuyến mãi</span>
                        <span className="alert-desc">Tạo chương trình giảm giá để tăng doanh số</span>
                      </div>
                    </div>
                  )}
                  {alertsList.length === 0 && (
                    <div className="alert-item success">
                      <span className="alert-icon">✅</span>
                      <div className="alert-content">
                        <span className="alert-title">Tất cả ổn</span>
                        <span className="alert-desc">Không có cảnh báo nào</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-section">
                <h2 className="section-title">📈 Hoạt động gần đây</h2>
                <div className="activity-list">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.orderId} className="activity-item">
                      <span className="activity-icon">🛒</span>
                      <div className="activity-content">
                        <span className="activity-title">Đơn hàng #{order.orderId}</span>
                        <span className="activity-desc">{formatPrice(order.total)} • {formatDate(order.orderDate, false)}</span>
                      </div>
                    </div>
                  ))}
                  {products.slice(0, 3).map(product => (
                    <div key={`product-${product.id}`} className="activity-item">
                      <span className="activity-icon">📦</span>
                      <div className="activity-content">
                        <span className="activity-title">Sản phẩm mới: {product.name}</span>
                        <span className="activity-desc">{product.brand} • {formatPrice(product.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales Performance */}
            <div className="dashboard-section">
              <h2 className="section-title">💰 Hiệu suất bán hàng</h2>
              <div className="performance-grid">
                <div className="performance-card">
                  <h3>Doanh thu tuần này</h3>
                  <div className="performance-value">
                    {formatPrice(orders
                      .filter(o => o.status === 'delivered' && new Date(o.orderDate || o.createdAt) > new Date(Date.now() - 7*24*60*60*1000))
                      .reduce((sum, o) => sum + (o.total || 0), 0)
                    )}
                  </div>
                  <div className="performance-change positive">
                    Đơn đã giao trong tuần
                  </div>
                </div>
                <div className="performance-card">
                  <h3>Đơn hàng trung bình</h3>
                  <div className="performance-value">
                    {(() => {
                      const delivered = orders.filter(o => o.status === 'delivered');
                      return delivered.length > 0 ? formatPrice(delivered.reduce((sum, o) => sum + (o.total || 0), 0) / delivered.length) : formatPrice(0);
                    })()}
                  </div>
                  <div className="performance-change neutral">
                    Trung bình trên đơn
                  </div>
                </div>
                <div className="performance-card">
                  <h3>Sản phẩm bán chạy</h3>
                  <div className="performance-value">
                    {products.length > 0 ? products[0].name : 'N/A'}
                  </div>
                  <div className="performance-change positive">
                    Đang hot
                  </div>
                </div>
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
            {ordersLoadError && (
              <div className="order-error-banner">
                <strong>Chú ý:</strong> {ordersLoadError}
              </div>
            )}

            {adminNotifications.length > 0 && (
              <div className="admin-notifications-banner">
                <button
                  type="button"
                  className="admin-notifications-toggle"
                  onClick={() => setShowAdminNotifications(prev => !prev)}
                >
                  🔔 Thông báo quản trị ({adminNotifications.length})
                </button>
                {showAdminNotifications && (
                  <div className="admin-notifications-list">
                    {adminNotifications.slice(0, 5).map(notification => (
                      <div key={notification.id} className="admin-notification-item">
                        <span>{notification.message}</span>
                        <small>{new Date(notification.timestamp).toLocaleString('vi-VN')}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="order-actions-row">
              <button
                type="button"
                className="btn-refresh-orders"
                onClick={() => window.location.reload()}
              >
                🔄 Làm mới đơn hàng
              </button>
            </div>

            {/* Clear invalid orders button */}
            {orders.some(o => !o.total || isNaN(o.total)) && (
              <div className="clear-invalid-orders">
                <button 
                  onClick={() => {
                    if (window.confirm('Xóa tất cả đơn hàng bị lỗi dữ liệu?')) {
                      const validOrders = orders.filter(o => o.total && !isNaN(o.total));
                      setOrders(validOrders);
                      localStorage.setItem('orders', JSON.stringify(validOrders));
                    }
                  }}
                  className="btn-clear-invalid"
                >
                  🗑️ Xóa đơn hàng lỗi ({orders.filter(o => !o.total || isNaN(o.total)).length})
                </button>
              </div>
            )}

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
                            {formatDate(order.orderDate)}
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
                              type="button"
                              className="view-btn"
                              onClick={() => handleViewOrder(order)}
                            >
                              👁️ Xem
                            </button>
                            {order.status === 'pending' && (
                              <button 
                                type="button"
                                className="confirm-btn"
                                onClick={() => handleUpdateOrderStatus(order.orderId, 'confirmed')}
                              >
                                ✓ Xác nhận
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button 
                                type="button"
                                className="ship-btn"
                                onClick={() => handleUpdateOrderStatus(order.orderId, 'shipping')}
                              >
                                🚚 Giao hàng
                              </button>
                            )}
                            {order.status === 'shipping' && (
                              <button 
                                type="button"
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

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="orders-section">
            <div className="order-actions-row">
              <button
                type="button"
                className="btn-refresh-orders"
                onClick={loadUsers}
              >
                🔄 Làm mới danh sách người dùng
              </button>
            </div>

            <div className="order-actions-row" style={{ gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Tìm theo tên người dùng..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                style={{
                  minWidth: '260px',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  color: '#111',
                  background: '#fff'
                }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{
                  minWidth: '170px',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  color: '#111',
                  background: '#fff'
                }}
              >
                <option value="all">Tất cả role</option>
                <option value="Admin">Admin</option>
                <option value="Customer">Customer</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                style={{
                  minWidth: '190px',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  color: '#111',
                  background: '#fff'
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Mở khóa tài khoản</option>
                <option value="locked">Khóa tài khoản</option>
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="empty-orders">
                <p>Không có người dùng phù hợp bộ lọc</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Điện thoại</th>
                      <th>Trạng thái</th>
                      <th>Vai trò</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'green' : 'red'}`}>
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.role === 'Admin' ? 'blue' : 'green'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-refresh-orders"
                            onClick={() => openEditUserModal(user)}
                            style={{ padding: '6px 10px' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-refresh-orders"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingUserId === user.id}
                            style={{ padding: '6px 10px', background: '#dc3545', color: '#fff' }}
                          >
                            {deletingUserId === user.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="sales-section">
            <div className="sales-header-actions">
              <button className="btn-primary" onClick={() => setShowSaleModal(true)}>
                ➕ Tạo chương trình sale mới
              </button>
            </div>

            {/* Active Sales List */}
            <div className="active-sales-container">
              <h2>🎯 Chương trình sale đang hoạt động</h2>
              {activeSales.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Không có chương trình sale nào</p>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {activeSales.map(sale => (
                    <div key={sale.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0' }}>{sale.name}</h3>
                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                          🏷️ Giảm giá: <strong style={{ color: '#ff6b6b', fontSize: '16px' }}>{sale.discountPercent}%</strong>
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                          📦 Số sản phẩm: <strong>{sale.productIds.length}</strong> sản phẩm
                        </p>
                        <p style={{ margin: '0', color: '#999', fontSize: '12px' }}>
                          📅 Tạo lúc: {new Date(sale.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <button 
                        style={{ padding: '8px 16px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sales Modal */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto', maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Tạo chương trình sale mới</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowSaleModal(false)}
                style={{ position: 'absolute', right: '20px', top: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Sale Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Tên chương trình sale:
                </label>
                <input
                  type="text"
                  value={saleData.saleName}
                  onChange={(e) => setSaleData({ ...saleData, saleName: e.target.value })}
                  placeholder="VD: Summer Sale, Black Friday 2026..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Discount Percent */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Giảm giá (%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={saleData.discountPercent}
                  onChange={(e) => setSaleData({ ...saleData, discountPercent: e.target.value })}
                  placeholder="Nhập từ 1-100"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Products Selection */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: '500' }}>
                    Chọn sản phẩm áp dụng sale ({selectedProducts.size}/{products.length}):
                  </label>
                  <button 
                    onClick={selectAllProducts}
                    style={{ 
                      padding: '6px 12px', 
                      background: selectedProducts.size === products.length ? '#888' : '#333', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {selectedProducts.size === products.length ? '✓ Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  {Array.isArray(products) && products.length > 0 ? (
                    products.map(product => (
                      <div 
                        key={product.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '8px', 
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          background: selectedProducts.has(String(product.id)) ? '#f0f0f0' : 'transparent'
                        }}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(String(product.id))}
                          onChange={() => {}}
                          style={{ marginRight: '10px', cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>{product.name} - {formatPrice(product.price)}</span>
                        <span style={{ color: '#999', fontSize: '12px' }}>Stock: {product.stock}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      Không có sản phẩm nào để chọn
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowSaleModal(false)}
                  style={{ padding: '10px 20px', background: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button 
                  onClick={handleCreateSale}
                  style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Tạo sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <label>Size inventory * (ví dụ: 38:10, 39:8, 40:5)</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="38:10, 39:8, 40:5"
                    className={errors.size ? 'input-error' : ''}
                  />
                  <span className="hint-text">Nhập size và số lượng còn lại cho mỗi size. Tổng stock sẽ tự động tính khi dùng định dạng size:qty.</span>
                  
                  {formData.size.trim() && validateSizeFormat(formData.size).valid && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: '#f0f8ff',
                      borderRadius: '4px',
                      border: '1px solid #4CAF50'
                    }}>
                      <strong>✅ Preview - Sizes sẽ hiển thị như sau:</strong>
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {formData.size.split(',').map((entry, idx) => {
                          const [size, qty] = entry.trim().split(':').map(p => p.trim());
                          return (
                            <span key={idx} style={{
                              padding: '4px 8px',
                              backgroundColor: parseInt(qty) > 0 ? '#4CAF50' : '#f44336',
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '12px'
                            }}>
                              {size} ({qty})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
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

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo user mới</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group full">
                <label>Họ tên *</label>
                <input
                  name="fullName"
                  value={newUserForm.fullName}
                  onChange={handleNewUserChange}
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className="form-group full">
                <label>Email *</label>
                <input
                  name="email"
                  type="email"
                  value={newUserForm.email}
                  onChange={handleNewUserChange}
                  placeholder="Nhập email"
                />
              </div>
              <div className="form-group full">
                <label>Mật khẩu *</label>
                <input
                  name="password"
                  type="password"
                  value={newUserForm.password}
                  onChange={handleNewUserChange}
                  placeholder="Mật khẩu tối thiểu 6 ký tự"
                />
              </div>
              <div className="form-group full">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  value={newUserForm.phone}
                  onChange={handleNewUserChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="form-group full">
                <label>Địa chỉ</label>
                <input
                  name="address"
                  value={newUserForm.address}
                  onChange={handleNewUserChange}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div className="form-group full">
                <label>Vai trò</label>
                <select
                  name="role"
                  value={newUserForm.role}
                  onChange={handleNewUserChange}
                >
                  <option value="Customer">Customer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="form-group full" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  name="isActive"
                  type="checkbox"
                  checked={newUserForm.isActive}
                  onChange={handleNewUserChange}
                  style={{ width: '16px', height: '16px' }}
                />
                <label style={{ margin: 0 }}>Kích hoạt tài khoản ngay</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isCreatingUser}>
                  {isCreatingUser ? 'Đang tạo...' : 'Tạo User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa user</h2>
              <button className="close-btn" onClick={() => setShowEditUserModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="modal-form">
              <div className="form-group full">
                <label>Họ tên</label>
                <input
                  name="fullName"
                  value={editUserForm.fullName}
                  onChange={handleEditUserChange}
                />
              </div>
              <div className="form-group full">
                <label>Email</label>
                <input
                  name="email"
                  value={editUserForm.email}
                  disabled
                />
              </div>
              <div className="form-group full">
                <label>Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  value={editUserForm.password}
                  onChange={handleEditUserChange}
                  placeholder="Xóa và nhập để đổi mật khẩu"
                />
              </div>
              <div className="form-group full">
                <label>Điện thoại</label>
                <input
                  name="phone"
                  value={editUserForm.phone}
                  onChange={handleEditUserChange}
                />
              </div>
              <div className="form-group full">
                <label>Địa chỉ</label>
                <input
                  name="address"
                  value={editUserForm.address}
                  onChange={handleEditUserChange}
                />
              </div>
              <div className="form-group full">
                <label>Role</label>
                <select
                  name="role"
                  value={editUserForm.role}
                  onChange={handleEditUserChange}
                >
                  <option value="Customer">Customer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Trạng thái tài khoản</label>
                <select
                  name="isActive"
                  value={editUserForm.isActive ? 'active' : 'locked'}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                >
                  <option value="active">Mở khóa tài khoản</option>
                  <option value="locked">Khóa tài khoản</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isUpdatingUser}>
                  {isUpdatingUser ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                  <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.orderDate, true)}</p>
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
