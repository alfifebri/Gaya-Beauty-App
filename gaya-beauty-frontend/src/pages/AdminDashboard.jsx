import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AdminDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (!savedToken) {
      alert('Sesi habis, login lagi ya Bos!')
      navigate('/login')
      return
    }
    setToken(savedToken)
    fetchOrders(savedToken)
  }, [])

  const fetchOrders = async (authToken) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      setOrders(res.data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- FUNGSI UPDATE STATUS ---
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!confirm(`Yakin mau ubah status jadi "${newStatus}"?`)) return

    try {
      // UPDATE: Pake POST ke /orders/update dan kirim order_id di body
      await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/update`,
        { order_id: orderId, status: newStatus }, // Body JSON
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Status Berhasil Diupdate!')
      fetchOrders(token) // Refresh tabel
    } catch (err) {
      console.error(err)
      alert('Gagal update status. Cek backend.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)

  // Opsi Status yang tersedia
  const statusOptions = [
    'Pending',
    'Diproses',
    'Dikirim',
    'Selesai',
    'Dibatalkan',
  ]

  // Helper warna status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Diproses':
        return 'bg-blue-100 text-blue-800'
      case 'Dikirim':
        return 'bg-purple-100 text-purple-800'
      case 'Selesai':
        return 'bg-green-100 text-green-800'
      case 'Dibatalkan':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-pink-100 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              Dashboard Admin
            </h1>
            <p className="text-gray-400 text-sm font-bold tracking-wider">
              GAYA BEAUTY CONTROL CENTER
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/products/create')}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-pink-700 transition"
            >
              + Tambah Produk
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-pink-600 border-2 border-pink-100 px-6 py-3 rounded-xl font-bold hover:bg-pink-50 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* TABEL ORDER */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Daftar Pesanan Masuk ({orders.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-pink-50 text-pink-700 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-6">ID</th>
                  <th className="p-6">Customer</th>
                  <th className="p-6">Items (Produk)</th>
                  <th className="p-6">Total</th>
                  <th className="p-6">Status Saat Ini</th>
                  <th className="p-6">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-400 animate-pulse"
                    >
                      Sedang mengambil data...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-12 text-center text-gray-400 italic"
                    >
                      Belum ada pesanan masuk, Bos.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-pink-50/30 transition"
                    >
                      <td className="p-6 font-mono text-sm text-gray-500">
                        #{order.id}
                      </td>
                      <td className="p-6">
                        <p className="font-bold text-gray-800">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.payment_method}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </td>

                      {/* KOLOM ITEMS (MASIH KOSONG KARENA BACKEND PERLU DIUPDATE) */}
                      <td className="p-6 text-sm text-gray-600 max-w-xs">
                        {order.items && order.items.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                <span className="font-bold">
                                  {item.product_name}
                                </span>
                                <span className="text-gray-400">
                                  {' '}
                                  (x{item.quantity})
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-red-400 bg-red-50 px-2 py-1 rounded text-xs">
                            ⚠️ Perlu Update Backend
                          </span>
                        )}
                      </td>

                      <td className="p-6 font-bold text-pink-600">
                        {formatRupiah(order.total_price)}
                      </td>

                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* KOLOM AKSI UBAH STATUS */}
                      <td className="p-6">
                        <select
                          className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 cursor-pointer hover:border-pink-300 transition"
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value)
                          }
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
