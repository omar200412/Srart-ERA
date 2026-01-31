"use client";

const API_URL = "http://127.0.0.1:8000";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useThemeAuth } from "../context/ThemeAuthContext";

export default function AuthPage() {
  const { login } = useThemeAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? "/login" : "/register";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "İşlem başarısız.");

      if (isLogin) {
        login(data.token, form.email);
        router.push("/");
      } else {
        alert("Kayıt Başarılı! Şimdi giriş yapabilirsiniz.");
        setIsLogin(true);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 transition-all duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            {isLogin ? "Tekrar Hoşgeldin 👋" : "Aramıza Katıl 🚀"}
          </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <input type="email" required className="w-full p-4 rounded-xl border bg-slate-50 outline-none" placeholder="E-posta" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" required className="w-full p-4 rounded-xl border bg-slate-50 outline-none" placeholder="Şifre" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="submit" disabled={loading} className="w-full py-4 text-white font-bold rounded-xl bg-blue-600 hover:bg-blue-700 transition">
            {loading ? "Bekleyin..." : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-black hover:underline transition">
            {isLogin ? "Hesabın yok mu? Hemen Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap"}
          </button>
        </div>
      </div>
    </div>
  );
}