import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  // --- STATE DATA ---
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)

  // --- STATE UI ---
  const [showCart, setShowCart] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null) // Notifikasi Pop-up

  // --- STATE FILTER ---
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')

  const categories = ['Semua', 'Skincare', 'Makeup', 'Parfum', 'Lainnya']

  // 1. CEK LOGIN & AMBIL PRODUK
  useEffect(() => {
    const storedUser = localStorage.getItem('customer_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    fetchProducts()
  }, [])

  // Efek buat ngilangin notif otomatis setelah 3 detik
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`)
      setProducts(res.data || [])
    } catch (err) {
      console.error('Gagal ambil produk', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. HELPER URL GAMBAR
  const getImageUrl = (url) => {
    if (!url || url === '') return 'https://placehold.co/150?text=No+Image'
    let cleanUrl = url
      .replace('http://localhost:8081/', '')
      .replace('http://localhost:8080/', '')
    if (cleanUrl.startsWith('http')) return cleanUrl
    return `${import.meta.env.VITE_API_URL}/${cleanUrl}`
  }

  // 3. LOGIKA FILTER
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === 'Semua' || p.category === categoryFilter)
  )

  // 4. LOGIKA ADD TO CART (DENGAN NOTIFIKASI ALA TIKTOK)
  const addToCart = (product) => {
    if (!user) {
      alert('Eits, Login dulu dong cantik biar bisa belanja! 😉')
      navigate('/login-member')
      return
    }

    const existing = cart.find((item) => item.id === product.id)
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      )
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }

    // 🔥 Munculin Notif, Gak Langsung Buka Sidebar
    setToast(`✅ ${product.name} berhasil masuk keranjang!`)
  }

  // 🔥 FITUR BARU: TOMBOL TAMBAH & KURANG (+ / -)
  const updateQty = (id, amount) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + amount
          return newQty > 0 ? { ...item, qty: newQty } : item
        }
        return item
      })
    )
  }

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const totalPrice = cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)

  // 5. LOGIKA CHECKOUT
  const handleCheckout = async () => {
    if (!user) {
      alert('Sesi habis, silakan login ulang.')
      navigate('/login-member')
      return
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/checkout`, {
        customer_name: user.full_name,
        customer_id: user.id,
        payment_method: paymentMethod,
        cart_items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.qty,
          price: item.price,
        })),
        total_price: totalPrice,
      })
      alert(`Berhasil! Pesanan Kak ${user.full_name} sedang diproses.`)
      setCart([])
      setShowCart(false)
      fetchProducts()
      navigate('/my-orders')
    } catch (err) {
      console.error(err)
      alert('Checkout Gagal. Periksa alamat API di Vercel lo Bro!')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customer_user')
    setUser(null)
    setCart([])
    window.location.reload()
  }

  const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number)

  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800 relative">
      {/* === NOTIFIKASI TOAST (POP-UP BAWAH) === */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-2xl z-[200] animate-bounce transition-all text-sm font-bold flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* === NAVBAR === */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-20 py-4 gap-4">
            <div
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 italic">
                Gaya Beauty
              </span>
            </div>

            <div className="flex-1 max-w-lg w-full relative">
              <input
                type="text"
                placeholder="Cari skincare favoritmu..."
                className="w-full pl-5 pr-4 py-2 bg-pink-50 border border-pink-100 rounded-full outline-none focus:ring-2 focus:ring-pink-400 transition text-sm text-pink-800 placeholder-pink-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/my-orders')}
                    className="bg-white border border-pink-200 text-pink-500 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-pink-50 transition shadow-sm flex items-center gap-1"
                  >
                    📦 Pesanan Saya
                  </button>
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Halo,
                    </p>
                    <p className="text-pink-600 font-bold text-sm truncate max-w-[100px]">
                      {user.full_name}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-3 py-1 rounded-full"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/login-member')}
                    className="px-4 py-1.5 text-sm text-pink-600 font-bold hover:bg-pink-50 rounded-full transition"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => navigate('/register-member')}
                    className="px-4 py-1.5 text-sm bg-pink-500 text-white font-bold rounded-full shadow-md hover:bg-pink-600 transition"
                  >
                    Daftar
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 bg-pink-100 rounded-full text-pink-600 hover:bg-pink-200 transition"
              >
                🛒
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {cart.reduce((a, c) => a + c.qty, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* === TABS KATEGORI === */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition shadow-sm ${categoryFilter === cat ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-500 border-gray-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* === GRID PRODUK === */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-4xl">🌸</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-pink-50 overflow-hidden group"
              >
                <div
                  className="relative aspect-square overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <img
                    src={getImageUrl(p.image_url)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs">
                      STOK HABIS
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                    {p.category}
                  </span>
                  <h3 className="font-bold text-gray-800 truncate mb-1">
                    {p.name}
                  </h3>
                  <p className="text-yellow-600 font-extrabold text-lg mb-3">
                    {formatRupiah(p.price)}
                  </p>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full bg-white border-2 border-pink-500 text-pink-600 py-2 rounded-xl text-xs font-bold hover:bg-pink-500 hover:text-white transition-all shadow-sm"
                    disabled={p.stock <= 0}
                  >
                    {p.stock > 0 ? '+ Keranjang' : 'Habis'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* === SIDEBAR KERANJANG (+ / -) === */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full sm:w-[400px] h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="p-5 border-b border-pink-100 flex justify-between items-center bg-pink-50">
              <h2 className="text-lg font-bold text-pink-700">
                Keranjang Belanja
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-2xl text-pink-300 hover:text-pink-600 transition"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-400 italic text-sm">
                  Keranjang kosong...
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white p-3 rounded-xl border border-pink-100 shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        {formatRupiah(item.price)}
                      </p>

                      {/* 🔥 TOMBOL TAMBAH KURANG JUMLAH 🔥 */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-gray-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded bg-pink-100 hover:bg-pink-200 text-pink-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 text-xs hover:bg-red-50 px-2 py-1 rounded transition ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white border-t border-pink-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Total Tagihan</span>
                <span className="text-xl font-black text-pink-600">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-pink-200"
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
