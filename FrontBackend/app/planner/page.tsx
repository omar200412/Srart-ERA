"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import toast, { Toaster } from "react-hot-toast";

// --- API URL (Güvenli) ---
const API_URL = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL
  : "http://127.0.0.1:8000";

// --- MOCK ROUTER ---
const useRouter = () => {
  return {
    push: (path: string) => {
      console.log(`Navigating to: ${path}`);
      if (typeof window !== 'undefined') {
         if (path.startsWith('http')) {
             window.location.href = path; 
         } else {
             if (path === "/login") {
                 console.warn("Demo: Giriş sayfasına yönlendirme simüle edildi.");
             }
         }
      }
    }
  };
};

// --- MOCK LINK ---
const Link = ({ href, children, className, ...props }: any) => {
  return (
    <a 
      href={href} 
      className={className} 
      onClick={(e) => {
        e.preventDefault();
        console.log("Link clicked:", href);
        if (href === "/dashboard") {
             toast("Dashboard'a dönülüyor...", { icon: '🏠' });
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
};

// --- MOCK CONTEXT ---
const ThemeAuthContext = createContext<any>(null);
const ThemeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);
  const user = "girisimci@startera.com"; 
  
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const theme = localStorage.getItem("theme");
          if (theme === "dark") setDarkMode(true);
      }
  }, []);

  const toggleTheme = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  return (
    <ThemeAuthContext.Provider value={{ user, darkMode, toggleTheme }}>
      <div className={darkMode ? 'dark' : ''}>{children}</div>
    </ThemeAuthContext.Provider>
  );
};
const useThemeAuth = () => useContext(ThemeAuthContext);

