import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Design Scout JP',
  description: '日本の参考サイトをセクション構成で収集するデザインリサーチツール',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-white min-h-screen antialiased">{children}</body>
    </html>
  )
}
