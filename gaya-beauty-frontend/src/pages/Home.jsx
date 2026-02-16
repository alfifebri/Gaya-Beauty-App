import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()
  
  // --- STATE DATA ---
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null) // State buat nyimpen data user login
  
  // --- STATE UI ---
  const [showCart, setShowCart] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [loading, setLoading] = useState(true)

  // --- STATE FILTER ---
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')

  const categories = ['Semua', 'Skincare', 'Makeup', 'Parfum', 'Lainnya']

  // 1. CEK LOGIN & AMBIL PRODUK
  useEffect(() => {
    // Cek apakah user sudah login?
    const storedUser = localStorage.getItem("customer_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Pake Environment Variable biar aman
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`)
      setProducts(res.data || [])
    } catch (err) {
      console.error('Gagal ambil produk', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. HELPER URL GAMBAR (Biar gak crash mixed content)
  const getImageUrl = (url) => {
    if (!url || url === '') return 'https://placehold.co/150?text=No+Image'
    let cleanUrl = url.replace('http://localhost:8081/', '').replace('http://localhost:8080/', '')
    if (cleanUrl.startsWith('http')) return cleanUrl
    return `${import.meta.env.VITE_API_URL}/${cleanUrl}`
  }

  // 3. LOGIKA FILTER
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === 'Semua' || p.category === categoryFilter)
  )

  // 4. LOGIKA ADD TO CART (DENGAN PROTEKSI LOGIN)
  const addToCart = (product) => {
    // CEK: Kalau belum login, tendang ke halaman login
    if (!user) {
      alert("Eits, Login dulu dong cantik biar bisa belanja! 😉")
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
    // Buka sidebar otomatis biar user tau barang masuk
    setShowCart(true) 
  }

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const totalPrice = cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)

  // 5. LOGIKA CHECKOUT
  const handleCheckout = async () => {
    if (!user) {
       alert("Sesi habis, silakan login ulang.")
       navigate('/login-member')
       return
    }

    const anyOutOfStock = cart.some((item) => {
      const p = products.find((prod) => prod.id === item.id)
      return !p || p.stock <= 0
    })

    if (anyOutOfStock) {
      alert('Ada produk yang stoknya habis. Hapus dulu dari keranjang ya!')
      return
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/checkout`,
        {
          customer_name: user.full_name, // PAKE NAMA ASLI USER
          customer_id: user.id, // (Opsional: Nanti backend butuh ID ini)
          payment_method: paymentMethod,
          cart_items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.qty,
            price: item.price,
          })),
          total_price: totalPrice,
        }
      )
      alert(`Berhasil! Pesanan Kak ${user.full_name} sedang diproses.`)
      setCart([])
      setShowCart(false)
      fetchProducts() // Refresh stok
    } catch (err) {
      console.error(err)
      alert('Checkout Gagal. Cek koneksi internet.')
    }
  }

  // 6. LOGIKA LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("customer_user")
    setUser(null)
    setCart([]) // Kosongkan keranjang pas logout
    window.location.reload()
  }

  const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number)

  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800">
      {/* === NAVBAR LUXURY === */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-20 py-4 gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 italic">
                Gaya Beauty
              </span>
            </div>

            {/* Search Bar (Modern) */}
            <div className="flex-1 max-w-lg w-full relative">
               <input
                type="text"
                placeholder="Cari skincare favoritmu..."
                className="w-full pl-5 pr-4 py-2 bg-pink-50 border border-pink-100 rounded-full outline-none focus:ring-2 focus:ring-pink-400 transition text-sm text-pink-800 placeholder-pink-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* User & Cart Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                // Tampilan SUDAH LOGIN
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Halo,</p>
                    <p className="text-pink-600 font-bold text-sm truncate max-w-[100px]">{user.full_name}</p>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-3 py-1 rounded-full">
                    Keluar
                  </button>
                </div>
              ) : (
                // Tampilan BELUM LOGIN
                <div className="flex gap-2">
                   <button onClick={() => navigate('/login-member')} className="px-4 py-1.5 text-sm text-pink-600 font-bold hover:bg-pink-50 rounded-full transition">
                    Masuk
                  </button>
                  <button onClick={() => navigate('/register-member')} className="px-4 py-1.5 text-sm bg-pink-500 text-white font-bold rounded-full shadow-md hover:bg-pink-600 transition">
                    Daftar
                  </button>
                </div>
              )}

              {/* Tombol Keranjang */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 bg-pink-100 rounded-full text-pink-600 hover:bg-pink-200 transition"
              >
                🛒
                {cart.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {cart.length}
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
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition shadow-sm ${
              categoryFilter === cat
                ? 'bg-pink-500 text-white border-pink-500 shadow-pink-200'
                : 'bg-white text-gray-500 border-gray-100 hover:border-pink-300 hover:text-pink-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* === HERO BANNER (Opsional) === */}
      {categoryFilter === 'Semua' && !search && (
          <div className="max-w-7xl mx-auto px-4 mb-8">
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl p-8 text-white text-center shadow-lg">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">Diskon Spesial Member Baru!</h1>
                <p className="text-pink-100">Daftar sekarang dan dapatkan promo menarik.</p>
            </div>
          </div>
      )}

      {/* === GRID PRODUK === */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
           <div className="flex justify-center py-20"><div className="animate-spin text-4xl">🌸</div></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic">
            Produk tidak ditemukan...
          </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-pink-50 group">
                        {/* Gambar */}
                        <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                            <img
                                src={getImageUrl(p.image_url)}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                onError={(e) => { e.target.src = 'https://placehold.co/150?text=No+Image' }}
                            />
                            {p.stock <= 0 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">STOK HABIS</div>
                            )}
                        </div>

                        {/* Info Produk */}
                        <div className="p-4">
                            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">{p.category}</span>
                            <h3 className="font-bold text-gray-800 truncate mb-1">{p.name}</h3>
                            <p className="text-yellow-600 font-extrabold text-lg mb-3">
                                {formatRupiah(p.price)}
                            </p>

                            <button
                                onClick={() => addToCart(p)}
                                className="w-full bg-white border-2 border-pink-500 text-pink-600 py-2 rounded-xl text-xs font-bold hover:bg-pink-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400"
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

      {/* === SIDEBAR KERANJANG (PINK EDITION) === */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full sm:w-[400px] h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            {/* Header Sidebar */}
            <div className="p-5 border-b border-pink-100 flex justify-between items-center bg-pink-50">
              <h2 className="text-lg font-bold text-pink-700">Keranjang Belanja</h2>
              <button onClick={() => setShowCart(false)} className="text-2xl text-pink-300 hover:text-pink-600 transition">&times;</button>
            </div>

            {/* List Barang */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-400 italic text-sm">Masih kosong nih...</div>
              ) : (
                cart.map((item) => {
                    const liveProduct = products.find((p) => p.id === item.id)
                    const isOutOfStock = !liveProduct || liveProduct.stock <= 0
                    return (
                        <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-pink-100 shadow-sm">
                        <div className={isOutOfStock ? 'opacity-50' : ''}>
                            <p className={`font-bold text-sm ${isOutOfStock ? 'line-through text-red-500' : 'text-gray-800'}`}>
                                {item.name}
                            </p>
                            <p className="text-xs text-pink-500 font-medium">{item.qty} x {formatRupiah(item.price)}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-xs hover:bg-red-50 px-2 py-1 rounded transition">Hapus</button>
                        </div>
                    )
                })
              )}
            </div>

            {/* Footer Checkout */}
            <div className="p-6 bg-white border-t border-pink-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
               <div className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Metode Pembayaran</p>
                  <div className="flex gap-2">
                     {['COD', 'M-Banking'].map(method => (
                         <button 
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                                paymentMethod === method 
                                ? 'bg-pink-600 text-white border-pink-600' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300'
                            }`}
                         >
                            {method}
                         </button>
                     ))}
                  </div>
               </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-xl font-black text-pink-600">{formatRupiah(totalPrice)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 transition shadow-lg shadow-pink-200"
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