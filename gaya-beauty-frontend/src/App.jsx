import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

// === BAGIAN INI GUE BENERIN ===
// Kita import dari file "CustomerLogin" tapi kita namain variabelnya "LoginMember"
import LoginMember from './pages/CustomerLogin'
import RegisterMember from './pages/CustomerRegister'
// ==============================

import MyOrders from './pages/MyOrders'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <Routes>
      {/* JALUR UMUM */}
      <Route path="/" element={<Home />} />

      {/* Ini tetep pake LoginMember karena di atas udah kita alias-kan */}
      <Route path="/login-member" element={<LoginMember />} />
      <Route path="/register-member" element={<RegisterMember />} />

      {/* JALUR CUSTOMER (BARU) */}
      <Route path="/my-orders" element={<MyOrders />} />

      {/* JALUR ADMIN */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
