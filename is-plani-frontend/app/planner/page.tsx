"use client";

const API_URL = "http://127.0.0.1:8000";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeAuth } from "../context/ThemeAuthContext";
import Link from "next/link";

export default function PlannerPage() {
  const { user, darkMode, logout } = useThemeAuth();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/generate_plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_idea: idea, language: "tr" }),
      });

      if (!res.ok) throw new Error("Hata oluştu.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "StartERA_Plan.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
      <nav className={`p-4 border-b flex justify-between items-center ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
        <Link href="/" className="font-black text-2xl text-blue-600">Start ERA</Link>
        <div className="flex items-center gap-4">
            <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{user.split('@')[0]}</span>
            <button onClick={logout} className="text-sm text-red-500 font-bold">Çıkış</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 pt-20">
        <h1 className="text-4xl font-black mb-4 text-center">İş Planı Oluşturucu 🚀</h1>
        <div className={`p-8 rounded-3xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-xl"}`}>
          <textarea rows={5} className={`w-full p-4 rounded-xl border outline-none ${darkMode ? "bg-slate-900 border-slate-600" : "bg-slate-50 border-slate-200"}`} placeholder="İş fikriniz..." value={idea} onChange={(e) => setIdea(e.target.value)} />
          <button onClick={handleGenerate} disabled={loading} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">
            {loading ? "Analiz Ediliyor..." : "PDF İş Planı Oluştur ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}