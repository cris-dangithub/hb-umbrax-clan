import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from '@/lib/get-current-user'
import ClientLayout from '@/components/ClientLayout'

// Forzar renderizado dinámico para toda la app (usa cookies/sessions)
export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'UMBRAX CLAN - Plataforma Oficial',
  description: 'Organización de élite en Habbo Hotel con temática mística y sombría',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout user={user}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
