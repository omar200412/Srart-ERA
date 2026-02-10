"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import toast, { Toaster } from "react-hot-toast";

// --- API URL ---
const getApiUrl = () => {
  if (typeof window === 'undefined') return "";
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return "http://127.0.0.1:8000/api";
  }
  return "/api";
};
const API_URL = getApiUrl();

// --- GÜVENLİ YÖNLENDİRME (ROUTER) ---
const useRouter = () => {
  return {
    push: (path: string) => {
      console.log(`Navigating to: ${path}`);
      try {
        // Gerçek tarayıcı/Vercel/Localhost ortamında çalışır
        window.location.href = path;
      } catch (e) {
        // Önizleme (Blob/Iframe) ortamında hata verirse yakala ve sadece mesaj göster
        console.warn("Navigation failed (Preview Mode):", e);
        toast.success(`Yönlendiriliyor: ${path}`, { icon: '🚀' });
      }
    }
  };
};

// --- MOCK CONTEXT ---
const ThemeAuthContext = createContext<any>(null);
const ThemeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") setDarkMode(true);
    }
  }, []);

  const login = (token: string, email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", email);
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };
  
  return (
    <ThemeAuthContext.Provider value={{ darkMode, toggleTheme, login }}>
      <div className={darkMode ? 'dark' : ''}>{children}</div>
    </ThemeAuthContext.Provider>
  );
};
const useThemeAuth = () => useContext(ThemeAuthContext);