// --- CHATBOT BİLEŞENİ (Inline) ---
const Chatbot = ({ lang, darkMode }: { lang: string, darkMode: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });
      if (!res.ok) throw new Error("API Hatası");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Şu an demo modundayız. Yapay zeka bağlantısı kurulamadığında bu mesajı görüyorsunuz." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className={`w-80 md:w-96 h-[500px] flex flex-col rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="p-4 bg-blue-600 text-white rounded-t-2xl flex justify-between items-center">
            <span className="font-bold">Start ERA AI 🚀</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 && <p className="text-center text-sm opacity-50 mt-10">Nasıl yardımcı olabilirim?</p>}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : (darkMode ? "bg-slate-700" : "bg-slate-100")}`}>{msg.content}</div>
              </div>
            ))}
            {isTyping && <div className="text-xs animate-pulse">...</div>}
          </div>
          <div className="p-4 border-t dark:border-slate-700 flex gap-2">
            <input className={`flex-1 p-2 rounded-lg outline-none text-sm ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`} placeholder="Mesaj yaz..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg">🚀</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition">💬</button>
      )}
    </div>
  );
};

// --- CHATBOT BUTTON (Alternative) ---
const ChatbotButton = () => (
    <div className="fixed bottom-6 right-6 z-[60]">
      <button onClick={() => toast("Yardım asistanı 🤖", { icon: '👋' })} className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition active:scale-95">🤖</button>
    </div>
);

// --- DİĞER BİLEŞENLER ---
const TypewriterEffect = ({ text, speed = 5 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayedText((prev) => prev + text.charAt(i)); i++; } 
      else clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <div className="whitespace-pre-wrap leading-relaxed">{displayedText}</div>;
};

const LoadingOverlay = ({ messages }: { messages: string[] }) => {
  const [message, setMessage] = useState(messages[0]);
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => { setMessage(messages[i % messages.length]); i++; }, 2000);
    return () => clearInterval(interval);
  }, [messages]);
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-3xl transition-all duration-500">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🚀</div>
      </div>
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">Start ERA AI</h3>
      <p className="mt-2 text-sm text-slate-500 font-medium animate-fade-in">{message}</p>
    </div>
  );
};

// --- ICONS ---
const MoonIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2}/></svg>);
const SunIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth={2}/></svg>);
const SparkleIcon = () => (<svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214z" /></svg>);

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  tr: {
    nav_back: "Vazgeç", step_progress: "İlerleme Durumu", step: "Adım", back: "Geri", next: "Devam Et",
    start_magic: "Sihri Başlat", generating: "Plan Yazılıyor...", success_title: "İş Planın Hazır!",
    success_desc: (idea: string) => `Yapay zeka, "${idea}" fikrin için stratejiyi oluşturdu.`,
    download_pdf: "PDF Olarak İndir", new_plan: "Yeni Plan Oluştur",
    toast_success: "İş planınız başarıyla oluşturuldu!", toast_error: "Bir hata oluştu",
    toast_pdf_preparing: "PDF hazırlanıyor...", toast_pdf_success: "PDF İndirildi!", toast_pdf_error: "PDF oluşturulamadı.",
    err_empty: "Bu alan boş bırakılamaz.", err_capital: "Lütfen geçerli bir tutar girin.", err_short: "Yapay zekanın iyi çalışması için biraz daha detay verin.",
    loading_messages: ["Pazar verileri taranıyor...", "Rakip analizi yapılıyor...", "Finansal projeksiyonlar hesaplanıyor...", "SWOT tablosu oluşturuluyor...", "Yatırımcı sunumu için strateji belirleniyor...", "Son dokunuşlar yapılıyor ✨"],
    questions: [
      { id: 1, key: "idea", title: "Hayalindeki Girişim Nedir?", subtitle: "Bize fikrinden bahset, gerisini yapay zekaya bırak.", ph: "Örn: Kadıköy'de sadece plak çalan ve 3. dalga kahve satan retro bir mekan..." },
      { id: 2, key: "capital", title: "Mevcut Gücün (Sermaye)", subtitle: "Başlangıç için ne kadar kaynağa sahibiz?", ph: "Örn: 500.000 TL nakit ve 2 yatırımcı ortağım var..." },
      { id: 3, key: "skills", title: "Süper Güçlerin", subtitle: "Ekibin hangi konularda uzman?", ph: "Örn: 10 yıllık barista tecrübesi, dijital pazarlama uzmanlığı..." },
      { id: 4, key: "strategy", title: "Gelecek Vizyonun", subtitle: "1 yıl sonra kendini nerede görüyorsun?", ph: "Örn: 3 şubeye ulaşmak ve kendi kahve markamı marketlerde satmak..." },
      { id: 5, key: "management", title: "Yönetim Kadrosu", subtitle: "Gemiyi kimler yönetiyor?", ph: "Örn: Ben operasyonu, ortağım finansı yönetecek..." }
    ]
  },
  en: {
    nav_back: "Cancel", step_progress: "Progress", step: "Step", back: "Back", next: "Continue",
    start_magic: "Start Magic", generating: "Writing Plan...", success_title: "Business Plan Ready!",
    success_desc: (idea: string) => `AI has created a strategy for your "${idea}" idea.`,
    download_pdf: "Download PDF", new_plan: "Create New Plan",
    toast_success: "Business plan created successfully!", toast_error: "An error occurred",
    toast_pdf_preparing: "Preparing PDF...", toast_pdf_success: "PDF Downloaded!", toast_pdf_error: "Could not generate PDF.",
    err_empty: "This field cannot be empty.", err_capital: "Please enter a valid amount.", err_short: "Please provide a bit more detail.",
    loading_messages: ["Scanning market data...", "Analyzing competitors...", "Calculating financial projections...", "Creating SWOT table...", "Strategizing for investor pitch...", "Adding final touches ✨"],
    questions: [
      { id: 1, key: "idea", title: "What is your Startup Idea?", subtitle: "Tell us about your idea, leave the rest to AI.", ph: "Ex: A retro place..." },
      { id: 2, key: "capital", title: "Current Power (Capital)", subtitle: "How much resources do we have?", ph: "Ex: 500,000 TL cash..." },
      { id: 3, key: "skills", title: "Superpowers", subtitle: "What is your team expert in?", ph: "Ex: Marketing, Coding..." },
      { id: 4, key: "strategy", title: "Future Vision", subtitle: "Where do you see yourself in 1 year?", ph: "Ex: 3 branches..." },
      { id: 5, key: "management", title: "Management Crew", subtitle: "Who is steering the ship?", ph: "Ex: Me and my partner..." }
    ]
  },
  ar: {
    nav_back: "إلغاء", step_progress: "التقدم", step: "خطوة", back: "عودة", next: "استمرار",
    start_magic: "ابدأ السحر", generating: "جاري كتابة الخطة...", success_title: "خطة العمل جاهزة!",
    success_desc: (idea: string) => `قام الذكاء الاصطناعي بإنشاء استراتيجية لفكرتك "${idea}".`,
    download_pdf: "تحميل PDF", new_plan: "إنشاء خطة جديدة",
    toast_success: "تم إنشاء خطة العمل بنجاح!", toast_error: "حدث خطأ",
    toast_pdf_preparing: "جاري تحضير PDF...", toast_pdf_success: "تم تحميل PDF!", toast_pdf_error: "تعذر إنشاء PDF.",
    err_empty: "لا يمكن ترك هذا الحقل فارغًا.", err_capital: "يرجى إدخال مبلغ صالح.", err_short: "يرجى تقديم مزيد من التفاصيل.",
    loading_messages: ["جاري مسح بيانات السوق...", "تحليل المنافسين...", "حساب التوقعات المالية...", "إنشاء جدول SWOT...", "وضع استراتيجية لعرض المستثمرين...", "إضافة اللمسات الأخيرة ✨"],
    questions: [
      { id: 1, key: "idea", title: "فكرة المشروع", subtitle: "أخبرنا عن فكرتك", ph: "مثال: مقهى ريترو..." },
      { id: 2, key: "capital", title: "رأس المال", subtitle: "كم لديك من الموارد؟", ph: "مثال: 500,000 ليرة..." },
      { id: 3, key: "skills", title: "المهارات", subtitle: "بماذا يتميز فريقك؟", ph: "مثال: تسويق، برمجة..." },
      { id: 4, key: "strategy", title: "الرؤية", subtitle: "أين ترى نفسك بعد عام؟", ph: "مثال: 3 فروع..." },
      { id: 5, key: "management", title: "الإدارة", subtitle: "من يدير المشروع؟", ph: "مثال: أنا وشريكي..." }
    ]
  }
};

function PlannerContent() {
  const { user, darkMode, toggleTheme } = useThemeAuth();
  const [lang, setLang] = useState<"tr" | "en" | "ar">("tr");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [formData, setFormData] = useState({ idea: "", capital: "", skills: "", strategy: "", management: "", language: "tr" });
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        }
        const savedLang = localStorage.getItem("app_lang") as "tr" | "en" | "ar";
        if (savedLang && ["tr", "en", "ar"].includes(savedLang)) { setLang(savedLang); setFormData(prev => ({ ...prev, language: savedLang })); }
    }
  }, []);

  const toggleLang = () => {
    let newLang: "tr" | "en" | "ar" = lang === "tr" ? "en" : lang === "en" ? "ar" : "tr";
    setLang(newLang); setFormData(prev => ({ ...prev, language: newLang })); localStorage.setItem("app_lang", newLang);
  };

  const getLangLabel = () => (lang === "tr" ? "EN" : lang === "en" ? "AR" : "TR");
  const t = TRANSLATIONS[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const validateInput = (key: string, value: string) => {
    const val = value.trim();
    if (!val) return t.err_empty;
    if (key === "capital" && val.length < 2) return t.err_capital;
    if (key !== "capital" && val.length < 5) return t.err_short;
    return null;
  };

  const handleNext = () => {
    const currentKey = t.questions[step - 1].key as keyof typeof formData;
    const err = validateInput(currentKey, formData[currentKey]);
    if (err) { toast.error(err); return; }
    if (step < 5) setStep(step + 1); else generatePlan();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/generate_plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      
      // Hata kontrolü
      if (!res.ok) {
          throw new Error("API Connection Error");
      }
      
      const data = await res.json();
      setPlanResult(data.plan);
      toast.success(t.toast_success);
    } catch {
      // HATA DURUMUNDA GÖSTERİLECEK DETAYLI DEMO PLAN
      // Bu kısım backend çalışmasa bile kullanıcının sistemin gücünü görmesini sağlar.
      toast.success("Demo Modu: Örnek plan oluşturuldu.", { icon: '✨' });
      
      const fallbackPlan = `
