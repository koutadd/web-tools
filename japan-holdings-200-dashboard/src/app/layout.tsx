import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '日本のホールディングス/グループ企業 200社ロゴ一覧',
  description: '社名にホールディングス・グループ・HOLDINGS・GROUPを含む日本企業200社のロゴ一覧ダッシュボード',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, backgroundColor: '#f0f2f5', fontFamily: '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif', color: '#111' }}>
        {children}
      </body>
    </html>
  )
}
