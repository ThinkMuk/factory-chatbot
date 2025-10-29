import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from './components/Header';
import FloatingDashboardButton from './components/FloatingDashboardButton';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Factory Chatbot',
  description: 'Factory Chatbot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='relative w-full max-w-[375px] h-[100dvh] bg-[#E8EDF4] text-foreground overflow-hidden flex flex-col'>
            <Header />
            <div className='flex-1 min-h-0'>{children}</div>
            <FloatingDashboardButton />
          </div>
        </div>
      </body>
    </html>
  );
}
