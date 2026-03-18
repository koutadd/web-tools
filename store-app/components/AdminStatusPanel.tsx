'use client';

import { useState, useEffect } from 'react';
import { CHECKLIST_ITEMS, getDeadlineMeta } from '@/lib/checklist';
import { PROPOSALS, CATEGORY_META } from '@/lib/proposals';
import { type Phase } from '@/lib/data';
import {
  getEventLog, countEvents, countByItem,
  type LogEvent, type LogEventName,
} from '@/lib/log';

// ─── 候補データ ───────────────────────────────────────────────────────────────

type CandidateStatus = 'おすすめ' | '検討中' | '見送り' | '確認中';
type Candidate = {
  id: number; type: string; name: string; price: string;
  pros: string[]; cons: string[]; status: CandidateStatus; note?: string;
};

const CANDIDATES: Candidate[] = [
  {
    id: 1, type: '撮影外注', name: 'フォトグラファー A',
    price: '¥50,000 / 回',
    pros: ['3日以内納品', 'アイケア実績あり', 'レタッチ込み'],
    cons: ['費用が高め'],
    status: 'おすすめ',
    note: '眼科サイト3件実績あり。仕上がりのクオリティが高め。',
  },
  {
    id: 2, type: '撮影外注', name: 'フォトグラファー B',
    price: '¥28,000 / 回',
    pros: ['コスト低め', '対応が早い'],
    cons: ['納品1週間', 'アイケア実績なし'],
    status: '検討中',
  },
  {
    id: 3, type: '予約システム', name: 'LINE公式予約',
    price: '月額 ¥3,000〜',
    pros: ['既存LINEと連携', '操作が簡単', '通知自動送信'],
    cons: ['カスタマイズ制限あり'],
    status: 'おすすめ',
    note: 'オーナーがLINE公式をお持ちの場合に最適。',
  },
  {
    id: 4, type: '予約システム', name: 'ホットペッパー連携',
    price: '既存契約内',
    pros: ['追加費用なし（既存HP利用時）', '知名度が高い'],
    cons: ['HP利用料が別途かかる', '掲載条件あり'],
    status: '確認中',
  },
];

const STATUS_BADGE: Record<CandidateStatus, { bg: string; text: string; border: string }> = {
  おすすめ: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  検討中:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  見送り:   { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
  確認中:   { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
};

// ─── ログサマリ ───────────────────────────────────────────────────────────────

function LogSummaryBlock() {
  const [log, setLog] = useState<LogEvent[]>([]);

  useEffect(() => {
    setLog(getEventLog());
  }, []);

  const counts: Record<LogEventName, number> = {
    required_item_opened:  countEvents('required_item_opened', log),
    required_item_started: countEvents('required_item_started', log),
    consultation_opened:   countEvents('consultation_opened', log),
    consultation_created:  countEvents('consultation_created', log),
    photo_guide_viewed:    countEvents('photo_guide_viewed', log),
    task_completed:        countEvents('task_completed', log),
  };

  const consultByItem = countByItem('consultation_created', log);
  const topConsult    = Object.entries(consultByItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const photoByItem = countByItem('photo_guide_viewed', log);
  const topPhoto    = Object.entries(photoByItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const rows: { label: string; count: number; color: string }[] = [
    { label: '相談発生',             count: counts.consultation_created,  color: '#1d4ed8' },
    { label: '提出開始',             count: counts.required_item_started, color: '#065f46' },
    { label: '撮影ガイド確認',       count: counts.photo_guide_viewed,    color: '#7c3aed' },
    { label: 'タスク完了',           count: counts.task_completed,        color: '#059669' },
  ];

  return (
    <div style={{
      background: 'white', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: 12, letterSpacing: 0.3 }}>
        📊 ログサマリ（セッション累計）
      </p>

      {/* イベントカウント */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {rows.map((r) => (
          <div key={r.label} style={{
            padding: '8px 10px', borderRadius: 8,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>{r.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: r.color }}>{r.count}</span>
          </div>
        ))}
      </div>

      {/* 相談が多い項目 */}
      {topConsult.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
            相談が多い項目
          </p>
          {topConsult.map(([title, count]) => (
            <div key={title} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, padding: '3px 0',
              borderBottom: '1px solid #f3f4f6',
            }}>
              <span style={{ color: 'var(--color-text)', flex: 1, marginRight: 8 }}>{title}</span>
              <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{count}件</span>
            </div>
          ))}
        </div>
      )}

      {/* 撮影ガイドが多く見られた項目 */}
      {topPhoto.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>
            撮影ガイドの閲覧が多い項目
          </p>
          {topPhoto.map(([title, count]) => (
            <div key={title} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, padding: '3px 0',
              borderBottom: '1px solid #f3f4f6',
            }}>
              <span style={{ color: 'var(--color-text)', flex: 1, marginRight: 8 }}>{title}</span>
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>{count}件</span>
            </div>
          ))}
        </div>
      )}

      {log.length === 0 && (
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' as const }}>
          ログデータがありません
        </p>
      )}
    </div>
  );
}