1. YÖNETİCİ ÖZETİ
Girişiminiz "${formData.idea}", pazardaki mevcut boşlukları doldurmayı ve hedef kitleye benzersiz bir değer sunmayı amaçlamaktadır. Yönetim ekibinin "${formData.management}" konusundaki deneyimi ve "${formData.skills}" gibi kritik yetenekleri, projenin başarısı için güçlü bir temel oluşturmaktadır. Mevcut "${formData.capital}" sermaye ile yola çıkılarak, ilk aşamada sürdürülebilir bir büyüme yakalanması hedeflenmektedir.

2. İŞ MODELİ VE ÜRÜN
İş modeliniz, müşteri odaklı bir yaklaşımla kurgulanmıştır. Temel ürün/hizmet, rakiplerinden kalite ve kullanıcı deneyimi ile ayrışmaktadır. Gelir modeli, hem tek seferlik satışlar hem de potansiyel olarak tekrarlayan gelir (abonelik vb.) modellerini içerecek şekilde çeşitlendirilmelidir. "${formData.skills}" yeteneğiniz, ürünün geliştirilmesinde ve pazara sunulmasında kilit rol oynayacaktır.

3. PAZAR ANALİZİ VE HEDEF KİTLE
Hedef pazarınız, yenilikçi çözümlere açık ve kalite arayan bilinçli tüketicilerden oluşmaktadır. Pazarın büyüklüğü ve büyüme potansiyeli, girişimin ölçeklenebilir olduğunu göstermektedir. Rakip analizi, sizin esnek yapınızın ve müşteri odaklılığınızın büyük oyunculara karşı avantaj sağlayacağını ortaya koymaktadır.

