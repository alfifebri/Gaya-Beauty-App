import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Nanti kita sambungin ke Backend Admin, sekarang bypass dulu
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Login Admin
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@toko.com"
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••"
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <button className="w-full bg-gray-800 text-white py-2 rounded-lg font-bold hover:bg-gray-900">
            Masuk Dashboard
          </button>
        </form>
      </div>
    </div>
  )
}
