import Link from 'next/link';
import { notFound } from 'next/navigation';
import { calcProgress, type Phase, type Task } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import StoreDetail from '@/components/StoreDetail';

export const dynamic = 'force-dynamic';

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

  // Prismaの余分なフィールドを除いてUIの型に合わせる
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

  const progress = calcProgress(store.tasks);
  const doneCount = store.tasks.filter((t) => t.done).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--color-text-sub)',
            fontSize: 14,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            whiteSpace: 'nowrap',
          }}
        >
          ← 一覧
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>{store.name}</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-sub)', marginTop: 2 }}>
            {store.category} ・ 期限: {store.deadline} ・ 完了{doneCount}/{store.tasks.length}タスク（{progress}%）
          </p>
        </div>
        <Link
          href={`/owner/${store.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--color-accent)',
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 6,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}
        >
          ユーザー画面 →
        </Link>
      </header>

      {/* コンテンツ */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <StoreDetail store={store} />
      </main>
    </div>
  );
}
