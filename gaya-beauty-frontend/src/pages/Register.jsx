import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-sm">
        <h1 className="text-xl font-bold mb-2 text-red-600">Akses Dibatasi</h1>
        <p className="text-gray-600 mb-6">
          Pendaftaran Admin hanya bisa dilakukan oleh Super Admin lewat
          Database.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 font-bold hover:underline"
        >
          Kembali ke Login Admin
        </button>
      </div>
    </div>
  )
}
