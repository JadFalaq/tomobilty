import type { Metadata } from 'next'
import { Playfair_Display, Lato } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const lato = Lato({ 
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tomobilty - Location de Voitures de Luxe au Maroc',
  description: 'Expérience de location de voiture premium au Maroc. Élégance, confort et service d\'exception avec Tomobilty.',
}

import ChatBot from '@/components/ChatBot'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${lato.variable}`}>
      <body className={`${lato.className} pt-[72px]`}>
        <AppShell>{children}</AppShell>
        <ChatBot />
      </body>
    </html>
  )
}
