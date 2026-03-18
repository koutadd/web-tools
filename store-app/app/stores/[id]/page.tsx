import Link from 'next/link';
import { notFound } from 'next/navigation';
import { calcProgress, type Phase, type Task } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import StoreDetail from '@/components/StoreDetail';

export const dynamic = 'force-dynamic';

const PHASE_META: Record<Phase, { color: string; border: string; badge: string; badgeText: string; icon: string }> = {
  企画:     { color: '#7c3aed', border: '#a78bfa', badge: '#ede9fe', badgeText: '#5b21b6', icon: '💡' },
  デザイン: { color: '#c2410c', border: '#fb923c', badge: '#ffedd5', badgeText: '#9a3412', icon: '🎨' },
  制作:     { color: '#065f46', border: '#34d399', badge: '#d1fae5', badgeText: '#064e3b', icon: '🔧' },
  納品:     { color: '#1d4ed8', border: '#60a5fa', badge: '#dbeafe', badgeText: '#1e40af', icon: '🚀' },
};

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raw = await prisma.store.findUnique({
    where: { id },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });
  if (!raw) notFound();

  const store = {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    currentPhase: raw.currentPhase as Phase,
    startDate: raw.startDate,
    deadline: raw.deadline,
    memo: raw.memo,
    tasks: raw.tasks.map((t): Task => ({
      id: t.id,
      title: t.title,
      done: t.done,
      phase: t.phase as Phase,
    })),
  };

  const progress  = calcProgress(store.tasks);
  const doneCount = store.tasks.filter((t) => t.done).length;
  const remaining = store.tasks.length - doneCount;
  const meta      = PHASE_META[store.currentPhase];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ─── ヘッダー ─── */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: `3px solid ${meta.border}`,
      }}>
        {/* 上段: ナビゲーション（左右に分離、店舗名の邪魔をしない） */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: 'var(--color-text-sub)',
            padding: '5px 10px', borderRadius: 6,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            textDecoration: 'none', fontWeight: 500,
          }}>
            ← 一覧
          </Link>
          <Link href={`/owner/${store.id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700,
            color: meta.badgeText,
            padding: '5px 12px', borderRadius: 6,
            background: meta.badge,
            border: `1px solid ${meta.border}88`,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            ユーザー画面 →
          </Link>
        </div>

        {/* 中段: 店舗名（横幅フル） */}
        <div style={{ padding: '14px 16px 6px' }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800,
            color: 'var(--color-text)', lineHeight: 1.2,
            marginBottom: 8,
          }}>
            {store.name}
          </h1>

          {/* チップ行: カテゴリ・フェーズ・期限 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 800,
              background: meta.badge, color: meta.badgeText,
              border: `1px solid ${meta.border}66`,
            }}>
              {meta.icon} {store.currentPhase}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 99, fontSize: 12,
              background: 'var(--color-bg)', color: 'var(--color-text-sub)',
              border: '1px solid var(--color-border)',
            }}>
              {store.category}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 99, fontSize: 12,
              background: 'var(--color-bg)', color: 'var(--color-text-sub)',
              border: '1px solid var(--color-border)',
            }}>
              期限: {store.deadline}
            </span>
          </div>
        </div>

        {/* 下段: 進捗バー */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 5,
          }}>
            <span>
              {doneCount}/{store.tasks.length} 完了
              {remaining > 0 && (
                <span style={{ marginLeft: 6, color: meta.color, fontWeight: 700 }}>
                  あと {remaining} 件
                </span>
              )}
            </span>
            <span style={{ fontWeight: 700, color: meta.color }}>{progress}%</span>
          </div>
          <div style={{
            height: 5, background: `${meta.border}33`,
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: meta.border, borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>
        <StoreDetail store={store} />
      </main>
    </div>
  );
}
