import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AddProduct() {
  const navigate = useNavigate()

  // --- STATE ---
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('Skincare')
  const [imageUrl, setImageUrl] = useState('') // Link hasil upload
  const [description, setDescription] = useState('')

  // State untuk Loading
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- 1. FUNGSI UPLOAD KE IMGUR (MAGIC NYA DISINI) ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      // Kita "numpang" upload ke Imgur biar dapet Link Gratis
      // Client-ID ini public demo, kalau limit habis bisa bikin akun Imgur sendiri
      const res = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: { Authorization: 'Client-ID 87c679a957242df' },
      })

      // Ambil Link dari Imgur, simpan ke State
      setImageUrl(res.data.data.link)
      alert('Gambar berhasil di-upload! ✨')
    } catch (err) {
      console.error(err)
      alert(
        'Gagal upload gambar. Coba file yang lebih kecil atau format JPG/PNG.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  // --- 2. FUNGSI SIMPAN KE DATABASE KITA ---
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validasi
    if (!name || !price || !stock || !imageUrl) {
      return alert('Semua data (termasuk gambar) wajib diisi ya Bos!')
    }

    setIsSubmitting(true)
    const token = localStorage.getItem('admin_token') // Ambil token admin

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/products`,
        {
          name,
          price: parseInt(price),
          stock: parseInt(stock),
          category,
          image_url: imageUrl, // Kirim Link hasil upload Imgur tadi
          description,
        },
        {
          headers: { Authorization: `Bearer ${token}` }, // Tempel Token Biar Gak 401
        }
      )

      alert('Produk Berhasil Ditambahkan! 🚀')
      navigate('/admin') // Balik ke Dashboard
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        alert('Sesi Admin habis. Silakan Login ulang!')
        navigate('/login')
      } else {
        alert('Gagal simpan produk. Cek koneksi backend.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-xl border border-pink-100">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-4">
          Tambah Produk Baru
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* NAMA PRODUK */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nama Produk
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              placeholder="Contoh: Serum Glowing Abis"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* HARGA */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Harga (Rp)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none"
                placeholder="0"
              />
            </div>
            {/* STOK */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Stok
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* KATEGORI */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none bg-white"
            >
              <option value="Skincare">Skincare</option>
              <option value="Makeup">Makeup</option>
              <option value="Bodycare">Bodycare</option>
              <option value="Haircare">Haircare</option>
            </select>
          </div>

          {/* 🔥 UPLOAD GAMBAR (FITUR BARU) 🔥 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Upload Gambar Produk
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition"
              />
              {isUploading && (
                <span className="text-sm text-pink-500 animate-pulse font-bold">
                  Mengupload... ⏳
                </span>
              )}
            </div>

            {/* Preview Gambar */}
            {imageUrl && (
              <div className="mt-3 p-2 border border-gray-200 rounded-xl inline-block">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-32 rounded-lg object-cover"
                />
                <p className="text-xs text-green-600 mt-1 font-bold">
                  ✅ Gambar Siap!
                </p>
              </div>
            )}
          </div>

          {/* DESKRIPSI */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none"
              placeholder="Jelaskan keunggulan produk ini..."
            />
          </div>

          {/* TOMBOL AKSI */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !imageUrl}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition ${
                isSubmitting || !imageUrl
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 hover:shadow-pink-300'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Produk ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProduct
