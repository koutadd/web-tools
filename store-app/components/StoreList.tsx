'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PHASES, type Phase } from '@/lib/data';

// ─── 型 ──────────────────────────────────────────────────────────────────────

export type StoreRow = {
  id: string;
  name: string;
  contactName: string;
  location: string;
  openStatus: string;
  currentPhase: Phase;
  deadline: string;
  whoWaiting: string;
  taskCount: number;
  taskDoneCount: number;
};

// ─── フェーズ定義 ─────────────────────────────────────────────────────────────

const PHASE_META: Record<Phase, {
  color: string;
  border: string;
  badge: string;
  badgeText: string;
  icon: string;
}> = {
  企画:     { color: '#7c3aed', border: '#a78bfa', badge: '#ede9fe', badgeText: '#5b21b6', icon: '💡' },
  デザイン: { color: '#c2410c', border: '#fb923c', badge: '#ffedd5', badgeText: '#9a3412', icon: '🎨' },
  制作:     { color: '#065f46', border: '#34d399', badge: '#d1fae5', badgeText: '#064e3b', icon: '🔧' },
  納品:     { color: '#1d4ed8', border: '#60a5fa', badge: '#dbeafe', badgeText: '#1e40af', icon: '🚀' },
};

type FilterKey = 'all' | Phase;

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  /* ─ カード ─ */
  .store-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    border-left-width: 4px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: box-shadow 0.18s, transform 0.18s;
  }
  .store-card:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.10);
    transform: scale(1.01) translateY(-1px);
  }
  .store-card:active {
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transform: scale(0.97);
    transition: box-shadow 0.05s, transform 0.05s;
  }

  /* ─ フィルターボタン ─ */
  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 99px;
    border: 1.5px solid transparent;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: box-shadow 0.15s, transform 0.1s, background 0.12s;
    flex-shrink: 0;
  }
  .filter-btn:hover  { box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
  .filter-btn:active { transform: scale(0.93); transition: transform 0.06s; }

  /* ─ カードリスト フェードイン ─ */
  @keyframes listFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .card-list-enter { animation: listFadeIn 0.18s ease-out; }

  /* ─ 空状態 ─ */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-text-sub);
    font-size: 14px;
    background: white;
    border: 1px dashed #e5e7eb;
    border-radius: 12px;
  }
