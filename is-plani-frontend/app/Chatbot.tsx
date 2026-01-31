"use client";

import { useState, useEffect, useRef } from "react";

interface ChatbotProps {
  lang: string;
  darkMode: boolean;
}

export default function Chatbot({ lang, darkMode }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput,
          // 👇 KRİTİK: DİL AYNALAMA TALİMATI
          system_prompt: "You are a professional Start ERA assistant. KURAL: Kullanıcı hangi dilde yazarsa SADECE o dilde cevap ver. 'Hello' İngilizcedir, 'Merhaba' Türkçedir. Kullanıcının dilini asla değiştirme!"
        }),
      });

      if (!res.ok) throw new Error("API Hatası");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: lang === "tr" ? "⚠️ Hata oluştu." : (lang === "ar" ? "⚠️ حدث خطأ" : "⚠️ Error occurred.") 
      }]);
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
            {messages.length === 0 && (
              <p className="text-center text-sm opacity-50 mt-10">
                {lang === "tr" ? "Nasıl yardımcı olabilirim?" : lang === "ar" ? "كيف يمكنني مساعدتك؟" : "How can I help you?"}
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : (darkMode ? "bg-slate-700" : "bg-slate-100")}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-xs animate-pulse">...</div>}
          </div>
          <div className="p-4 border-t dark:border-slate-700 flex gap-2">
            <input 
              className={`flex-1 p-2 rounded-lg outline-none text-sm ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}
              placeholder={lang === "tr" ? "Mesaj yaz..." : lang === "ar" ? "اكتب رسالة..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg">🚀</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition">💬</button>
      )}
    </div>
  );
}