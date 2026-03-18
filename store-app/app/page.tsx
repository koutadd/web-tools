import Link from 'next/link';
import { PHASES, type Phase } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import AddStoreForm from '@/components/AddStoreForm';

export const dynamic = 'force-dynamic';

const PHASE_COLORS: Record<Phase, string> = {
  企画: '#a78bfa',
  デザイン: '#fb923c',
  制作: '#34d399',
  納品: '#60a5fa',
};

export default async function HomePage() {
  const raw = await prisma.store.findMany({
    include: {
      tasks: { select: { id: true, done: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const stores = raw.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    currentPhase: s.currentPhase as Phase,
    startDate: s.startDate,
    deadline: s.deadline,
    memo: s.memo,
    whoWaiting: s.whoWaiting,
    taskCount: s.tasks.length,
    taskDoneCount: s.tasks.filter((t) => t.done).length,
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 24px',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>店舗管理</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-sub)', marginTop: 2 }}>
          制作中の店舗サイトを管理します
        </p>
      </header>

      {/* コンテンツ */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        {/* 店舗追加フォーム */}
        <AddStoreForm />

        {/* サマリー */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {PHASES.map((phase) => {
            const count = stores.filter((s) => s.currentPhase === phase).length;
            return (
              <div
                key={phase}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 99,
                    background: PHASE_COLORS[phase] + '22',
                    color: PHASE_COLORS[phase],
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {phase}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>件</div>
              </div>
            );
          })}
        </div>

        {/* 店舗一覧 */}
        {stores.length === 0 ? (
          <p style={{ color: 'var(--color-text-sub)', fontSize: 14 }}>
            登録されている店舗がありません
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stores.map((store) => {
              const progress =
                store.taskCount > 0
                  ? Math.round((store.taskDoneCount / store.taskCount) * 100)
                  : 0;
              return (
                <div
                  key={store.id}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* 上段 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    <Link href={`/stores/${store.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{store.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-sub)', marginTop: 2 }}>
                        {store.category} ・ 期限: {store.deadline}
                      </div>
                    </Link>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: 99,
                          background: PHASE_COLORS[store.currentPhase] + '22',
                          color: PHASE_COLORS[store.currentPhase],
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {store.currentPhase}
                      </div>
                      {store.whoWaiting !== 'none' && store.whoWaiting !== '' && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: store.whoWaiting === 'owner' ? '#fef2f2' : '#eff6ff',
                          color: store.whoWaiting === 'owner' ? '#dc2626' : '#1d4ed8',
                          border: `1px solid ${store.whoWaiting === 'owner' ? '#fecaca' : '#bfdbfe'}`,
                        }}>
                          {store.whoWaiting === 'owner' ? '👤 オーナー待ち' : '🔧 担当者待ち'}
                        </div>
                      )}
                      <Link
                        href={`/owner/${store.id}`}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--color-accent)',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          padding: '2px 9px', borderRadius: 6,
                          textDecoration: 'none', whiteSpace: 'nowrap',
                        }}
                      >
                        ユーザー側を見る
                      </Link>
                    </div>
                  </div>

                  {/* プログレスバー */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: 'var(--color-text-sub)',
                        marginBottom: 4,
                      }}
                    >
                      <span>
                        タスク完了: {store.taskDoneCount}/{store.taskCount}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: 'var(--color-border)',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: PHASE_COLORS[store.currentPhase],
                          borderRadius: 99,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
