import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PHASES, type Phase, type Task } from '@/lib/data';
import { getDeadlineMeta } from '@/lib/checklist';
import ConsultWidget from '@/components/ConsultWidget';
import ChecklistPanel, { type DriveFolderUrls } from '@/components/ChecklistPanel';
import OwnerPurchaseSection, { type PurchaseItemData } from '@/components/OwnerPurchaseSection';
import OwnerTodoSection, { type TodoItem } from '@/components/OwnerTodoSection';
import OwnerPageLogger from '@/components/OwnerPageLogger';
import OwnerFixedCTA from '@/components/OwnerFixedCTA';

export const dynamic = 'force-dynamic';

// ─── フェーズ定義 ─────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<Phase, { bg: string; text: string; border: string; light: string }> = {
  企画:     { bg: '#a78bfa', text: '#6d28d9', border: '#c4b5fd', light: '#f5f3ff' },
  デザイン: { bg: '#fb923c', text: '#c2410c', border: '#fed7aa', light: '#fff7ed' },
  制作:     { bg: '#34d399', text: '#065f46', border: '#a7f3d0', light: '#ecfdf5' },
  納品:     { bg: '#60a5fa', text: '#1d4ed8', border: '#bfdbfe', light: '#eff6ff' },
};

const PHASE_HEADER: Record<Phase, { from: string; to: string }> = {
  企画:     { from: '#6d28d9', to: '#a78bfa' },
  デザイン: { from: '#c2410c', to: '#fb923c' },
  制作:     { from: '#065f46', to: '#34d399' },
  納品:     { from: '#1d4ed8', to: '#60a5fa' },
};

const PHASE_ICONS: Record<Phase, string> = {
  企画:     '💡',
  デザイン: '🎨',
  制作:     '🔧',
  納品:     '🚀',
};

const PHASE_STORY: Record<Phase, string> = {
  企画:     'お店のコンセプトや方向性を一緒に決める大切なフェーズです。いただいた情報をもとに、最高のプランを作り上げます。',
  デザイン: 'ご提供いただいた素材をもとに、デザインを仕上げていきます。写真や資料の提出が完了したら、いよいよ制作開始です！',
  制作:     'デザインが確定し、実際の制作が進んでいます。確認が必要な場合はご連絡いたしますので、少々お待ちください。',
  納品:     '完成まであと少し！最終確認や修正対応を行い、納品に向けて準備を整えています。もうすぐお届けできます。',
};

// ─── ページ ───────────────────────────────────────────────────────────────────