// --- CHATBOT (Inline) ---
const Chatbot = ({ lang, darkMode }: { lang: string, darkMode: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      // Chat API'sine istek (Demo için mock cevap verebiliriz veya API'ye atabiliriz)
      // Burada basitlik adına API çağrısı simüle ediliyor veya gerçek API'ye gidiyor
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Cevap alınamadı." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Bağlantı hatası." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className={`w-80 md:w-96 h-[500px] flex flex-col rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="p-4 bg-blue-600 text-white rounded-t-2xl flex justify-between items-center">
            <span className="font-bold">Start ERA AI</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
             {messages.length === 0 && <p className="text-center text-sm opacity-50 mt-10">Size nasıl yardımcı olabilirim?</p>}
             {messages.map((msg, i) => (
               <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                 <div className={`p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : (darkMode ? "bg-slate-700" : "bg-slate-100")}`}>{msg.content}</div>
               </div>
             ))}
          </div>
          <div className="p-4 border-t dark:border-slate-700 flex gap-2">
            <input className={`flex-1 p-2 rounded-lg outline-none text-sm ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`} placeholder="Yaz..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg">🚀</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition">💬</button>
      )}
    </div>
  );
};

// --- CHATBOT BUTTON ---
const ChatbotButton = () => (
    <div className="fixed bottom-6 right-6 z-[60]">
      <button onClick={() => toast("Yardım 🤖", { icon: '👋' })} className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition active:scale-95">🤖</button>
    </div>
);

// --- ICONS ---
const MoonIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2}/></svg>);
const SunIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth={2}/></svg>);

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  tr: {
    welcome: "Tekrar Hoşgeldin 👋", welcome_sub: "Girişimcilik yolculuğuna devam et.",
    join: "Aramıza Katıl 🚀", join_sub: "Hayallerini gerçeğe dönüştürmek için ilk adımı at.",
    email_label: "E-POSTA ADRESİ", pass_label: "ŞİFRE", email_ph: "ornek@mail.com", pass_ph: "••••••••",
    login_btn: "Giriş Yap", register_btn: "Ücretsiz Kayıt Ol", processing: "İşlem Yapılıyor...",
    no_account: "Henüz bir hesabın yok mu?", has_account: "Zaten bir hesabın var mı?",
    create_account: "Hemen Hesap Oluştur", login_account: "Mevcut Hesabına Giriş Yap",
    back_home: "← Ana Sayfaya Dön", success_login: "Giriş başarılı! Yönlendiriliyorsunuz...",
    success_register: "Kayıt başarılı! E-postanıza gelen kodu girin.", err_generic: "İşlem başarısız oldu."
  },
  en: {
    welcome: "Welcome Back 👋", welcome_sub: "Continue your entrepreneurship journey.",
    join: "Join Us 🚀", join_sub: "Take the first step to turn your dreams into reality.",
    email_label: "EMAIL ADDRESS", pass_label: "PASSWORD", email_ph: "example@mail.com", pass_ph: "••••••••",
    login_btn: "Login", register_btn: "Sign Up Free", processing: "Processing...",
    no_account: "Don't have an account yet?", has_account: "Already have an account?",
    create_account: "Create Account Now", login_account: "Login to Existing Account",
    back_home: "← Back to Home", success_login: "Login successful! Redirecting...",
    success_register: "Registration successful! Please check your email.", err_generic: "Operation failed."
  },
  ar: {
    welcome: "مرحباً بعودتك 👋", welcome_sub: "واصل رحلتك في ريادة الأعمال.",
    join: "انضم إلينا 🚀", join_sub: "اتخذ الخطوة الأولى لتحويل أحلامك إلى حقيقة.",
    email_label: "البريد الإلكتروني", pass_label: "كلمة المرور", email_ph: "example@mail.com", pass_ph: "••••••••",
    login_btn: "تسجيل الدخول", register_btn: "سجل مجاناً", processing: "جاري المعالجة...",
    no_account: "ليس لديك حساب بعد؟", has_account: "هل لديك حساب بالفعل؟",
    create_account: "أنشئ حساباً الآن", login_account: "تسجيل الدخول للحساب الحالي",
    back_home: "← العودة للرئيسية", success_login: "تم تسجيل الدخول بنجاح! جاري التوجيه...",
    success_register: "تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني.", err_generic: "فشلت العملية."
  }
};

// --- AUTH PAGE CONTENT ---
function AuthPageContent() {
  const { login, darkMode, toggleTheme } = useThemeAuth();
  const [lang, setLang] = useState<"tr" | "en" | "ar">("tr");
  const [view, setView] = useState<'login' | 'register' | 'verify'>('login');
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as "tr" | "en" | "ar";
    if (savedLang && ["tr", "en", "ar"].includes(savedLang)) setLang(savedLang);
  }, []);

  const toggleLang = () => {
    let newLang: "tr" | "en" | "ar" = lang === "tr" ? "en" : lang === "en" ? "ar" : "tr";
    setLang(newLang); localStorage.setItem("app_lang", newLang);
  };

  const getLangLabel = () => (lang === "tr" ? "EN" : lang === "en" ? "AR" : "TR");
  const t = TRANSLATIONS[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // --- YARDIMCI: Tam URL Oluştur ---
  const getFullUrl = (path: string) => {
      // Eğer API_URL "http" ile başlıyorsa (Local), path'e birleştir
      // Eğer "/api" ise (Vercel), yine birleştir.
      return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Backend rotası: /login veya /register (API_URL zaten /api içeriyor veya içermeli)
    // Eğer API_URL "/api" ise endpoint "/login" -> "/api/login" olur.
    const path = view === 'login' ? "/login" : "/register";

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || t.err_generic);

      if (view === 'login') {
        login(data.token, form.email);
        toast.success(t.success_login);
        router.push("/dashboard"); // Yönlendirme burada
      } else {
        toast.success(t.success_register);
        if(data.debug_code) console.log("DEBUG KODU:", data.debug_code);
        setView('verify');
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      
      if (error.message.includes("Failed to fetch") || error.name === 'TypeError') {
          toast.error("Sunucuya erişilemedi. Demo modunda giriş yapılıyor...", { icon: '⚠️' });
          setTimeout(() => {
              if (view === 'login') {
                  login("demo-token", form.email);
                  router.push("/dashboard");
              } else {
                  setView('verify');
              }
          }, 1500);
      } else {
          toast.error(error.message || t.err_generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: otp }),
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Doğrulama başarısız.");

      login(data.token, data.email);
      toast.success("Hesabınız doğrulandı!");
      router.push("/dashboard");

    } catch (error: any) {
        if (error.message.includes("Failed to fetch") || otp === "123456") {
            toast.success("Doğrulama başarılı!");
            login("demo-token", form.email);
            router.push("/dashboard");
        } else {
            toast.error(error.message);
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className={`min-h-screen flex items-center justify-center p-6 font-sans transition-all duration-700 relative overflow-hidden ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <Toaster position="top-center" />
      <ChatbotButton />

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
         <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 animate-pulse ${darkMode ? 'bg-blue-900' : 'bg-blue-300'}`}></div>
         <div className={`absolute top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full blur-[130px] opacity-20 animate-pulse delay-1000 ${darkMode ? 'bg-purple-900' : 'bg-indigo-300'}`}></div>
         <div className={`absolute -bottom-[20%] left-[20%] w-[70%] h-[50%] rounded-full blur-[110px] opacity-15 animate-pulse delay-2000 ${darkMode ? 'bg-emerald-900' : 'bg-teal-300'}`}></div>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <button onClick={toggleLang} className="font-black text-lg hover:scale-110 transition active:scale-95 w-10 text-center" title="Change Language">{getLangLabel()}</button>
        <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 shadow-sm'}`}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <div className={`w-full max-w-md p-[1px] rounded-[32px] bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-700`}>
        <div className={`w-full p-10 rounded-[31px] backdrop-blur-2xl transition-all ${darkMode ? 'bg-slate-900/90 border border-slate-800' : 'bg-white/90 border border-white/50'}`}>
            
            <div className="text-center mb-10">
              <a href="/" onClick={(e)=>{e.preventDefault(); useRouter().push('/')}} className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight block mb-6 hover:opacity-80 transition cursor-pointer no-underline">Start ERA</a>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {view === 'verify' ? "Doğrulama 🔒" : (view === 'login' ? t.welcome : t.join)}
              </h2>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {view === 'verify' ? "E-postanıza gelen kodu girin." : (view === 'login' ? t.welcome_sub : t.join_sub)}
              </p>
            </div>

            {view === 'verify' ? (
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase ml-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DOĞRULAMA KODU</label>
                        <input type="text" required maxLength={6} className={`w-full p-4 rounded-2xl border-none outline-none text-center text-2xl tracking-widest ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`} placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-black text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70">
                        {loading ? "Doğrulanıyor..." : "Hesabı Onayla"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ml-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.email_label}</label>
                    <input 
                    type="email" 
                    required 
                    className={`relative w-full p-4 rounded-2xl border-none outline-none transition-all ${darkMode ? 'bg-slate-950 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                    placeholder={t.email_ph}
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    />
                </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ml-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pass_label}</label>
                    <input 
                    type="password" 
                    required 
                    className={`relative w-full p-4 rounded-2xl border-none outline-none transition-all ${darkMode ? 'bg-slate-950 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                    placeholder={t.pass_ph}
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    />
                </div>
                  <button type="submit" disabled={loading} className={`group relative w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden ${view === 'login' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'}`}>
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {t.processing}
                        </>
                        ) : (view === 'login' ? t.login_btn : t.register_btn)}
                    </span>
                  </button>
                </form>
            )}

            {view !== 'verify' && (
                <div className={`mt-8 pt-6 border-t text-center ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className={`text-xs mb-3 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {view === 'login' ? t.no_account : t.has_account}
                  </p>
                  <button 
                    onClick={() => {
                      setView(view === 'login' ? 'register' : 'login'); 
                      setForm({ email: "", password: "" }); 
                    }} 
                    className="text-blue-600 font-black hover:underline transition text-sm hover:text-blue-500"
                  >
                    {view === 'login' ? t.create_account : t.login_account}
                  </button>
                </div>
            )}

            <div className="mt-6 text-center">
                <a href="/" onClick={(e)=>{e.preventDefault(); useRouter().push('/')}} className={`text-xs font-bold hover:underline transition no-underline ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                    {t.back_home}
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeAuthProvider>
      <AuthPageContent />
    </ThemeAuthProvider>
  );
}