import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AddProduct() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Skincare',
    image_url: '',
    description: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Ambil Token Admin (Kalau lo simpen token pas login)
    // Kalau belum ada sistem token, backend lo mungkin nolak (Error 401).
    // Tapi kita coba kirim dulu.

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/products`, {
        name: form.name,
        price: parseInt(form.price),
        stock: parseInt(form.stock),
        category: form.category,
        image_url: form.image_url,
        description: form.description,
      })
      alert('✅ Produk Berhasil Ditambahkan!')
      navigate('/admin') // Balik ke Dashboard
    } catch (error) {
      console.error(error)
      alert('Gagal nambah produk. Pastikan lo udah Login Admin!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Tambah Produk Baru
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nama Produk</label>
            <input
              type="text"
              name="name"
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Harga (Rp)</label>
              <input
                type="number"
                name="price"
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Stok</label>
              <input
                type="number"
                name="stock"
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Kategori</label>
            <select
              name="category"
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="Skincare">Skincare</option>
              <option value="Makeup">Makeup</option>
              <option value="Parfum">Parfum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">URL Gambar</label>
            <input
              type="text"
              name="image_url"
              placeholder="https://..."
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Deskripsi</label>
            <textarea
              name="description"
              onChange={handleChange}
              className="w-full border p-2 rounded h-24"
            ></textarea>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-1/2 bg-gray-300 py-2 rounded font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-pink-600 text-white py-2 rounded font-bold hover:bg-pink-700"
            >
              {loading ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
