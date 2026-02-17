import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // --- STATE MANAGEMENT ---
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // --- CHECKOUT STATE ---
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- INITIAL LOAD ---
  useEffect(() => {
    // 1. Cek Login User
    const storedUser = localStorage.getItem('customer_user')
    if (storedUser) setUser(JSON.parse(storedUser))

    // 2. Fetch Product Data
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`)
        // Cari produk berdasarkan ID (Client-side filtering sementara)
        const found = res.data.find((p) => p.id === parseInt(id))
        setProduct(found || null)
      } catch (err) {
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // --- HELPERS ---
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/400?text=No+Image'
    // Bersihkan URL localhost jika ada sisa dari database lama
    let cleanUrl = url.replace(/http:\/\/localhost:808(0|1)\//, '')
    return cleanUrl.startsWith('http')
      ? cleanUrl
      : `${import.meta.env.VITE_API_URL}/${cleanUrl}`
  }

  // --- HANDLERS ---
  const handleProcessOrder = async () => {
    // Validasi Dasar
    if (!user) {
      alert('Silakan login member terlebih dahulu! 🌸')
      navigate('/login-member')
      return
    }
    if (!paymentMethod) return alert('Mohon pilih metode pembayaran.')
    if (paymentMethod === 'transfer' && !selectedBank)
      return alert('Mohon pilih bank tujuan.')

    setIsSubmitting(true)

    const finalMethod =
      paymentMethod === 'cod'
        ? 'COD (Bayar di Tempat)'
        : `Transfer Bank - ${selectedBank}`

    // Payload sesuai struktur database baru
    const payload = {
      customer_id: user.id,
      customer_name: user.full_name,
      payment_method: finalMethod,
      total_price: product.price,
      cart_items: [
        { product_id: product.id, quantity: 1, price: product.price },
      ],
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/checkout`,
        payload
      )

      // Redirect ke WhatsApp Admin
      const nomorAdmin = '6285741802183'
      const pesan = `Halo Admin Gaya Beauty! 🌸\nSaya mau konfirmasi pesanan:\n\n🛍️ *Produk:* ${product.name}\n💰 *Harga:* ${formatRupiah(product.price)}\n👤 *Nama:* ${user.full_name}\n💳 *Bayar:* ${finalMethod}\n🆔 *Order ID:* ${res.data.order_id || 'Baru'}\n\nMohon diproses ya! ✨`

      window.open(
        `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`,
        '_blank'
      )

      alert('✅ Pesanan Berhasil dibuat!')
      setShowModal(false)
      navigate('/my-orders')
    } catch (err) {
      console.error(err)
      alert('Gagal memproses pesanan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDER: LOADING / NOT FOUND ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">
        Sedang memuat cantik... 🌸
      </div>
    )

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <p>Produk tidak ditemukan :(</p>
        <button
          onClick={() => navigate('/')}
          className="text-pink-500 hover:underline"
        >
          Kembali ke Beranda
        </button>
      </div>
    )

  // --- RENDER: MAIN CONTENT ---
  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800 pb-10">
      {/* NAVBAR */}
      <nav className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-pink-100 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-pink-500 font-bold hover:text-pink-700 flex items-center gap-2 transition"
          >
            ← Kembali Belanja
          </button>
        </div>
      </nav>

      {/* CONTENT CARD */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-pink-100">
          {/* Bagian Gambar */}
          <div className="w-full md:w-1/2 bg-gray-50 relative group">
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name}
              className="w-full h-full object-cover aspect-square md:aspect-auto transition duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400?text=No+Image'
              }}
            />
          </div>

          {/* Bagian Detail */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
            <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold w-fit mb-4 uppercase tracking-wider">
              {product.category}
            </span>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {product.name}
            </h1>

            <p className="text-2xl font-black text-pink-500 mb-6">
              {formatRupiah(product.price)}
            </p>

            <div className="prose prose-pink text-gray-500 mb-8 text-sm leading-relaxed flex-grow">
              {product.description || 'Deskripsi produk belum tersedia.'}
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-400">
                <span>Stok Tersedia</span>
                <span
                  className={
                    product.stock > 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {product.stock} pcs
                </span>
              </div>

              <button
                onClick={() => product.stock > 0 && setShowModal(true)}
                disabled={product.stock <= 0}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition transform hover:scale-[1.02] active:scale-95 ${
                  product.stock > 0
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-pink-300'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {product.stock > 0 ? 'Beli Sekarang ✨' : 'Stok Habis 😭'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHECKOUT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Metode Pembayaran
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 mb-8">
              {/* Option: COD */}
              <div
                onClick={() => {
                  setPaymentMethod('cod')
                  setSelectedBank('')
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-100 hover:border-pink-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-pink-500' : 'border-gray-300'}`}
                >
                  {paymentMethod === 'cod' && (
                    <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">
                    COD (Bayar di Tempat)
                  </p>
                  <p className="text-xs text-gray-500">Bayar tunai ke kurir</p>
                </div>
              </div>

              {/* Option: Transfer */}
              <div
                onClick={() => setPaymentMethod('transfer')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-100 hover:border-pink-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'transfer' ? 'border-pink-500' : 'border-gray-300'}`}
                  >
                    {paymentMethod === 'transfer' && (
                      <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Transfer Bank</p>
                    <p className="text-xs text-gray-500">Verifikasi otomatis</p>
                  </div>
                </div>

                {/* Bank List */}
                {paymentMethod === 'transfer' && (
                  <div className="mt-3 ml-9 grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                    {['BCA', 'BRI', 'Mandiri', 'BNI'].map((bank) => (
                      <button
                        key={bank}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBank(bank)
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                          selectedBank === bank
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-pink-400'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Total & Action */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-4">
                <span>Total Tagihan</span>
                <span className="text-pink-600 text-lg">
                  {formatRupiah(product.price)}
                </span>
              </div>
              <button
                onClick={handleProcessOrder}
                disabled={isSubmitting}
                className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isSubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
