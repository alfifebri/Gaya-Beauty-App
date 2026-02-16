import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CustomerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/customer/login`, {
        email,
        password,
      });

      localStorage.setItem("customer_user", JSON.stringify(response.data.user));
      
      alert("Login Berhasil! Selamat Belanja.");
      navigate("/");
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Email atau Password Salah!");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-pink-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-pink-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-pink-600">Login Member</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              placeholder="nama@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" 
            />
          </div>
          <div>
            <label className="block text-pink-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              placeholder="******" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
            Masuk
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun? <a href="/register-member" className="text-pink-600 font-bold hover:underline">Daftar disini</a>
        </p>
      </div>
    </div>
  );
};

export default CustomerLogin;