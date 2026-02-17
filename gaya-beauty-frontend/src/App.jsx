import { Routes, Route } from 'react-router-dom'

// --- PAGES: PUBLIC ---
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'

// --- PAGES: CUSTOMER ---
import LoginMember from './pages/CustomerLogin'
import RegisterMember from './pages/CustomerRegister'
import MyOrders from './pages/MyOrders'

// --- PAGES: ADMIN ---
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import AddProduct from './pages/AddProduct'

function App() {
  return (
    <Routes>
      {/* === PUBLIC ROUTES === */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />

      {/* === CUSTOMER ROUTES === */}
      <Route path="/login-member" element={<LoginMember />} />
      <Route path="/register-member" element={<RegisterMember />} />
      <Route path="/my-orders" element={<MyOrders />} />

      {/* === ADMIN ROUTES === */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/products/create" element={<AddProduct />} />
    </Routes>
  )
}

export default App