4. PAZARLAMA VE SATIŞ STRATEJİSİ
Pazarlama stratejiniz, dijital kanalları (sosyal medya, içerik pazarlaması, SEO) ve organik büyümeyi (referanslar) merkeze almalıdır. Başlangıç bütçesi ("${formData.capital}") verimli kullanılarak, doğrudan hedef kitleye yönelik nokta atışı kampanyalar düzenlenmelidir. Müşteri sadakati oluşturmak, yeni müşteri kazanmaktan daha öncelikli olmalıdır.

5. FİNANSAL PLAN VE YATIRIM
Mevcut sermaye ("${formData.capital}"), ürün geliştirme (MVP), ilk pazarlama faaliyetleri ve operasyonel giderler için optimize edilmelidir. İlk 6-12 ay içinde başabaş noktasına (breakeven) ulaşılması ve ardından kârlılığa geçilmesi öngörülmektedir. Gelecekteki büyüme için "${formData.strategy}" hedefi doğrultusunda ek yatırım veya finansman seçenekleri değerlendirilebilir.

6. YOL HARİTASI (ROADMAP)
- 1. Çeyrek: Ürün/Hizmetin lansmanı ve ilk müşteri geri bildirimlerinin toplanması.
- 2. Çeyrek: Pazarlama faaliyetlerinin artırılması ve müşteri tabanının genişletilmesi.
- 3. Çeyrek: Operasyonel verimliliğin artırılması ve ekibin büyütülmesi (ihtiyaç halinde).
- 4. Çeyrek: "${formData.strategy}" hedefine ulaşılması ve yeni pazarlara açılma hazırlıkları.

