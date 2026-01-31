import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import ApiTest from './pages/ApiTest';
import './App.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/api-test" element={<ApiTest />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
