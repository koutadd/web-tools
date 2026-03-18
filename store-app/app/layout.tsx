import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PWAInstallModal from '@/components/PWAInstallModal';

export const metadata: Metadata = {
  title: '店舗管理アプリ',
  description: 'お店の制作進捗を管理するアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    // black-translucent にすると gradient header がノッチ下まで伸びて美しい
    statusBarStyle: 'black-translucent',
    title: '店舗管理',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  // viewport-fit=cover でノッチ・Dynamic Island まで使えるように
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* iOS ホーム画面アイコン */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Splash screen 起動時の背景色 */}
        <meta name="msapplication-TileColor" content="#2563eb" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        {children}
        {/* 全画面共通: PWAインストールモーダル */}
        <PWAInstallModal />
      </body>
    </html>
  );
}
