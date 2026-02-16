import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const MyOrders = () => {
  const [orders, setOrders] = useState([])
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Cek Login
    const storedUser = localStorage.getItem('customer_user')
    if (!storedUser) {
      alert('Login dulu ya!')
      navigate('/login-member')
      return
    }
    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)
    fetchMyOrders(parsedUser.id)
  }, [])

  const fetchMyOrders = async (userId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/my-orders?user_id=${userId}`
      )
      setOrders(res.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleReceiveOrder = async (orderId) => {
    const confirm = window.confirm('Yakin barang sudah sampai dan sesuai?')
    if (!confirm) return

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/complete-order`, {
        order_id: orderId,
      })
      alert('Terima kasih! Transaksi selesai.')
      fetchMyOrders(user.id) // Refresh
    } catch (error) {
      alert('Gagal konfirmasi.')
    }
  }

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="min-h-screen bg-pink-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
        <div className="p-6 border-b border-pink-100 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pink-600">📦 Pesanan Saya</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-pink-500"
          >
            Kembali Belanja
          </button>
        </div>

        <div className="p-6 space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-gray-400 py-10">
              Kamu belum pernah belanja nih...
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400">
                      TRX-{new Date(order.created_at).getFullYear()}-
                      {String(order.id).padStart(3, '0')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-600'
                        : order.status === 'Dikirim'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-dashed pt-4">
                  <p className="font-bold text-lg text-gray-800">
                    {formatRupiah(order.total_price)}
                  </p>

                  {order.status === 'Dikirim' && (
                    <button
                      onClick={() => handleReceiveOrder(order.id)}
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 transition shadow-lg shadow-pink-200"
                    >
                      Pesanan Diterima
                    </button>
                  )}
                  {order.status === 'Pending' && (
                    <span className="text-xs text-gray-400 italic">
                      Menunggu dikirim penjual...
                    </span>
                  )}
                  {order.status === 'Selesai' && (
                    <span className="text-xs text-green-500 font-bold">
                      ⭐ Selesai
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MyOrders
