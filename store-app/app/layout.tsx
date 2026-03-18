import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '店舗管理システム',
  description: '制作中の店舗サイトを管理するツール',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
