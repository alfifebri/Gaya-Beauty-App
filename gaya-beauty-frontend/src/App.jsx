import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

// === LOGIN MEMBER/CUSTOMER ===
import LoginMember from './pages/CustomerLogin'
import RegisterMember from './pages/CustomerRegister'
import MyOrders from './pages/MyOrders'

// === LOGIN ADMIN ===
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'

// === 🔥 INI YANG KITA TAMBAHIN BIAR GAK BLANK ===
import ProductDetail from './pages/ProductDetail' // Buat Halaman Klik Produk
import AddProduct from './pages/AddProduct' // Buat Halaman Tambah Produk
// ================================================

function App() {
  return (
    <Routes>
      {/* === JALUR UMUM === */}
      <Route path="/" element={<Home />} />

      {/* 🔥 RUTE BARU: KLIK PRODUK */}
      <Route path="/product/:id" element={<ProductDetail />} />

      {/* === JALUR CUSTOMER === */}
      <Route path="/login-member" element={<LoginMember />} />
      <Route path="/register-member" element={<RegisterMember />} />
      <Route path="/my-orders" element={<MyOrders />} />

      {/* === JALUR ADMIN === */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />

      {/* 🔥 RUTE BARU: TAMBAH PRODUK (ADMIN) */}
      <Route path="/products/create" element={<AddProduct />} />
    </Routes>
  )
}

export default App
