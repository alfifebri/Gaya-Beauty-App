import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  FiPlus,
  FiTrash2,
  FiEdit,
  FiLogOut,
  FiPackage,
  FiShoppingBag,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi'

function AdminDashboard() {
  const navigate = useNavigate()

  // --- STATE UMUM ---
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // --- STATE LOGIN ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // --- STATE DATA ---
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(
    'Belum ada file dipilih'
  )

  // Form Data Produk
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Skincare',
    description: '',
    image: null,
  })
  const fileInputRef = useRef(null)

  // 1. CEK LOGIN
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      fetchInitialData()
    }
  }, [])

  // 2. FUNGSI AMBIL DATA
  const fetchInitialData = () => {
    fetchOrders()
    fetchProducts()
  }

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(
        'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/orders',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setOrders(res.data || [])
    } catch (err) {
      console.error('Gagal ambil order', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/products'
      )
      setProducts(res.data || [])
    } catch (err) {
      console.error('Gagal ambil produk', err)
    }
  }

  // 3. HANDLE LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await axios.post(
        'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/login',
        { email, password }
      )
      localStorage.setItem('token', res.data.token)
      setIsLoggedIn(true)
      fetchInitialData()
      alert('Login Berhasil! 🔥')
    } catch (err) {
      alert('Email atau Password salah!')
    } finally {
      setIsLoading(false)
    }
  }

  // 4. HANDLE LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    navigate('/admin')
  }

  // 5. UPDATE STATUS ORDER
  const handleUpdateOrderStatus = async (orderID, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/orders/update',
        { order_id: orderID, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchOrders()
      alert(`Status berubah jadi: ${newStatus}`)
    } catch (err) {
      alert('Gagal update status!')
    }
  }

  // 6. HAPUS PRODUK
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Yakin mau hapus produk ini?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `https://changing-carmita-afcodestudio-212bd12d.koyeb.app/products/delete?id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchProducts()
      alert('Produk berhasil dihapus!')
    } catch (err) {
      alert('Gagal hapus produk!')
    }
  }

  // 7. BUKA MODAL
  const openModal = (product = null) => {
    if (product) {
      setIsEditing(true)
      setEditId(product.id)
      setProductForm({
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        description: product.description,
        image: null,
      })
      setSelectedFileName('Gambar lama tetap dipakai (kecuali diganti)')
    } else {
      setIsEditing(false)
      setEditId(null)
      setProductForm({
        name: '',
        price: '',
        stock: '',
        category: 'Skincare',
        description: '',
        image: null,
      })
      setSelectedFileName('Belum ada file dipilih')
    }
    setShowModal(true)
  }

  // 8. SIMPAN PRODUK
  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append('name', productForm.name)
    formData.append('price', productForm.price)
    formData.append('stock', productForm.stock)
    formData.append('category', productForm.category)
    formData.append('description', productForm.description)
    if (productForm.image) {
      formData.append('image', productForm.image)
    }

    try {
      const token = localStorage.getItem('token')
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }

      if (isEditing) {
        formData.append('id', editId)
        await axios.put(
          'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/products/update',
          formData,
          config
        )
        alert('Produk Berhasil Diupdate! 🎉')
      } else {
        await axios.post(
          'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/products/create',
          formData,
          config
        )
        alert('Produk Baru Berhasil Ditambah! 🚀')
      }

      setShowModal(false)
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan produk. Cek koneksi backend!')
    } finally {
      setIsLoading(false)
    }
  }

  // --- HELPER UNTUK GAMBAR (Supaya Gak Crash) ---
  const getImageUrl = (url) => {
    if (!url || url === '') return 'https://placehold.co/150?text=No+Image'
    if (url.startsWith('http')) return url
    return `https://changing-carmita-afcodestudio-212bd12d.koyeb.app/${url}`
  }

  // --- VIEW: LOGIN FORM ---
  if (!isLoggedIn)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-black text-center text-blue-600 mb-2">
            Gaya Beauty
          </h1>
          <p className="text-center text-slate-500 font-bold mb-8">
            Login Seller
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border font-bold"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border font-bold"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition"
            >
              {isLoading ? 'Loading...' : 'Masuk Dashboard'}
            </button>
          </form>
        </div>
      </div>
    )

  // --- VIEW: DASHBOARD UTAMA ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FiPackage />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">
                Dashboard Admin
              </h1>
              <p className="text-xs text-slate-500">
                Gaya Beauty Control Center
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openModal(null)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
            >
              <FiPlus className="text-lg" /> Tambah Produk
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* TAB NAVIGASI */}
        <div className="flex gap-6 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FiShoppingBag /> Daftar Pesanan
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FiPackage /> Kelola Produk
          </button>
        </div>

        {/* TABEL PESANAN */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Dikirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      Rp {order.total_price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'Lunas'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'Dikirim'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, 'Lunas')
                          }
                          className="bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-600"
                        >
                          ✅ Terima
                        </button>
                      )}
                      {order.status === 'Lunas' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, 'Dikirim')
                          }
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-600"
                        >
                          🚚 Kirim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                Belum ada pesanan.
              </div>
            )}
          </div>
        )}

        {/* TABEL PRODUK */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Foto</th>
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Stok</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-200 border border-slate-300"
                        onError={(e) => {
                          e.target.src =
                            'https://placehold.co/150?text=No+Image' // Pake placeholder.co biar stabil
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">
                      Rp {product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm">{product.stock} pcs</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <FiX className="text-slate-400 hover:text-red-500 text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    className="w-full mt-1 p-3 border rounded-xl text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    className="w-full mt-1 p-3 border rounded-xl text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: e.target.value })
                    }
                    className="w-full mt-1 p-3 border rounded-xl text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Kategori
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full mt-1 p-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option>Skincare</option>
                    <option>Makeup</option>
                    <option>Parfum</option>
                    <option>Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Deskripsi
                </label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full mt-1 p-3 border rounded-xl text-sm font-bold"
                  placeholder="Jelaskan produkmu..."
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  Foto Produk
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setProductForm({
                        ...productForm,
                        image: e.target.files[0],
                      })
                      setSelectedFileName(e.target.files[0].name)
                    }
                  }}
                  className="hidden"
                  accept="image/*"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 border"
                  >
                    <FiUploadCloud className="text-lg" /> Pilih File
                  </button>
                  <span className="text-xs text-slate-400 italic truncate max-w-[200px]">
                    {selectedFileName}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg mt-4"
              >
                {isLoading
                  ? 'Menyimpan...'
                  : isEditing
                    ? 'Simpan Perubahan'
                    : 'Tambah Produk Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
