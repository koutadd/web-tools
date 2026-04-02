import Link from 'next/link';
import { PHASES, type Phase } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import AddStoreForm from '@/components/AddStoreForm';
import StoreList, { type StoreRow } from '@/components/StoreList';

export const dynamic = 'force-dynamic';

const PHASE_META: Record<Phase, { color: string; bg: string; border: string; icon: string }> = {
  企画:     { color: '#7c3aed', bg: '#f5f3ff', border: '#a78bfa', icon: '💡' },
  デザイン: { color: '#c2410c', bg: '#fff7ed', border: '#fb923c', icon: '🎨' },
  制作:     { color: '#065f46', bg: '#ecfdf5', border: '#34d399', icon: '🔧' },
  納品:     { color: '#1d4ed8', bg: '#eff6ff', border: '#60a5fa', icon: '🚀' },
};

export default async function HomePage() {
  const raw = await prisma.store.findMany({
    include: { tasks: { select: { id: true, done: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const stores: StoreRow[] = raw.map((s) => ({
    id:           s.id,
    name:         s.name,
    contactName:  s.contactName,
    location:     s.location,
    openStatus:   s.openStatus,
    currentPhase: s.currentPhase as Phase,
    deadline:     s.deadline,
    whoWaiting:   s.whoWaiting,
    taskCount:    s.tasks.length,
    taskDoneCount: s.tasks.filter((t) => t.done).length,
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ヘッダー（safe area 対応）*/}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '14px 20px',
        paddingTop: 'max(14px, calc(env(safe-area-inset-top, 0px) + 14px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>店舗管理</h1>
            <p style={{ fontSize: 12, color: 'var(--color-text-sub)', marginTop: 2 }}>
              制作中の店舗サイトを管理します
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {/* PWA追加ボタン */}
            <button
              data-pwa-install
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
                background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe',
                fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              📱 アプリ化
            </button>
            {/* チュートリアル導線 */}
            <Link
              href="/demo/play"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 9, flexShrink: 0,
                background: '#fef9c3', color: '#854d0e',
                border: '1px solid #fde68a',
                fontSize: 12, fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              🎮 使い方
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <AddStoreForm />

        {/* フェーズ別サマリー */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12, marginBottom: 24,
        }}>
          {PHASES.map((phase) => {
            const meta  = PHASE_META[phase];
            const count = stores.filter((s) => s.currentPhase === phase).length;
            return (
              <div key={phase} style={{
                background: meta.bg,
                border: `1px solid ${meta.border}33`,
                borderLeft: `3px solid ${meta.border}`,
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: 0.3, marginBottom: 2 }}>
                    {phase}フェーズ
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                    {count}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>件</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 絞り込み + カード一覧（クライアントコンポーネント） */}
        {stores.length === 0 ? (
          <p style={{ color: 'var(--color-text-sub)', fontSize: 14 }}>
            登録されている店舗がありません
          </p>
        ) : (
          <StoreList stores={stores} />
        )}
      </main>
    </div>
  );
}
