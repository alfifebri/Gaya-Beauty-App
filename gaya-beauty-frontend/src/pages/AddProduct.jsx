import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AddProduct() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('Skincare')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- 1. MAGIC UPLOAD KE IMGUR ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      // Upload ke Imgur (Public Demo ID)
      const res = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: { Authorization: 'Client-ID 87c679a957242df' },
      })
      setImageUrl(res.data.data.link)
      alert('Gambar berhasil di-upload!')
    } catch (err) {
      console.error(err)
      alert('Gagal upload. Coba file JPG/PNG yg lebih kecil.')
    } finally {
      setIsUploading(false)
    }
  }

  // --- 2. SIMPAN PRODUK ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !price || !stock || !imageUrl)
      return alert('Lengkapi data dulu Bos!')

    setIsSubmitting(true)
    const token = localStorage.getItem('admin_token')

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/products`,
        {
          name,
          price: parseInt(price),
          stock: parseInt(stock),
          category,
          image_url: imageUrl,
          description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      alert('Produk Berhasil Ditambahkan! ')
      navigate('/admin')
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        alert('Login dulu bos!')
        navigate('/login')
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
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nama Produk
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:border-pink-500"
              placeholder="Nama Produk Cantik..."
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Harga (Rp)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:border-pink-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Stok
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:border-pink-500"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-white"
            >
              <option value="Skincare">Skincare</option>
              <option value="Makeup">Makeup</option>
              <option value="Bodycare">Bodycare</option>
              <option value="Hairstyle">Hairstyle</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          {/* INPUT UPLOAD GAMBAR */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Upload Gambar
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
              />
              {isUploading && (
                <span className="text-sm text-pink-500 animate-pulse font-bold">
                  Uploading...
                </span>
              )}
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-3 h-32 rounded-lg object-cover border"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:border-pink-500"
              placeholder="Deskripsi..."
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-200 hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !imageUrl}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-lg disabled:bg-gray-400"
            >
              Simpan Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProduct
