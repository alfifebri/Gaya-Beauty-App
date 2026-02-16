import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const CustomerRegister = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/register`,
        formData
      )
      alert('Registrasi Berhasil! Silakan Login.')
      navigate('/login-member')
    } catch (error) {
      console.error(error)
      alert('Gagal Daftar! Email mungkin sudah dipakai.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-pink-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-pink-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-pink-600">
          Daftar Member
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="Contoh: Putri Rosmawati"
              onChange={handleChange}
              required
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="nama@email.com"
              onChange={handleChange}
              required
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="******"
              onChange={handleChange}
              required
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-1">
              No. HP
            </label>
            <input
              type="text"
              name="phone"
              placeholder="0812xxxx"
              onChange={handleChange}
              required
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-1">
              Alamat
            </label>
            <textarea
              name="address"
              placeholder="Jalan Kenangan No. 27"
              onChange={handleChange}
              required
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <a
            href="/login-member"
            className="text-pink-600 font-bold hover:underline"
          >
            Login disini
          </a>
        </p>
      </div>
    </div>
  )
}

export default CustomerRegister