export default async function OwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raw = await prisma.store.findUnique({
    where: { id },
    include: {
      tasks:             { orderBy: { order: 'asc' } },
      purchaseItems:     { orderBy: { sortOrder: 'asc' } },
      uploadDestination: true,
    },
  });
  if (!raw) notFound();

  // オーナー対応待ちの必要情報（今やること用）
  const ownerPendingItems = await prisma.requiredItem.findMany({
    where: {
      storeId: id,
      assigneeType: 'owner',
      status: { in: ['pending', 'rejected'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  const tasks: Task[] = raw.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    done: t.done,
    phase: t.phase as Phase,
  }));

  const currentPhase = raw.currentPhase as Phase;
  const currentPhaseIndex = PHASES.indexOf(currentPhase);
  const colors = PHASE_COLORS[currentPhase];
  const headerGrad = PHASE_HEADER[currentPhase];

  const doneTasks = tasks.filter((t) => t.done);
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const whoWaiting = raw.whoWaiting;
  const isOwnerWaiting = whoWaiting === 'owner';

  const todoItems: TodoItem[] = ownerPendingItems.map((item) => ({
    id:       item.id,
    label:    item.label,
    reason:   item.reason   || null,
    dueLabel: item.dueLabel || null,
    category: item.category,
  }));

  const deadlineMeta = getDeadlineMeta(raw.deadline);
  const isUrgent = ['期限超過', '今日中', '明日まで', '今週中'].includes(deadlineMeta.label);

  const purchaseItems: PurchaseItemData[] = raw.purchaseItems.map((p) => ({
    id:        p.id,
    category:  p.category,
    name:      p.name,
    brand:     p.brand,
    price:     p.price,
    url:       p.url,
    emoji:     p.emoji,
    tag:       p.tag,
    tagColor:  p.tagColor,
    desc:      p.desc,
    notes:     p.notes,
    necessity: p.necessity,
    phase:     p.phase,
    status:    p.status,
  }));
  // Drive フォルダ URL（100MB 超ファイルの Direct Upload 案内用）
  const ud = raw.uploadDestination;
  const driveFolderUrls: DriveFolderUrls = {
    photo:    ud?.photoFolderUrl    || undefined,
    asset:    ud?.assetFolderUrl    || undefined,
    document: ud?.documentFolderUrl || undefined,
    root:     ud?.rootFolderUrl     || undefined,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ─── ウェルカムヘッダー ─── */}
      <header
        style={{
          background: `linear-gradient(135deg, ${headerGrad.from} 0%, ${headerGrad.to} 100%)`,
          padding: '0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景装飾 */}
        <div style={{
          position: 'absolute', top: -60, right: -40,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -20,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        {/* コンテンツ */}
        <div style={{ padding: '28px 20px 24px', position: 'relative' }}>
          {/* 上段: 挨拶 + 管理リンク */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 14, gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 4 }}>
                おかえりなさい！
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {raw.name} 様
              </h1>
            </div>
            <a
              href={`/stores/${id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 13px', borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.95)',
                fontSize: 11, fontWeight: 600, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              管理側を見る →
            </a>
          </div>

          {/* 中段: フェーズ + 誰待ちバッジ + 期限 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 99,
              background: 'rgba(255,255,255,0.22)',
              color: 'white', fontSize: 12, fontWeight: 700,
            }}>
              {PHASE_ICONS[currentPhase]} {currentPhase}フェーズ
            </span>

            {whoWaiting === 'owner' ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 99,
                background: 'rgba(255,255,255,0.95)',
                color: '#b91c1c', fontSize: 12, fontWeight: 700,
              }}>
                <span className="pulse-dot" style={{ display: 'inline-block' }}>👤</span>
                あなたの対応をお待ちしています
              </span>
            ) : whoWaiting === 'admin' ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 99,
                background: 'rgba(255,255,255,0.18)',
                color: 'white', fontSize: 12, fontWeight: 600,
              }}>
                🔧 担当者が作業中
              </span>
            ) : null}
          </div>

          {/* 下段: 納期 + 期限バッジ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
              納期：{raw.deadline}
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 99,
              background: deadlineMeta.label === '余裕あり'
                ? 'rgba(255,255,255,0.2)'
                : 'rgba(255,255,255,0.95)',
              color: deadlineMeta.label === '余裕あり'
                ? 'rgba(255,255,255,0.9)'
                : deadlineMeta.color,
            }}>
              {deadlineMeta.label}
            </span>
          </div>

          {/* 進捗バー */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              height: 4, background: 'rgba(255,255,255,0.22)',
              borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'rgba(255,255,255,0.88)', borderRadius: 99,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>
              全体進捗 {progress}%（作業 {doneTasks.length} / {tasks.length} 完了）
            </p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 100px' }}>
        <OwnerPageLogger storeId={id} phase={currentPhase} />

        {/* ─── 期限アラート（緊急時のみ）─── */}
        {isUrgent && (
          <section style={{
            background: deadlineMeta.bg,
            border: `1px solid ${deadlineMeta.border}`,
            borderRadius: 12, padding: '13px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: deadlineMeta.color, marginBottom: 1 }}>
                納期のお知らせ ─ {deadlineMeta.label}
              </p>
              <p style={{ fontSize: 12, color: deadlineMeta.color, opacity: 0.85 }}>
                納期は {raw.deadline} です。お早めにご確認をお願いします。
              </p>
            </div>
          </section>
        )}

        {/* ─── フェーズストーリー ─── */}
        <section style={{
          background: colors.light,
          border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: colors.text, marginBottom: 6, letterSpacing: 0.5 }}>
            {PHASE_ICONS[currentPhase]} {currentPhase}フェーズ ─ 今の状況
          </p>
          <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.75, opacity: 0.85 }}>
            {PHASE_STORY[currentPhase]}
          </p>
        </section>

        {/* ─── 今やること ─── */}
        <OwnerTodoSection
          items={todoItems}
          phaseColor={colors}
          isOwnerWaiting={isOwnerWaiting}
        />

        {/* ─── 制作の流れ（折りたたみ）─── */}
        <details style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12, marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <summary style={{
            padding: '14px 18px', cursor: 'pointer', listStyle: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                padding: '3px 12px', borderRadius: 99,
                background: colors.light, border: `1px solid ${colors.border}`,
                color: colors.text, fontSize: 12, fontWeight: 700,
              }}>
                {PHASE_ICONS[currentPhase]} {currentPhase}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                全体 <strong style={{ color: colors.text }}>{progress}%</strong> 完了
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>制作の流れ ▼</span>
          </summary>

          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 12 }}>
              {PHASES.map((phase, i) => {
                const isDone = i < currentPhaseIndex;
                const isActive = i === currentPhaseIndex;
                const c = PHASE_COLORS[phase];
                return (
                  <div key={phase} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {i > 0 && (
                        <div style={{ flex: 1, height: 3, background: isDone || isActive ? c.bg : '#e5e7eb', transition: 'background 0.3s' }} />
                      )}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: isDone ? c.bg : isActive ? c.bg : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isActive ? `0 0 0 4px ${c.bg}33` : 'none',
                        transition: 'all 0.3s',
                      }}>
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,7 5.5,10.5 12,3.5" />
                          </svg>
                        ) : (
                          <span style={{ fontSize: isActive ? 13 : 11, color: isActive ? 'white' : '#9ca3af', fontWeight: 700 }}>
                            {isActive ? PHASE_ICONS[phase] : i + 1}
                          </span>
                        )}
                      </div>
                      {i < PHASES.length - 1 && (
                        <div style={{ flex: 1, height: 3, background: isDone ? PHASE_COLORS[PHASES[i + 1]].bg : '#e5e7eb' }} />
                      )}
                    </div>
                    <p style={{
                      fontSize: 10, marginTop: 5, textAlign: 'center' as const,
                      fontWeight: isActive ? 800 : 400,
                      color: isActive ? c.text : isDone ? '#6b7280' : '#9ca3af',
                    }}>
                      {phase}
                    </p>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.bg}, ${colors.bg}cc)`,
                borderRadius: 99, transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              作業項目 {doneTasks.length} / {tasks.length} 完了
            </p>
          </div>
        </details>

        {/* ─── 必要情報チェックリスト ─── */}
        <div id="checklist">
          <ChecklistPanel storeId={id} currentPhase={currentPhase} driveFolderUrls={driveFolderUrls} />
        </div>

        {/* ─── 購入備品・おすすめ商品 ─── */}
        <OwnerPurchaseSection items={purchaseItems} />

        {/* ─── 相談導線バナー ─── */}
        <section style={{
          background: `linear-gradient(135deg, ${headerGrad.from}11 0%, ${headerGrad.to}22 100%)`,
          border: `1px solid ${colors.border}`,
          borderRadius: 14, padding: '18px 20px', marginBottom: 16,
          textAlign: 'center' as const,
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: colors.text, marginBottom: 6 }}>
            💬 わからないことはお気軽にご相談ください
          </p>
          <p style={{ fontSize: 12, color: colors.text, opacity: 0.75, marginBottom: 14, lineHeight: 1.6 }}>
            写真の撮り方・提出方法・進捗についてなど、<br />どんな小さなことでもお答えします。
          </p>
        </section>

        {/* ─── 担当者への相談 ─── */}
        <ConsultWidget storeId={id} storeName={raw.name} />

        {/* ─── お問い合わせ ─── */}
        <section style={{ marginBottom: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 10, letterSpacing: 0.5 }}>
            お問い合わせ
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <a
              href="mailto:info@aicare-lab.jp"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '15px 20px', borderRadius: 12,
                background: colors.bg, color: 'white',
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                boxShadow: `0 3px 12px ${colors.bg}55`,
              }}
            >
              <span style={{ fontSize: 18 }}>✉️</span>
              メールで問い合わせる
            </a>
            <a
              href="tel:0120-000-000"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '15px 20px', borderRadius: 12,
                background: 'white', border: '1px solid #e5e7eb',
                color: '#374151', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: 18 }}>📞</span>
              電話で問い合わせる
            </a>
          </div>
        </section>

      </main>

      {/* ─── 下部固定CTA ─── */}
      <OwnerFixedCTA />

      {/* フッター */}
      <footer style={{
        textAlign: 'center' as const,
        padding: '20px 16px',
        fontSize: 12,
        color: '#9ca3af',
        borderTop: '1px solid #e5e7eb',
        background: 'white',
      }}>
        アイケアラボ 制作進捗ページ
      </footer>
    </div>
  );
}