// ─── コンポーネント本体 ────────────────────────────────────────────────────────

export default function AdminStatusPanel({
  currentPhase,
  deadline,
}: {
  storeId: string;
  currentPhase: Phase;
  storeName: string;
  deadline: string;
}) {
  const [activeTab, setActiveTab] = useState<'状況' | '不足情報' | '候補' | 'ログ'>('状況');
  const [candidateFilter, setCandidateFilter] = useState<string>('すべて');

  const ownerPending = CHECKLIST_ITEMS.filter(
    (c) => c.phase === currentPhase && c.assignee === 'オーナー' && c.status === '未提出'
  );
  const isOwnerWaiting = ownerPending.length > 0;

  const allPending = CHECKLIST_ITEMS.filter(
    (c) => c.assignee === 'オーナー' && c.status === '未提出'
  );

  const nextProposals = PROPOSALS.filter(
    (p) => p.phase === currentPhase && p.category === 'next'
  );

  const dl = getDeadlineMeta(deadline);

  const candidateTypes = ['すべて', ...Array.from(new Set(CANDIDATES.map((c) => c.type)))];
  const filteredCandidates = candidateFilter === 'すべて'
    ? CANDIDATES
    : CANDIDATES.filter((c) => c.type === candidateFilter);

  const TABS: ('状況' | '不足情報' | '候補' | 'ログ')[] = ['状況', '不足情報', '候補', 'ログ'];

  return (
    <div>
      {/* タブ */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '2px solid var(--color-border)', marginBottom: 20,
        overflowX: 'auto' as const,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none', whiteSpace: 'nowrap' as const,
              borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-sub)',
              fontSize: 14, fontWeight: activeTab === tab ? 700 : 400,
              cursor: 'pointer', marginBottom: '-2px', transition: 'all 0.15s',
            }}
          >
            {tab}
            {tab === '不足情報' && allPending.length > 0 && (
              <span style={{
                marginLeft: 4, fontSize: 10, fontWeight: 800,
                padding: '1px 5px', borderRadius: 99,
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              }}>
                {allPending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 状況タブ ── */}
      {activeTab === '状況' && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

          {/* 誰待ちカード */}
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: isOwnerWaiting ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${isOwnerWaiting ? '#fecaca' : '#bfdbfe'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 26 }}>{isOwnerWaiting ? '⏳' : '🔧'}</span>
            <div>
              <p style={{
                fontSize: 14, fontWeight: 700,
                color: isOwnerWaiting ? '#dc2626' : '#1d4ed8',
              }}>
                {isOwnerWaiting ? 'オーナー対応待ち' : '管理者作業中'}
              </p>
              <p style={{
                fontSize: 12, lineHeight: 1.6,
                color: isOwnerWaiting ? '#991b1b' : '#1e40af',
              }}>
                {isOwnerWaiting
                  ? `${ownerPending.map((i) => i.title).join('、')} の提出をお待ちしています`
                  : '担当者がサイト制作・確認を進めています'}
              </p>
            </div>
          </div>

          {/* 期限カード */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: dl.bg, border: `1px solid ${dl.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 11, color: dl.color, fontWeight: 700, marginBottom: 2 }}>納期</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: dl.color }}>{deadline}</p>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 99,
              background: (dl.label === '余裕あり') ? '#10b981' : '#dc2626',
              color: 'white',
            }}>
              {dl.label}
            </span>
          </div>

          {/* 今フェーズで次にやること */}
          {nextProposals.length > 0 && (
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'white', border: '1px solid var(--color-border)',
            }}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)',
                marginBottom: 10, letterSpacing: 0.3,
              }}>
                📍 現フェーズ（{currentPhase}）の次アクション
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {nextProposals.map((p) => {
                  const meta = CATEGORY_META[p.category];
                  return (
                    <div key={p.id} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: meta.bg, border: `1px solid ${meta.border}`,
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                        {p.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                        管理者メモ：{p.adminNote}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 今止まっている理由（オーナー依頼中項目詳細） */}
          {isOwnerWaiting && (
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'white', border: '1px solid #fecaca',
            }}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: '#dc2626',
                marginBottom: 10, letterSpacing: 0.3,
              }}>
                🔴 オーナーに依頼中の項目
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {ownerPending.map((item) => {
                  const dl2 = item.deadline ? getDeadlineMeta(item.deadline) : null;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 6,
                      background: '#fef2f2', border: '1px solid #fecaca',
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                          {item.title}
                        </p>
                        {item.deadline && (
                          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                            期限：{item.deadline}
                          </p>
                        )}
                      </div>
                      {dl2 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                          background: dl2.bg, color: dl2.color, border: `1px solid ${dl2.border}`,
                          whiteSpace: 'nowrap' as const,
                        }}>
                          {dl2.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 不足情報タブ ── */}
      {activeTab === '不足情報' && (
        <div>
          {allPending.length === 0 ? (
            <div style={{
              textAlign: 'center' as const, padding: '32px 0',
              color: '#065f46', fontSize: 14, fontWeight: 600,
            }}>
              ✅ 不足情報はありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {allPending.map((item) => {
                const dl2 = item.deadline ? getDeadlineMeta(item.deadline) : null;
                return (
                  <div key={item.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'white', border: '1px solid #fecaca',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                            background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
                          }}>
                            {item.phase}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                            {item.title}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--color-text-sub)', lineHeight: 1.5 }}>
                          {item.reason}
                        </p>
                      </div>
                      {dl2 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                          background: dl2.bg, color: dl2.color, border: `1px solid ${dl2.border}`,
                          flexShrink: 0, whiteSpace: 'nowrap' as const,
                        }}>
                          {dl2.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 候補タブ ── */}
      {activeTab === '候補' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {candidateTypes.map((t) => {
              const isActive = candidateFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setCandidateFilter(t)}
                  style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12,
                    border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isActive ? 'var(--color-accent-light)' : 'transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-sub)',
                    fontWeight: isActive ? 700 : 400, transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12,
          }}>
            {filteredCandidates.map((c) => {
              const sb = STATUS_BADGE[c.status];
              return (
                <div key={c.id} style={{
                  background: 'white',
                  border: `2px solid ${c.status === 'おすすめ' ? '#a7f3d0' : 'var(--color-border)'}`,
                  borderRadius: 12, padding: '14px',
                  boxShadow: c.status === 'おすすめ' ? '0 2px 8px rgba(16,185,129,0.1)' : 'none',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
                    }}>
                      {c.type}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: sb.bg, color: sb.text, border: `1px solid ${sb.border}`,
                    }}>
                      {c.status}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
                    {c.name}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
                    {c.price}
                  </p>

                  {c.note && (
                    <p style={{
                      fontSize: 11, color: '#065f46', lineHeight: 1.5, marginBottom: 8,
                      padding: '6px 8px', borderRadius: 6,
                      background: '#ecfdf5', border: '1px solid #a7f3d0',
                    }}>
                      {c.note}
                    </p>
                  )}

                  <div style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#065f46', marginBottom: 3 }}>
                      ✓ メリット
                    </p>
                    {c.pros.map((p, i) => (
                      <p key={i} style={{ fontSize: 12, color: 'var(--color-text)', paddingLeft: 10 }}>
                        · {p}
                      </p>
                    ))}
                  </div>

                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', marginBottom: 3 }}>
                      △ 注意点
                    </p>
                    {c.cons.map((con, i) => (
                      <p key={i} style={{ fontSize: 12, color: 'var(--color-text)', paddingLeft: 10 }}>
                        · {con}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ログタブ ── */}
      {activeTab === 'ログ' && <LogSummaryBlock />}
    </div>
  );
}
