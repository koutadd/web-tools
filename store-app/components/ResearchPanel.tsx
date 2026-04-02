'use client';

import { useState } from 'react';
import { type Phase } from '@/lib/data';

// ─── 型 ──────────────────────────────────────────────────────────────────────

type Priority = '高' | '中' | '低';

type ResearchItem = {
  id: number;
  title: string;
  desc: string;
  priority: Priority;
  phase: Phase;
  taskTitle: string;
};

// ─── データ ───────────────────────────────────────────────────────────────────

const RESEARCH_ITEMS: ResearchItem[] = [
  {
    id: 1,
    title: 'Googleマイビジネス登録',
    desc: '「地域名＋コンタクト」で上位表示される最短手段。未登録なら最優先。',
    priority: '高',
    phase: '企画',
    taskTitle: 'Googleマイビジネスへの登録・最適化',
  },
  {
    id: 2,
    title: 'オンライン予約フォームの設置',
    desc: '来店予約をWebで受け付けることで機会損失を防ぐ。LINE連携も効果的。',
    priority: '高',
    phase: '制作',
    taskTitle: 'オンライン予約フォームの実装',
  },
  {
    id: 3,
    title: 'コンタクトレンズ商品ページの充実',
    desc: 'メーカー・価格・特徴を一覧化。比較しやすいUIで問い合わせ増が見込める。',
    priority: '高',
    phase: '制作',
    taskTitle: 'コンタクトレンズ商品ページの作成',
  },
  {
    id: 4,
    title: 'スマートフォン表示の最適化',
    desc: '検索流入の7割以上がスマホ。タップ操作・文字サイズ・ボタン配置の確認が必須。',
    priority: '高',
    phase: '制作',
    taskTitle: 'スマートフォン向けUI最適化チェック',
  },
  {
    id: 5,
    title: 'LINEお友達登録ボタンの設置',
    desc: '再来店・キャンペーン告知に有効。公式LINEアカウントと連携する。',
    priority: '中',
    phase: '制作',
    taskTitle: 'LINE公式アカウント連携ボタンの設置',
  },
  {
    id: 6,
    title: 'Instagram連携・SNSリンクの追加',
    desc: 'フォロワー誘導・店舗の雰囲気訴求。若い世代へのリーチに効果的。',
    priority: '中',
    phase: 'デザイン',
    taskTitle: 'SNSリンク（Instagram）の設置',
  },
  {
    id: 7,
    title: 'Googleアナリティクス・Search Console設定',
    desc: '公開後のアクセス分析・検索流入の確認に必須。公開前に設定しておく。',
    priority: '中',
    phase: '納品',
    taskTitle: 'Googleアナリティクス・Search Console設定',
  },
  {
    id: 8,
    title: 'お客様の声・口コミ掲載',
    desc: '実際の声を掲載することで信頼性が向上。Googleレビューへの誘導も有効。',
    priority: '低',
    phase: '制作',
    taskTitle: 'お客様の声セクションの追加',
  },
];

const PRIORITY_STYLE: Record<Priority, { bg: string; text: string; border: string; label: string }> = {
  高: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: '優先度：高' },
  中: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: '優先度：中' },
  低: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: '優先度：低' },
};

// ─── コンポーネント ────────────────────────────────────────────────────────────

