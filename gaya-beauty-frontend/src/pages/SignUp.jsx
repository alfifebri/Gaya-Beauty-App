import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8081/register', formData)
      alert(res.data.message)
      navigate('/admin') // Lempar ke login setelah daftar
    } catch (err) {
      alert(err.response?.data || 'Gagal daftar, email mungkin sudah ada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-blue-600 italic mb-2">
            Gaya Beauty
          </h1>
          <p className="text-slate-400 text-sm">
            Buat akun untuk mulai belanja cantik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Nama Lengkap
            </label>
            <input
              required
              type="text"
              className="w-full p-4 mt-1 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Alfi Febriawan"
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Email
            </label>
            <input
              required
              type="email"
              className="w-full p-4 mt-1 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="nama@email.com"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <input
              required
              type="password"
              minLength="6"
              className="w-full p-4 mt-1 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/admin" className="text-blue-600 font-bold hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp
