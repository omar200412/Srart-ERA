import "./globals.css";
import { Inter } from "next/font/google";
// TAM ADRES KULLANIYORUZ
import { ThemeAuthProvider } from "./context/ThemeAuthContext"; 

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* Hata veren 72. satırı susturan sarmalama burası */}
        <ThemeAuthProvider>
          {children}
        </ThemeAuthProvider>
      </body>
    </html>
  );
}