Bu plan, girişiminizi başarıya ulaştırmak için sağlam bir yol haritası sunmaktadır. Disiplinli uygulama ve sürekli öğrenme ile hedeflerinize ulaşmanız mümkündür. Başarılar dileriz!
      `;
      setPlanResult(fallbackPlan);
    } finally { setLoading(false); }
  };

  const downloadPDF = async () => {
    if (!planResult) return;
    const tid = toast.loading(t.toast_pdf_preparing);
    try {
        const res = await fetch(`${API_URL}/create_pdf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: planResult }) });
        if (!res.ok) throw new Error("PDF Error");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "StartERA_Plan.pdf"; document.body.appendChild(a); a.click(); a.remove();
        toast.success(t.toast_pdf_success);
    } catch { toast.error(t.toast_pdf_error); } finally { toast.dismiss(tid); }
  };

  if (!user) return <div className="flex h-screen items-center justify-center text-slate-500">Lütfen giriş yapın.</div>;

  return (
    <div dir={dir} className={`min-h-screen transition-all duration-700 relative overflow-hidden ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
         <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 animate-pulse ${darkMode ? 'bg-blue-900' : 'bg-blue-300'}`}></div>
         <div className={`absolute top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full blur-[130px] opacity-20 animate-pulse delay-1000 ${darkMode ? 'bg-purple-900' : 'bg-indigo-300'}`}></div>
      </div>
      <Toaster position="top-center" />
      <Chatbot lang={lang} darkMode={darkMode} />
      <nav className={`px-8 py-5 flex justify-between items-center backdrop-blur-lg sticky top-0 z-40 border-b transition-colors ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white/60 border-slate-200"}`}>
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">S</div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Start ERA</span>
        </div>
        <div className="flex items-center gap-4">
             <button onClick={toggleLang} className="font-black text-lg hover:scale-110 transition active:scale-95" title="Change Language">{getLangLabel()}</button>
             <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 shadow-sm hover:shadow-md border border-slate-100'}`}>{darkMode ? <SunIcon /> : <MoonIcon />}</button>
             <Link href="/dashboard" className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-all hover:shadow-lg no-underline active:scale-95 ${darkMode ? "border-slate-700 hover:bg-slate-800 text-slate-200" : "border-slate-200 hover:bg-white text-slate-900 bg-white/50"}`}>{t.nav_back}</Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        {planResult ? (
            <div className={`relative w-full p-[1px] rounded-[32px] bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-700`}>
                <div className={`w-full p-8 md:p-12 rounded-[31px] backdrop-blur-2xl ${darkMode ? "bg-slate-900/90" : "bg-white/90"}`}>
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 text-white text-4xl mb-6 shadow-lg shadow-green-500/30 animate-bounce">🎉</div>
                        <h2 className={`text-4xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.success_title}</h2>
                        <p className={`text-lg font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.success_desc(formData.idea.substring(0, 25) + "...")}</p>
                    </div>
                    <div className={`relative p-8 md:p-14 rounded-2xl shadow-inner overflow-y-auto max-h-[60vh] mb-10 font-serif text-base leading-loose border transition-colors scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70"></div>
                        <TypewriterEffect text={planResult} speed={3} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                        <button onClick={downloadPDF} className="group relative px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 w-full sm:w-auto overflow-hidden">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span className="flex items-center justify-center gap-2 relative z-10"><svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{t.download_pdf}</span>
                        </button>
                        <button onClick={() => { setPlanResult(null); setStep(1); setFormData({...formData, idea: ""}); }} className={`px-8 py-4 rounded-xl font-bold border transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${darkMode ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>{t.new_plan}</button>
                    </div>
                </div>
            </div>
        ) : (
            <div className={`relative w-full max-w-3xl transition-all duration-500`}>
                {loading && <LoadingOverlay messages={t.loading_messages} />}
                <div className="flex justify-between mb-3 px-2">
                   <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t.step_progress}</span>
                   <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>{t.step} {step} / 5</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-10 dark:bg-slate-800 overflow-hidden"><div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${(step / 5) * 100}%` }}></div></div>
                <div className={`relative p-8 md:p-12 rounded-[32px] shadow-2xl backdrop-blur-xl border transition-all duration-500 ${darkMode ? "bg-slate-900/80 border-slate-800 shadow-black/50" : "bg-white/80 border-white/60 shadow-blue-900/5"}`}>
                    <div className="mb-8 animate-in slide-in-from-bottom-2 fade-in duration-500" key={step}>
                        <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.questions[step - 1].title}</h2>
                        <p className={`text-lg md:text-xl font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{t.questions[step - 1].subtitle}</p>
                    </div>
                    <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 bg-gradient-to-r from-blue-600 to-purple-600`}></div>
                        <textarea rows={6} className={`relative w-full p-6 rounded-2xl border-none outline-none text-xl resize-none shadow-inner transition-all ${darkMode ? "bg-slate-950 text-white placeholder:text-slate-500 focus:bg-slate-900" : "bg-slate-100 text-slate-900 placeholder:text-slate-600 focus:bg-white"}`} placeholder={t.questions[step - 1].ph} value={formData[t.questions[step - 1].key as keyof typeof formData]} onChange={(e) => setFormData({...formData, [t.questions[step - 1].key]: e.target.value})} onKeyDown={handleKeyDown} autoFocus />
                    </div>
                    <div className="flex justify-between items-center mt-12">
                        {step > 1 ? <button onClick={() => setStep(step - 1)} className={`px-6 py-3 font-bold rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-slate-200'}`}>{lang === "ar" ? "→" : "←"} {t.back}</button> : <div></div>}
                        <button onClick={handleNext} disabled={loading} className={`group relative px-10 py-4 rounded-xl font-bold text-white shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden ${loading ? 'bg-slate-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span className="flex items-center gap-2 relative z-10">{step === 5 ? <><SparkleIcon />{t.start_magic}</> : <>{t.next} <span className={`group-hover:translate-x-1 transition-transform inline-block ${lang === "ar" ? "rotate-180" : ""}`}>→</span></>}</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeAuthProvider>
      <PlannerContent />
    </ThemeAuthProvider>
  );
}