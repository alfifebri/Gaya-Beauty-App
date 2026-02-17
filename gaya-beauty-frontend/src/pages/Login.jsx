import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()

  // State untuk input
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. Minta izin ke Backend
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
        email,
        password,
      })

      // 2. Dapet Token? Simpan sebagai 'admin_token' (Tiket Masuk)
      localStorage.setItem('admin_token', res.data.token)

      // 3. Masuk Dashboard dengan bangga
      alert('Login Berhasil! Selamat bekerja.')
      navigate('/admin')
    } catch (err) {
      console.error(err)
      alert('Gagal Masuk! Cek Email & Password lo lagi ya.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 font-sans p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-pink-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">Admin Login</h2>
          <p className="text-pink-500 font-bold text-sm tracking-wider mt-1">
            GAYA BEAUTY DASHBOARD
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email Admin
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gaya.com"
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-pink-700 hover:shadow-pink-300 transition transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sedang Memproses...' : 'Masuk Dashboard 🚀'}
          </button>
        </form>

        {/* Link ke Register (Opsional) */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="text-pink-600 font-bold hover:underline"
            >
              Daftar Admin Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
