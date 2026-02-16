import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/orders`, {
        headers: { Authorization: 'Bearer token_rahasia_nanti' }, // Sementara bypass dulu
      })
      setOrders(res.data || [])
    } catch (error) {
      console.error('Gagal ambil order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/orders/update`, {
        order_id: orderId,
        status: newStatus,
      })
      fetchOrders() // Refresh data
      alert(`Status berhasil diubah jadi ${newStatus}`)
    } catch (error) {
      alert('Gagal update status')
    }
  }

  const handleLogout = () => {
    // Logic logout admin
    navigate('/login') // Asumsi ada login admin
  }

  // FORMAT RUPIAH
  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)

  // FORMAT TANGGAL & JAM (TUNTUTAN LO)
  const formatDate = (dateString) => {
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  // FORMAT RESI/ID MEWAH (TUNTUTAN LO)
  // Contoh: TRX-2026-004
  const generateResi = (id, dateString) => {
    const year = new Date(dateString).getFullYear()
    return `TRX-${year}-${String(id).padStart(3, '0')}`
  }

  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800">
      {/* HEADER MEWAH */}
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            Dashboard Admin
          </h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase">
            Gaya Beauty Control Center
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/products/create')} // Asumsi ada page create
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition"
          >
            + Tambah Produk
          </button>
          <button
            onClick={handleLogout}
            className="border border-pink-200 text-pink-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-50"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100">
          <div className="p-6 border-b border-pink-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700">
              Daftar Pesanan Masuk
            </h2>
            <span className="bg-pink-100 text-pink-600 py-1 px-3 rounded-full text-xs font-bold">
              {orders.length} Pesanan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pink-50 text-pink-700 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">Kode Resi / ID</th>
                  <th className="p-4 font-bold">Waktu Order</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-center">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-pink-50/30 transition">
                    <td className="p-4 font-mono text-sm font-bold text-gray-600">
                      {generateResi(order.id, order.created_at)}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-4 font-bold text-gray-800 capitalize">
                      {order.customer_name || 'Guest'}
                    </td>
                    <td className="p-4 text-pink-600 font-bold">
                      {formatRupiah(order.total_price)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          order.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-600 border-yellow-200'
                            : order.status === 'Dikirim'
                              ? 'bg-blue-100 text-blue-600 border-blue-200'
                              : order.status === 'Selesai'
                                ? 'bg-green-100 text-green-600 border-green-200'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, 'Dikirim')
                          }
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 shadow-sm"
                        >
                          🚚 Kirim Barang
                        </button>
                      )}
                      {order.status === 'Dikirim' && (
                        <span className="text-xs text-gray-400 italic">
                          Menunggu Customer Terima...
                        </span>
                      )}
                      {order.status === 'Selesai' && (
                        <span className="text-xs text-green-600 font-bold">
                          ✅ Transaksi Beres
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="p-10 text-center text-gray-400">
              Loading data...
            </div>
          )}
          {!loading && orders.length === 0 && (
            <div className="p-10 text-center text-gray-400 italic">
              Belum ada pesanan masuk, Bos.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
