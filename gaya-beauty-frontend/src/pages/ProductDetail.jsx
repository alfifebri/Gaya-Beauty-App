import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // --- STATE DATA PRODUK ---
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- STATE MODAL & PEMBAYARAN ---
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- 1. AMBIL DATA PRODUK ---
  useEffect(() => {
    setProduct(null)
    setLoading(true)
    axios
      .get('https://changing-carmita-afcodestudio-212bd12d.koyeb.app/products')
      .then((res) => {
        const found = res.data.find((p) => p.id === parseInt(id))
        setProduct(found || null)
      })
      .catch((err) => console.error('Gagal ambil produk:', err))
      .finally(() => setLoading(false))
  }, [id])

  // --- 2. FORMAT RUPIAH ---
  const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number)

  // --- 3. PROSES ORDER KE BACKEND & WA ---
  const handleProcessOrder = async () => {
    if (!paymentMethod) {
      alert('Pilih metode pembayaran dulu, Bro!')
      return
    }
    if (paymentMethod === 'transfer' && !selectedBank) {
      alert('Pilih bank tujuan dulu ya!')
      return
    }

    setIsSubmitting(true)

    const finalPaymentMethod =
      paymentMethod === 'cod'
        ? 'COD (Bayar di Tempat)'
        : `Transfer Bank - ${selectedBank}`

    const dataOrder = {
      customer_name: 'Alfi Febriawan',
      payment_method: finalPaymentMethod,
      total_price: product.price,
      cart_items: [
        {
          product_id: product.id,
          quantity: 1,
          price: product.price,
        },
      ],
    }

    try {
      // 1. Kirim Data ke Database
      const res = await axios.post(
        'https://changing-carmita-afcodestudio-212bd12d.koyeb.app/checkout',
        dataOrder
      )

      // 2. Siapkan Pesan WhatsApp
      const nomorAdmin = '6285741802183' // Pastikan nomor ini benar
      const pesan = `
Halo Admin Gaya Beauty! 👋
Saya mau konfirmasi pesanan baru nih:

 *Produk:* ${product.name}
 *Harga:* ${formatRupiah(product.price)}
 *Nama:* ${dataOrder.customer_name}
 *Bayar via:* ${finalPaymentMethod}
 *ID Order:* ${res.data.order_id || 'Baru'}

Mohon diproses ya min! Terima kasih.
      `.trim()

      // 3. Buka WhatsApp
      const linkWA = `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`
      window.open(linkWA, '_blank')

      // 4. Reset & Navigasi
      alert(`✅ Order Berhasil! Silakan kirim pesan ke WhatsApp Admin.`)
      setShowModal(false)
      navigate('/')
    } catch (err) {
      console.error('Checkout Error:', err.response)
      alert('Gagal memproses order. Cek backend lo!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- HELPER UNTUK GAMBAR (Supaya Gak Crash) ---
  const getImageUrl = (url) => {
    // 1. Kalau kosong, kasih placeholder
    if (!url || url === '') return 'https://placehold.co/400?text=No+Image'

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

  // --- TAMPILAN LOADING / ERROR ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse text-slate-500">
        Sedang mengambil data...
      </div>
    )
  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Produk tidak ditemukan.
      </div>
    )

  // --- TAMPILAN UTAMA ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      {/* Navbar */}
      <nav className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-slate-600 font-bold hover:text-blue-600 flex items-center gap-2"
        >
          ← Kembali
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gambar Produk */}
        <div className="bg-white p-4 rounded-3xl shadow-sm">
          <img
            // Pake Helper di sini biar gak crash
            src={getImageUrl(product.image_url)}
            className="w-full rounded-2xl object-cover aspect-square"
            alt={product.name}
            onError={(e) => {
              e.target.src = 'https://placehold.co/400?text=No+Image'
            }}
          />
        </div>

        {/* Detail Produk */}
        <div className="space-y-6">
          <div>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
              {product.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black mt-2 text-slate-900">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {formatRupiah(product.price)}
            </p>
          </div>

          <div className="prose text-slate-500 text-sm">
            <p>{product.description || 'Tidak ada deskripsi.'}</p>
          </div>

          {/* Tombol Utama */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-500">
                Stok: {product.stock}
              </span>
            </div>

            <button
              onClick={() => {
                if (product.stock > 0) setShowModal(true)
              }}
              disabled={product.stock <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${
                product.stock > 0
                  ? 'bg-slate-900 text-white hover:bg-blue-600'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL PILIH PEMBAYARAN --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-black text-slate-800">
                Pilih Pembayaran
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-red-500 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Metode */}
            <div className="space-y-4 mb-8">
              {/* Opsi 1: COD */}
              <div
                onClick={() => {
                  setPaymentMethod('cod')
                  setSelectedBank('')
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {paymentMethod === 'cod' && (
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    COD (Bayar di Tempat)
                  </p>
                  <p className="text-xs text-slate-500">
                    Bayar tunai saat kurir datang
                  </p>
                </div>
              </div>

              {/* Opsi 2: Transfer Bank */}
              <div
                onClick={() => setPaymentMethod('transfer')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'transfer' && (
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Transfer Bank</p>
                    <p className="text-xs text-slate-500">
                      Verifikasi otomatis
                    </p>
                  </div>
                </div>

                {/* Dropdown Bank */}
                {paymentMethod === 'transfer' && (
                  <div className="mt-4 ml-9 grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                    {['BCA', 'BRI', 'Mandiri', 'BNI'].map((bank) => (
                      <button
                        key={bank}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBank(bank)
                        }}
                        className={`py-2 px-3 rounded-lg text-sm font-bold border ${
                          selectedBank === bank
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                <span>Total Bayar:</span>
                <span className="text-slate-900 text-lg">
                  {formatRupiah(product.price)}
                </span>
              </div>
              <button
                onClick={handleProcessOrder}
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg disabled:bg-slate-300"
              >
                {isSubmitting ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
