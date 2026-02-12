'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// YEREL TOAST SİSTEMİ (Bildirimler İçin)
// ==========================================
const toastEvents = {
  listeners: [] as ((t: any) => void)[],
  emit(toast: any) { this.listeners.forEach(l => l(toast)); },
  subscribe(l: (t: any) => void) { this.listeners.push(l); return () => { this.listeners = this.listeners.filter(x => x !== l); }; }
};

const toast = (msg: string, type: 'default' | 'success' | 'error' = 'default') => toastEvents.emit({ id: Date.now(), msg, type, icon: type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️' });
toast.success = (msg: string) => toast(msg, 'success');
toast.error = (msg: string) => toast(msg, 'error');

const Toaster = () => {
  const [toasts, setToasts] = useState<any[]>([]);
  useEffect(() => {
    return toastEvents.subscribe((event) => {
      setToasts(prev => [...prev, event]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== event.id)), 3000);
    });
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-right-5 fade-in duration-300">
          <span className="text-lg">{t.icon}</span>
          <span className="text-sm font-bold">{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// ÇEVİRİLER (TR / EN / AR)
// ==========================================
const TRANSLATIONS = {
  tr: {
    app_name: "Start ERA",
    title_login: "Giriş Yap",
    title_register: "Kayıt Ol",
    subtitle_login: "Girişimcilik yolculuğuna devam et.",
    subtitle_register: "Yeni bir başlangıç yap.",
    label_name: "Ad Soyad",
    label_email: "E-Posta Adresi",
    label_password: "Şifre",
    ph_name: "Örn: Ahmet Yılmaz",
    ph_email: "ornek@sirket.com",
    btn_login: "Giriş Yap",
    btn_register: "Hesap Oluştur",
    processing: "İşleniyor...",
    no_account: "Henüz hesabın yok mu?",
    has_account: "Zaten hesabın var mı?",
    link_register: "Kayıt Ol",
    link_login: "Giriş Yap",
    err_invalid: "Geçersiz email veya şifre (min 6 karakter).",
    err_exists: "Bu e-posta adresi zaten kayıtlı.",
    err_login_fail: "Hatalı e-posta veya şifre.",
    success_register: "Hesap başarıyla oluşturuldu!",
    success_login: "Giriş başarılı! Yönlendiriliyorsunuz...",
    toast_switched_login: "Giriş ekranına geçildi",
    toast_switched_register: "Kayıt ekranına geçildi",
    redirecting: "Yönlendiriliyor..."
  },
  en: {
    app_name: "Start ERA",
    title_login: "Sign In",
    title_register: "Sign Up",
    subtitle_login: "Continue your entrepreneurial journey.",
    subtitle_register: "Make a fresh start.",
    label_name: "Full Name",
    label_email: "Email Address",
    label_password: "Password",
    ph_name: "Ex: John Doe",
    ph_email: "example@company.com",
    btn_login: "Sign In",
    btn_register: "Create Account",
    processing: "Processing...",
    no_account: "Don't have an account?",
    has_account: "Already have an account?",
    link_register: "Sign Up",
    link_login: "Sign In",
    err_invalid: "Invalid email or password (min 6 chars).",
    err_exists: "This email is already registered.",
    err_login_fail: "Incorrect email or password.",
    success_register: "Account created successfully!",
    success_login: "Login successful! Redirecting...",
    toast_switched_login: "Switched to Login",
    toast_switched_register: "Switched to Register",
    redirecting: "Redirecting..."
  },
  ar: {
    app_name: "بداية العصر", // Start ERA
    title_login: "تسجيل الدخول",
    title_register: "تسجيل جديد",
    subtitle_login: "أكمل رحلتك في ريادة الأعمال.",
    subtitle_register: "ابدأ بداية جديدة.",
    label_name: "الاسم الكامل",
    label_email: "البريد الإلكتروني",
    label_password: "كلمة المرور",
    ph_name: "مثال: أحمد علي",
    ph_email: "example@company.com",
    btn_login: "تسجيل دخول",
    btn_register: "إنشاء حساب",
    processing: "جاري المعالجة...",
    no_account: "ليس لديك حساب؟",
    has_account: "لديك حساب بالفعل؟",
    link_register: "سجل الآن",
    link_login: "دخول",
    err_invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة (6 أحرف كحد أدنى).",
    err_exists: "هذا البريد الإلكتروني مسجل بالفعل.",
    err_login_fail: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    success_register: "تم إنشاء الحساب بنجاح!",
    success_login: "تم الدخول بنجاح! جاري التوجيه...",
    toast_switched_login: "الانتقال إلى تسجيل الدخول",
    toast_switched_register: "الانتقال إلى التسجيل",
    redirecting: "جاري التوجيه..."
  }
};

// ==========================================
// İKONLAR
// ==========================================
const Icons = {
  Mail: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Eye: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  ArrowRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Sun: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Moon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
};

// ==========================================
// AUTH SAYFASI
// ==========================================
export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<"tr" | "en" | "ar">("tr");
  const [mounted, setMounted] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Çeviri ve Yön
  const t = TRANSLATIONS[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Önizleme Ortamı Kontrolü
  const safeRedirect = (path: string) => {
    if (typeof window !== 'undefined') {
        const isPreview = window.location.hostname.includes('googleusercontent') || 
                          window.location.hostname.includes('scf') || 
                          window.location.protocol === 'blob:';
        
        if (isPreview) {
            console.log(`[Preview] Redirecting to: ${path}`);
            toast(`${t.redirecting} (Demo)`);
        } else {
            window.location.href = path;
        }
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Tema Kontrolü
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Dil Kontrolü
    const savedLang = localStorage.getItem("app_lang") as "tr" | "en" | "ar";
    if (savedLang && ["tr", "en", "ar"].includes(savedLang)) {
        setLang(savedLang);
    }

    // Zaten giriş yapmış mı?
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      safeRedirect("/dashboard");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const toggleLang = () => {
    let newLang: "tr" | "en" | "ar" = lang === "tr" ? "en" : lang === "en" ? "ar" : "tr";
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const getLangLabel = () => (lang === "tr" ? "EN" : lang === "en" ? "AR" : "TR");

  // --- KAYIT OL ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(r => setTimeout(r, 1000));

    if (!email.includes('@') || password.length < 6) {
        toast.error(t.err_invalid);
        setLoading(false);
        return;
    }

    const users = JSON.parse(localStorage.getItem("users_db") || "[]");
    const userExists = users.find((u: any) => u.email === email);

    if (userExists) {
        toast.error(t.err_exists);
        setLoading(false);
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem("users_db", JSON.stringify(users));

    toast.success(t.success_register);
    
    setView('login');
    setPassword('');
    setLoading(false);
  };

  // --- GİRİŞ YAP ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(r => setTimeout(r, 1000));

    const users = JSON.parse(localStorage.getItem("users_db") || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);
    const isDemoUser = email === "demo@startera.com" && password === "123456";

    if (user || isDemoUser) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        if (user && user.name) localStorage.setItem("userName", user.name);
        
        toast.success(t.success_login);
        setTimeout(() => safeRedirect("/dashboard"), 1000);
    } else {
        toast.error(t.err_login_fail);
        setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div dir={dir} className={`min-h-screen flex items-center justify-center transition-colors duration-500 font-sans p-4 relative overflow-hidden ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <Toaster />
      
      {/* Arkaplan Efektleri */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
         <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 animate-pulse ${darkMode ? 'bg-blue-900' : 'bg-blue-300'}`}></div>
         <div className={`absolute top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full blur-[130px] opacity-20 animate-pulse delay-1000 ${darkMode ? 'bg-purple-900' : 'bg-indigo-300'}`}></div>
      </div>

      {/* Sağ Üst Kontroller */}
      <div className={`absolute top-6 ${lang === 'ar' ? 'left-6' : 'right-6'} flex gap-3 z-50`}>
        <button 
          onClick={toggleLang} 
          className="font-black text-lg hover:scale-110 transition active:scale-95 px-3 py-2" 
          title="Change Language"
        >
          {getLangLabel()}
        </button>
        <button 
          onClick={toggleTheme} 
          className={`p-3 rounded-full transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 shadow-lg hover:shadow-xl'}`}
        >
          {darkMode ? <Icons.Sun /> : <Icons.Moon />}
        </button>
      </div>

      <div className={`w-full max-w-md p-8 rounded-[32px] shadow-2xl border transition-all duration-300 backdrop-blur-xl ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-white'}`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white font-black text-2xl shadow-lg mb-6">S</div>
          <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {t.app_name}
          </h1>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {view === 'login' ? t.subtitle_login : t.subtitle_register}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-5">
          
          {/* İsim Alanı (Sadece Kayıt Olurken) */}
          {view === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold mx-1 opacity-70">{t.label_name}</label>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${darkMode ? 'bg-slate-950 border-slate-800 focus-within:ring-offset-slate-900' : 'bg-slate-50 border-slate-200'}`}>
                <span className="opacity-50"><Icons.User /></span>
                <input 
                  type="text" 
                  required 
                  placeholder={t.ph_name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Email Alanı */}
          <div className="space-y-1">
            <label className="text-xs font-bold mx-1 opacity-70">{t.label_email}</label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${darkMode ? 'bg-slate-950 border-slate-800 focus-within:ring-offset-slate-900' : 'bg-slate-50 border-slate-200'}`}>
              <span className="opacity-50"><Icons.Mail /></span>
              <input 
                type="email" 
                required 
                placeholder={t.ph_email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:opacity-50"
              />
            </div>
          </div>

          {/* Şifre Alanı */}
          <div className="space-y-1">
            <label className="text-xs font-bold mx-1 opacity-70">{t.label_password}</label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${darkMode ? 'bg-slate-950 border-slate-800 focus-within:ring-offset-slate-900' : 'bg-slate-50 border-slate-200'}`}>
              <span className="opacity-50"><Icons.Lock /></span>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:opacity-50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="opacity-50 hover:opacity-100 transition-opacity">
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          {/* Aksiyon Butonu */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-1'}`}
          >
            {loading ? (
              <span className="animate-pulse">{t.processing}</span>
            ) : (
              <>
                {view === 'login' ? t.btn_login : t.btn_register} 
                <span className={lang === 'ar' ? 'rotate-180' : ''}><Icons.ArrowRight /></span>
              </>
            )}
          </button>

        </form>

        {/* Alt Footer (Geçiş) */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {view === 'login' ? t.no_account : t.has_account}
            <button 
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                toast(view === 'login' ? t.toast_switched_register : t.toast_switched_login);
              }}
              className="mx-2 font-bold text-blue-600 hover:text-blue-500 underline decoration-2 underline-offset-4 transition-colors"
            >
              {view === 'login' ? t.link_register : t.link_login}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}