export default function ResearchPanel({
  storeId,
  currentPhase,
}: {
  storeId: string;
  currentPhase: Phase;
}) {
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState<number | null>(null);
  const [filterPhase, setFilterPhase] = useState<Phase | 'すべて'>('すべて');

  const PHASES_FILTER: (Phase | 'すべて')[] = ['すべて', '企画', 'デザイン', '制作', '納品'];

  const filtered = filterPhase === 'すべて'
    ? RESEARCH_ITEMS
    : RESEARCH_ITEMS.filter((r) => r.phase === filterPhase);

  // 現在フェーズに関連するものを上に
  const sorted = [...filtered].sort((a, b) => {
    if (a.phase === currentPhase && b.phase !== currentPhase) return -1;
    if (b.phase === currentPhase && a.phase !== currentPhase) return 1;
    const pOrder: Priority[] = ['高', '中', '低'];
    return pOrder.indexOf(a.priority) - pOrder.indexOf(b.priority);
  });

  const addToTask = async (item: ResearchItem) => {
    if (added.has(item.id) || adding !== null) return;
    setAdding(item.id);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          title: item.taskTitle,
          phase: item.phase,
          done: false,
        }),
      });
      if (!res.ok) throw new Error();
      setAdded((prev) => new Set([...prev, item.id]));
    } finally {
      setAdding(null);
    }
  };

  return (
    <div>
      {/* ヘッダー説明 */}
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 13,
          color: '#0369a1',
          lineHeight: 1.6,
        }}
      >
        💡 このサイトにおすすめの施策候補です。「タスクに追加」でタスク一覧に追加されます。
      </div>

      {/* フィルタ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {PHASES_FILTER.map((f) => {
          const isActive = filterPhase === f;
          const isCurrent = f === currentPhase;
          return (
            <button
              key={f}
              onClick={() => setFilterPhase(f)}
              style={{
                padding: '4px 12px',
                borderRadius: 99,
                border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--color-text-sub)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {f}
              {f !== 'すべて' && isCurrent && (
                <span style={{
                  fontSize: 10,
                  background: isActive ? 'rgba(255,255,255,0.3)' : '#dbeafe',
                  color: isActive ? 'white' : '#1d4ed8',
                  padding: '1px 5px',
                  borderRadius: 99,
                  fontWeight: 700,
                }}>
                  現在
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 候補一覧 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((item) => {
          const p = PRIORITY_STYLE[item.priority];
          const isAdded = added.has(item.id);
          const isAdding = adding === item.id;
          const isCurrent = item.phase === currentPhase;

          return (
            <div
              key={item.id}
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${isCurrent ? '#93c5fd' : 'var(--color-border)'}`,
                borderRadius: 10,
                padding: '14px 16px',
                position: 'relative' as const,
                boxShadow: isCurrent ? '0 0 0 3px #dbeafe' : 'none',
              }}
            >
              {/* 上段: バッジ群 + タスク化ボタン */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: p.bg,
                    border: `1px solid ${p.border}`,
                    color: p.text,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {p.label}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: '#dbeafe', color: '#1d4ed8',
                      padding: '1px 6px', borderRadius: 99,
                      whiteSpace: 'nowrap' as const,
                    }}>
                      現在フェーズ向け
                    </span>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isAdded ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 6,
                      background: '#ecfdf5', border: '1px solid #a7f3d0',
                      color: '#065f46', fontSize: 12, fontWeight: 700,
                      whiteSpace: 'nowrap' as const,
                    }}>
                      ✓ 追加済み
                    </span>
                  ) : (
                    <button
                      onClick={() => addToTask(item)}
                      disabled={isAdding || adding !== null}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--color-accent)',
                        background: isAdding ? 'var(--color-accent-light)' : 'white',
                        color: 'var(--color-accent)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isAdding || adding !== null ? 'not-allowed' : 'pointer',
                        opacity: adding !== null && !isAdding ? 0.5 : 1,
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {isAdding ? '追加中...' : '+ タスクに追加'}
                    </button>
                  )}
                </div>
              </div>

              {/* タイトル（全幅） */}
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                {item.title}
              </p>

              {/* 説明（全幅） */}
              <p style={{ fontSize: 12, color: 'var(--color-text-sub)', lineHeight: 1.6, marginBottom: 8 }}>
                {item.desc}
              </p>

              {/* フェーズタグ */}
              <span style={{
                fontSize: 11, color: '#6b7280',
                background: '#f3f4f6', padding: '2px 8px', borderRadius: 99,
              }}>
                対象フェーズ：{item.phase}
              </span>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--color-text-sub)', textAlign: 'center', padding: '24px 0' }}>
          このフェーズの候補はありません
        </p>
      )}

      {added.size > 0 && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-sub)', textAlign: 'right' }}>
          {added.size}件をタスクに追加しました。「タスク」タブから確認できます。
        </p>
      )}
    </div>
  );
}
