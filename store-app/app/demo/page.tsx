import Link from 'next/link';

const SCENARIOS = [
  {
    id: '1',
    emoji: '🌱',
    num: '①',
    title: '初回スタート',
    phase: '企画',
    phaseColor: '#a78bfa',
    phaseBg: '#f5f3ff',
    desc: 'オープン準備を始めたばかり。最初のフェーズで何をすべきか体験できます。',
    progress: 5,
  },
  {
    id: '2',
    emoji: '🚀',
    num: '②',
    title: 'スムーズ進行',
    phase: 'デザイン',
    phaseColor: '#fb923c',
    phaseBg: '#fff7ed',
    desc: 'デザインフェーズで順調に進む状態。提出〜承認の流れを確認できます。',
    progress: 45,
  },
  {
    id: '3',
    emoji: '⏳',
    num: '③',
    title: '確認待ち',
    phase: 'デザイン',
    phaseColor: '#fb923c',
    phaseBg: '#fff7ed',
    desc: '写真を提出済みで担当者の確認を待っている状態。次の行動がわかります。',
    progress: 60,
  },
  {
    id: '4',
    emoji: '🔁',
    num: '④',
    title: '差し戻し',
    phase: '制作',
    phaseColor: '#34d399',
    phaseBg: '#ecfdf5',
    desc: '提出データが差し戻しになった状態。再提出の手順を体験できます。',
    progress: 70,
  },
  {
    id: '5',
    emoji: '🏁',
    num: '⑤',
    title: '完了間近',
    phase: '納品',
    phaseColor: '#60a5fa',
    phaseBg: '#eff6ff',
    desc: '全項目がほぼ揃い、納品に向けた最終確認の状態。',
    progress: 90,
  },
];

export default function DemoPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif',
    }}>
      {/* ヘッダー */}
      <header style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '20px 16px 24px',
        color: 'white',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, textDecoration: 'none' }}>
            ← 管理画面に戻る
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 4px' }}>
            🎮 デモ体験
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
            説明を読まなくても、触って理解できます。
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* ─── 体験モード CTA ─── */}
        <Link href="/demo/play" style={{ textDecoration: 'none', display: 'block', marginBottom: 28 }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: 18,
            padding: '22px 20px',
            color: 'white',
            boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                flexShrink: 0,
              }}>
                ▶️
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: 1, marginBottom: 3 }}>
                  おすすめ
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                  体験モード（デモプレイ）
                </h2>
              </div>
            </div>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.65, margin: '0 0 14px' }}>
              ステップガイドに従って実際に操作しながら使い方を学べます。<br />
              初めての方はこちらからどうぞ。
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{
                background: 'rgba(255,255,255,0.22)',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}>
                体験を始める →
              </span>
            </div>
          </div>
        </Link>

        {/* ─── デモシナリオ一覧 ─── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 12, letterSpacing: 0.5 }}>
          場面別デモシナリオ
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              href={`/demo/play?scenario=${s.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'white',
                borderRadius: 14,
                padding: '15px 16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                {/* アイコン */}
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: s.phaseBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}>
                  {s.emoji}
                </div>

                {/* テキスト */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
                      デモ{s.num}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: s.phaseColor,
                      background: s.phaseBg,
                      padding: '2px 8px',
                      borderRadius: 20,
                    }}>
                      {s.phase}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>
                    {s.title}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.45 }}>
                    {s.desc}
                  </p>
                </div>

                {/* 進捗 */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 2px' }}>
                    {s.progress}%
                  </p>
                  <div style={{ width: 36, height: 4, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${s.progress}%`,
                      background: s.phaseColor,
                      borderRadius: 99,
                    }} />
                  </div>
                </div>

                <span style={{ fontSize: 14, color: '#d1d5db' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