`;

// ─── コンポーネント ───────────────────────────────────────────────────────────

export default function StoreList({ stores }: { stores: StoreRow[] }) {
  const router = useRouter();
  const [active, setActive]   = useState<FilterKey>('all');
  const [listKey, setListKey] = useState(0);

  const switchFilter = (key: FilterKey) => {
    setActive(key);
    setListKey((k) => k + 1);
  };

  const filtered = active === 'all' ? stores : stores.filter((s) => s.currentPhase === active);
  const countOf  = (phase: Phase) => stores.filter((s) => s.currentPhase === phase).length;

  type Tab = { key: FilterKey; label: string; count: number; icon?: string };
  const tabs: Tab[] = [
    { key: 'all', label: 'すべて', count: stores.length },
    ...PHASES.map((p) => ({ key: p as FilterKey, label: p, count: countOf(p), icon: PHASE_META[p].icon })),
  ];

  return (
    <>
      <style>{CSS}</style>

      {/* ─── フィルターバー ─── */}
      <div style={{
        overflowX: 'auto', scrollbarWidth: 'none',
        marginBottom: 16, padding: '2px 0 4px',
      }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
          {tabs.map((tab) => {
            const isActive     = active === tab.key;
            const meta         = tab.key === 'all' ? null : PHASE_META[tab.key as Phase];
            const activeBg     = meta ? meta.badge    : '#1e293b';
            const activeText   = meta ? meta.badgeText : '#fff';
            const activeBorder = meta ? meta.border    : '#1e293b';

            return (
              <button
                key={tab.key}
                className="filter-btn"
                onClick={() => switchFilter(tab.key)}
                style={{
                  background:   isActive ? activeBg : 'white',
                  color:        isActive ? activeText : 'var(--color-text-sub)',
                  borderColor:  isActive ? activeBorder : '#e5e7eb',
                  boxShadow:    isActive ? `0 0 0 2px ${activeBorder}44` : 'none',
                }}
              >
                {tab.icon && <span style={{ fontSize: 14 }}>{tab.icon}</span>}
                {tab.label}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 20, height: 20, borderRadius: 99, padding: '0 5px',
                  fontSize: 11, fontWeight: 800,
                  background: isActive ? (meta ? meta.color : '#0f172a') : '#e5e7eb',
                  color:      isActive ? 'white' : 'var(--color-text-sub)',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 絞り込み中バナー ─── */}
      {active !== 'all' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10, padding: '7px 12px', borderRadius: 8,
          background: PHASE_META[active as Phase].badge,
          border: `1px solid ${PHASE_META[active as Phase].border}66`,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: PHASE_META[active as Phase].color }}>
            {PHASE_META[active as Phase].icon} {active}フェーズのみ表示中
          </span>
          <button
            onClick={() => switchFilter('all')}
            style={{
              fontSize: 11, fontWeight: 600,
              color: PHASE_META[active as Phase].color,
              background: 'none', border: 'none', cursor: 'pointer',
              textDecoration: 'underline', padding: 0,
            }}
          >
            全て表示
          </button>
        </div>
      )}

      {/* ─── カード一覧 ─── */}
      {filtered.length === 0 ? (
        <div className="empty-state"><p>該当する店舗がありません</p></div>
      ) : (
        <div key={listKey} className="card-list-enter"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((store) => {
            const meta      = PHASE_META[store.currentPhase];
            const progress  = store.taskCount > 0
              ? Math.round((store.taskDoneCount / store.taskCount) * 100) : 0;
            const remaining = store.taskCount - store.taskDoneCount;

            return (
              <div
                key={store.id}
                className="store-card"
                style={{ borderLeftColor: meta.border }}
                // ③修正: カード全体クリック → useRouter で遷移
                onClick={() => router.push(`/stores/${store.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/stores/${store.id}`)}
              >
                {/* 上段 */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', marginBottom: 10, gap: 8,
                }}>
                  {/* 左: バッジ + 店舗名 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      flexWrap: 'wrap', marginBottom: 4,
                    }}>
                      {/* フェーズバッジ */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 99,
                        background: meta.badge, color: meta.badgeText,
                        fontSize: 12, fontWeight: 800,
                        border: `1px solid ${meta.border}66`,
                        flexShrink: 0,
                      }}>
                        {meta.icon} {store.currentPhase}
                      </span>

                      {/* 待ち状態バッジ */}
                      {store.whoWaiting !== 'none' && store.whoWaiting !== '' && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: store.whoWaiting === 'owner' ? '#fef2f2' : '#eff6ff',
                          color:      store.whoWaiting === 'owner' ? '#dc2626'  : '#1d4ed8',
                          border: `1px solid ${store.whoWaiting === 'owner' ? '#fecaca' : '#bfdbfe'}`,
                          flexShrink: 0,
                        }}>
                          {store.whoWaiting === 'owner' ? '👤 オーナー待ち' : '🔧 担当者待ち'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-text)', lineHeight: 1.3 }}>
                      {store.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-sub)', marginTop: 2 }}>
                      {store.location ? `${store.location}　` : ''}{store.contactName ? `担当: ${store.contactName}　` : ''}期限: {store.deadline}
                    </div>
                  </div>

                  {/* 右: ユーザー側リンク（stopPropagation で独立） */}
                  <Link
                    href={`/owner/${store.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600,
                      color: meta.color,
                      background: meta.badge,
                      border: `1px solid ${meta.border}88`,
                      padding: '5px 10px', borderRadius: 8,
                      textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ユーザー側 →
                  </Link>
                </div>

                {/* 下段: プログレスバー */}
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 5,
                  }}>
                    <span>
                      {store.taskDoneCount}/{store.taskCount} 完了
                      {remaining > 0 && (
                        <span style={{ marginLeft: 6, color: meta.color, fontWeight: 700 }}>
                          あと {remaining} 件
                        </span>
                      )}
                    </span>
                    <span style={{ fontWeight: 700, color: meta.color }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${progress}%`,
                      background: meta.border, borderRadius: 99,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
