import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '日本のホールディングス・グループ企業ロゴ一覧',
  description: '社名に「ホールディングス」または「グループ」を含む日本の主要企業ロゴダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{
        margin: 0,
        backgroundColor: '#f0f2f5',
        fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
        color: '#1a1a1a',
      }}>
        {children}
      </body>
    </html>
  )
}
