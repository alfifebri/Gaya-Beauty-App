import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AdminDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. CEK TOKEN (KUNCI RAHASIA)
    const token = localStorage.getItem('admin_token')

    if (!token) {
      alert('Waduh, belum login nih Bos! Masuk dulu ya.')
      navigate('/login')
      return
    }

    // 2. AMBIL DATA ORDERS
    fetchOrders(token)
  }, [])

  const fetchOrders = async (token) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`, // 🔥 INI YANG BIKIN 401 HILANG
        },
      })
      setOrders(res.data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        alert('Sesi Admin habis. Login ulang yuk!')
        navigate('/login')
      }
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
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
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-pink-700 hover:shadow-pink-300 transition transform hover:-translate-y-1"
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
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              Daftar Pesanan Masuk
            </h2>
            <span className="bg-pink-100 text-pink-600 py-1 px-3 rounded-full text-xs font-bold">
              {orders.length} Pesanan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-pink-50 text-pink-700 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-6">ID Order</th>
                  <th className="p-6">Customer</th>
                  <th className="p-6">Items</th>
                  <th className="p-6">Total</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Waktu</th>
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
                      </td>
                      <td className="p-6 text-sm text-gray-600">
                        {/* Menampilkan isi cart_items/order_items */}
                        {order.items && order.items.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.product_name} (x{item.quantity})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-gray-400">
                            Detail item tidak tersedia
                          </span>
                        )}
                      </td>
                      <td className="p-6 font-bold text-pink-600">
                        {formatRupiah(order.total_price)}
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'Selesai'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-6 text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleString('id-ID')}
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
