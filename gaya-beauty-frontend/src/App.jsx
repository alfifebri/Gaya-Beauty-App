import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Import Halaman Lama
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import ProductDetail from './pages/ProductDetail'
import SignUp from './pages/SignUp' // Asumsi ini buat Admin/Umum

// --- IMPORT BARU (SYARAT 2: CUSTOMER) ---
import CustomerRegister from './pages/CustomerRegister'
import CustomerLogin from './pages/CustomerLogin'

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Depan untuk Customer (Katalog Produk) */}
        <Route path="/" element={<Home />} />

        {/* Halaman Detail Produk */}
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Halaman Markas untuk Admin (Lo) */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Halaman Signup Admin/Lama */}
        <Route path="/signup" element={<SignUp />} />

        {/* ========================================= */}
        {/* 🚀 JALUR BARU: KHUSUS MEMBER / PEMBELI 🚀 */}
        {/* ========================================= */}
        <Route path="/register-member" element={<CustomerRegister />} />
        <Route path="/login-member" element={<CustomerLogin />} />
      </Routes>
    </Router>
  )
}

export default App
