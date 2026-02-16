import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import LoginMember from './pages/LoginMember'
import RegisterMember from './pages/RegisterMember'
import MyOrders from './pages/MyOrders' // <--- INI WAJIB ADA!

function App() {
  return (
    <Routes>
      {/* JALUR UMUM */}
      <Route path="/" element={<Home />} />
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
