import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')

  // STATE SEARCH & FILTER
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')

  const categories = ['Semua', 'Skincare', 'Makeup', 'Parfum', 'Lainnya']

  useEffect(() => {
    fetchProducts()
  }, [])

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

  // --- LOGIKA FILTERING ---
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === 'Semua' || p.category === categoryFilter)
  )

  const addToCart = (product) => {
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
  }

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const totalPrice = cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)

  const handleCheckout = async () => {
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
        'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/checkout',
        {
          customer_name: 'Alfi Febriawan', // Nanti bisa diganti dinamis kalau ada login customer
          payment_method: paymentMethod,
          cart_items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.qty,
            price: item.price,
          })),
          total_price: totalPrice,
        }
      )
      alert(`Berhasil! Pesanan diproses dengan metode ${paymentMethod}`)
      setCart([])
      setShowCart(false)
      fetchProducts()
    } catch (err) {
      alert('Checkout Gagal')
    }
  }

  const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number)

  // --- HELPER BARU (PEMBERSIH LOCALHOST & SUPAYA GAK CRASH) ---
  const getImageUrl = (url) => {
    // 1. Kalau kosong, kasih placeholder
    if (!url || url === '') return 'https://placehold.co/150?text=No+Image'

    // 2. HAPUS 'http://localhost:8081/' atau '8080' kalau kesimpen di database
    // Ini penting banget biar gak kena Mixed Content Error
    let cleanUrl = url
      .replace('http://localhost:8081/', '')
      .replace('http://localhost:8080/', '')

    // 3. Kalau link-nya dari internet beneran (misal google.com), biarin
    if (cleanUrl.startsWith('http')) return cleanUrl

    // 4. Sisanya tempel ke Koyeb
    return `https://changing-carmita-afcodestudio-212bd12d.koyeb.app/${cleanUrl}`
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white border-b px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="font-bold text-2xl text-blue-600 italic shrink-0">
          Gaya Beauty
        </div>

        {/* SEARCH BAR */}
        <div className="flex-1 max-w-xl w-full relative">
          <input
            type="text"
            placeholder="Cari produk kecantikan favoritmu..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowCart(true)}
          className="relative bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition"
        >
          🛒{' '}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">
            {cart.length}
          </span>
        </button>
      </nav>

      {/* TABS KATEGORI */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition shadow-sm ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID PRODUK */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400 italic">
            Produk tidak ditemukan...
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* KLIK GAMBAR UNTUK KE DETAIL */}
              <div
                className="cursor-pointer overflow-hidden aspect-square"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <img
                  // Pake Helper di sini biar gak crash dan gak mixed content
                  src={getImageUrl(p.image_url)}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  alt={p.name}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/150?text=No+Image'
                  }}
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                  {p.category}
                </span>
                <h3 className="font-bold text-slate-800 truncate mb-1">
                  {p.name}
                </h3>
                <p className="text-blue-600 font-black text-lg mb-1">
                  {formatRupiah(p.price)}
                </p>
                <p className="text-[10px] text-slate-400 mb-4 font-medium">
                  Tersedia {p.stock} stok
                </p>

                <button
                  onClick={() => addToCart(p)}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 transition shadow-md disabled:opacity-30 disabled:grayscale"
                  disabled={p.stock <= 0}
                >
                  {p.stock > 0 ? '+ Keranjang' : 'Stok Habis'}
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* SIDEBAR KERANJANG */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full sm:w-[450px] h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                Keranjang Belanja
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-3xl text-slate-300 hover:text-red-500 transition"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic text-sm">
                  Keranjangmu masih kosong nih...
                </div>
              ) : (
                cart.map((item) => {
                  const liveProduct = products.find((p) => p.id === item.id)
                  const isOutOfStock = !liveProduct || liveProduct.stock <= 0

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
                    >
                      <div className={isOutOfStock ? 'opacity-50' : ''}>
                        <p
                          className={`font-bold text-sm ${
                            isOutOfStock
                              ? 'line-through italic text-red-500'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.name} {isOutOfStock && '(Stok Habis)'}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {item.qty} x {formatRupiah(item.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Hapus
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-6 bg-white border-t space-y-6 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              {/* PILIHAN PEMBAYARAN */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Pilih Metode Pembayaran
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-3 text-xs font-bold rounded-xl border-2 transition ${
                      paymentMethod === 'COD'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                        : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    COD (Tunai)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('M-Banking')}
                    className={`py-3 text-xs font-bold rounded-xl border-2 transition ${
                      paymentMethod === 'M-Banking'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                        : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    M-Banking
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  Total Pembayaran
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-slate-200 active:scale-95"
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
