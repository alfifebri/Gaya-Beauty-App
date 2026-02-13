import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import ProductDetail from './pages/ProductDetail'
import SignUp from './pages/SignUp'

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Depan untuk Customer */}
        <Route path="/" element={<Home />} />

        {/* Halaman Markas untuk Admin (Lo) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  )
}

export default App
