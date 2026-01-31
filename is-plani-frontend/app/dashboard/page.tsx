"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Chatbot from "../Chatbot";
import { useThemeAuth } from "../context/ThemeAuthContext"; // Merkezi tema sistemi

// İKONLAR
const MoonIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);
const SunIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const HomeIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const LockIcon = () => (<svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);

export default function Dashboard() {
  const { user, darkMode, toggleTheme, logout } = useThemeAuth(); //
  const [lang, setLang] = useState("tr");
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
        router.push("/login");
    }
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) setLang(savedLang);
  }, [router]);

  const toggleLang = () => {
    let newLang = lang === "tr" ? "en" : lang === "en" ? "ar" : "tr";
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const dir = lang === "ar" ? "rtl" : "ltr";
  const getFlag = () => { if (lang === "tr") return "🇺🇸"; if (lang === "en") return "🇸🇦"; return "🇹🇷"; };

  const t: any = {
    tr: { 
        home: "Ana Sayfa", hello: "Merhaba", subtitle: "Bugün hangi harika fikri hayata geçirmek istersin?", 
        new_plan_title: "İş Planı Oluştur", new_plan_desc: "Fikrini saniyeler içinde profesyonel rapora dönüştür.", 
        idea_title: "İş Fikri Üretici", idea_desc: "Sektör ve bütçene uygun karlı iş fikirlerini yapay zeka bulsun.",
        swot_title: "SWOT Analizi", swot_desc: "Girişiminin güçlü ve zayıf yönlerini detaylıca analiz et.",
        deck_title: "Yatırımcı Sunumu", deck_desc: "Yatırımcılar için etkileyici sunum taslağı hazırla.",
        coming_soon: "YAKINDA", logout_btn: "Çıkış Yap", start_btn: "Hemen Başla"
    },
    en: { 
        home: "Home", hello: "Hello", subtitle: "Which great idea do you want to bring to life today?", 
        new_plan_title: "Create Business Plan", new_plan_desc: "Turn your idea into a professional report in seconds.", 
        idea_title: "Business Idea Generator", idea_desc: "Let AI find profitable business ideas suitable for your budget.",
        swot_title: "SWOT Analysis", swot_desc: "Analyze your startup's strengths and weaknesses in detail.",
        deck_title: "Pitch Deck Creator", deck_desc: "Create impressive presentation drafts for investors.",
        coming_soon: "COMING SOON", logout_btn: "Logout", start_btn: "Start Now"
    },
    ar: { 
        home: "الرئيسية", hello: "مرحباً", subtitle: "أي فكرة رائعة تريد تحقيقها اليوم؟", 
        new_plan_title: "إنشاء خطة عمل", new_plan_desc: "حول فكرتك إلى تقرير احترافي في ثوانٍ.", 
        idea_title: "مولد أفكار الأعمال", idea_desc: "دع الذكاء الاصطناعي يجد لك أفكار عمل مربحة تناسب ميزانيتك.",
        swot_title: "تحليل SWOT", swot_desc: "حلل نقاط القوة والضعف في مشروعك بالتفصيل.",
        deck_title: "عروض المستثمرين", deck_desc: "قم بإعداد مسودات عرض تقديمية مبهرة للمستثمرين.",
        coming_soon: "قريباً", logout_btn: "تسجيل الخروج", start_btn: "ابدأ الآن"
    }
  };

  return (
    <div dir={dir} className={`min-h-screen p-8 font-sans transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <Chatbot lang={lang} darkMode={darkMode} />

      {/* --- NAVBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
        <Link href="/" className="text-2xl font-black text-blue-600 hover:opacity-80 transition cursor-pointer">
            Start <span className={darkMode ? 'text-white' : 'text-slate-900'}>ERA</span>
        </Link>
        <div className="flex items-center gap-4">
             <Link href="/" className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-full border transition ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-white'}`}>
                <HomeIcon /><span>{t[lang].home}</span>
             </Link>
             <button onClick={toggleLang} className="text-2xl hover:scale-110 transition">{getFlag()}</button>
             
             <button onClick={toggleTheme} className={`p-2 rounded-full transition ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 shadow-sm'}`}>
                {darkMode ? <SunIcon /> : <MoonIcon />}
             </button>

             <button onClick={logout} className="text-sm font-bold text-red-500 hover:text-red-400">
                {t[lang].logout_btn}
             </button>
        </div>
      </div>

      {/* --- İÇERİK --- */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
            {t[lang].hello}, <span className="text-blue-600">{user?.split('@')[0] || "Girişimci"}</span> 👋
        </h1>
        <p className={`mb-10 opacity-70`}>{t[lang].subtitle}</p>
        
        {/* KARTLAR GRİD (Tüm kartlar geri geldi) */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* 1. KART: PLAN OLUŞTURUCU */}
          <Link href="/planner" className={`group relative p-8 rounded-2xl border transition-all hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:shadow-xl hover:border-blue-500'}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 shadow-sm ${darkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>📄</div>
            <h3 className="text-xl font-bold mb-2">{t[lang].new_plan_title}</h3>
            <p className="text-sm mb-6 opacity-60">{t[lang].new_plan_desc}</p>
            <div className={`font-bold text-blue-500 flex items-center gap-2 group-hover:gap-3 transition-all ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                {t[lang].start_btn} →
            </div>
          </Link>

          {/* 2. KART: İŞ FİKRİ ÜRETİCİ */}
          <div className={`relative p-8 rounded-2xl border border-dashed opacity-70 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
            <div className="absolute top-4 right-4 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">{t[lang].coming_soon}</div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 grayscale opacity-40">💡</div>
            <h3 className="text-xl font-bold mb-2">{t[lang].idea_title}</h3>
            <p className="text-sm opacity-50">{t[lang].idea_desc}</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold opacity-60"><LockIcon /> <span>Locked</span></div>
          </div>

          {/* 3. KART: SWOT ANALİZİ */}
          <div className={`relative p-8 rounded-2xl border border-dashed opacity-70 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
            <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">{t[lang].coming_soon}</div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 grayscale opacity-40">📊</div>
            <h3 className="text-xl font-bold mb-2">{t[lang].swot_title}</h3>
            <p className="text-sm opacity-50">{t[lang].swot_desc}</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold opacity-60"><LockIcon /> <span>Locked</span></div>
          </div>

          {/* 4. KART: YATIRIMCI SUNUMU */}
          <div className={`relative p-8 rounded-2xl border border-dashed opacity-70 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">{t[lang].coming_soon}</div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 grayscale opacity-40">🎤</div>
            <h3 className="text-xl font-bold mb-2">{t[lang].deck_title}</h3>
            <p className="text-sm opacity-50">{t[lang].deck_desc}</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold opacity-60"><LockIcon /> <span>Locked</span></div>
          </div>

        </div>
      </div>
    </div>
  );
}