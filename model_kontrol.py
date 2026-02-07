import os
import requests
from dotenv import load_dotenv

# .env dosyasından anahtarı al
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ HATA: .env dosyasında GOOGLE_API_KEY bulunamadı!")
    print("Lütfen .env dosyanı kontrol et.")
    exit()

print(f"🔑 API Anahtarı ile sorgu yapılıyor... (Anahtar: {api_key[:5]}...)")

# Direkt Google REST API'ye soruyoruz (Kütüphane derdi yok)
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ --- SENİN HESABINDA AKTİF OLAN MODELLER ---\n")
        available_models = []
        for model in data.get('models', []):
            # Sadece metin üretebilen (generateContent) modelleri filtrele
            if 'generateContent' in model.get('supportedGenerationMethods', []):
                print(f"🔹 {model['name']}")
                available_models.append(model['name'])
        
        print("\n------------------------------------------------")
        if not available_models:
            print("⚠️ Hesabında 'generateContent' destekleyen model bulunamadı!")
        else:
            print(f"Toplam {len(available_models)} adet kullanılabilir model bulundu.")
            
    else:
        print(f"\n❌ HATA OLUŞTU! (Kod: {response.status_code})")
        print("Google'dan gelen mesaj:", response.text)

except Exception as e:
    print(f"\n❌ Bağlantı hatası: {str(e)}")