import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '日本のホールディングス・グループ企業一覧',
  description: '社名に「ホールディングス」または「グループ」を含む日本の主要企業一覧',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif', backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
