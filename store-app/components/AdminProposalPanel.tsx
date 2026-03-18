'use client';

import { useState, useEffect } from 'react';
import {
  PROPOSALS,
  CATEGORY_META,
  type ProposalCategory,
  type Proposal,
} from '@/lib/proposals';
import { type Phase } from '@/lib/data';

// ─── 相談型定義 ───────────────────────────────────────────────────────────────

type ConsultationRow = {
  id: string;
  title: string;
  message: string;
  status: string;
  answer: string;
  consultationCategory: string;
  createdAt: string;
  updatedAt: string;
};

// ─── 相談ステータス ───────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  open:     { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  answered: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  closed:   { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
};

const STATUS_LABEL: Record<string, string> = {
  open: '未対応', answered: '回答済み', closed: 'クローズ',
};

// ─── コンポーネント ────────────────────────────────────────────────────────────

export default function AdminProposalPanel({
  storeId,
  currentPhase,
}: {
  storeId: string;
  currentPhase: Phase;
}) {
  const [activeSection, setActiveSection] = useState<'提案' | '相談'>('提案');
  const [filterCategory, setFilterCategory] = useState<ProposalCategory | 'すべて'>('すべて');
  const [tasked, setTasked] = useState<Set<number>>(new Set());
  const [tasking, setTasking] = useState<number | null>(null);

  // 相談データ state
  const [consults, setConsults] = useState<ConsultationRow[]>([]);
  const [loadingConsults, setLoadingConsults] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [answering, setAnswering] = useState(false);

  const CATEGORIES: (ProposalCategory | 'すべて')[] = ['すべて', 'next', 'good', 'consult'];

  const filtered = filterCategory === 'すべて'
    ? PROPOSALS
    : PROPOSALS.filter((p) => p.category === filterCategory);

  // 現在フェーズを上に、その中で category順（next→good→consult）
  const CAT_ORDER: ProposalCategory[] = ['next', 'good', 'consult'];
  const sorted = [...filtered].sort((a, b) => {
    if (a.phase === currentPhase && b.phase !== currentPhase) return -1;
    if (b.phase === currentPhase && a.phase !== currentPhase) return 1;
    return CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
  });

  // activeSection が '相談' に変わったタイミングで fetch
  useEffect(() => {
    if (activeSection !== '相談') return;
    setLoadingConsults(true);
    fetch(`/api/stores/${storeId}/consultations`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setConsults(Array.isArray(data) ? data : []))
      .catch(() => setConsults([]))
      .finally(() => setLoadingConsults(false));
  }, [activeSection, storeId]);

  const addAsTask = async (proposal: Proposal) => {
    if (tasked.has(proposal.id) || tasking !== null) return;
    setTasking(proposal.id);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          title: proposal.title,
          phase: proposal.phase,
          done: false,
        }),
      });
      if (!res.ok) throw new Error();
      setTasked((prev) => new Set([...prev, proposal.id]));
    } finally {
      setTasking(null);
    }
  };

  const submitAnswer = async (consultId: string) => {
    const answer = answerText[consultId]?.trim();
    if (!answer || answering) return;
    setAnswering(true);
    try {
      const res = await fetch(`/api/consultations/${consultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, status: 'answered' }),
      });
      if (!res.ok) throw new Error();
      setConsults((prev) =>
        prev.map((c) =>
          c.id === consultId ? { ...c, answer, status: 'answered' } : c
        )
      );
      setAnsweringId(null);
      setAnswerText((prev) => { const n = { ...prev }; delete n[consultId]; return n; });
    } catch {
      console.error('返答の送信に失敗しました');
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div>
      {/* セクション切り替え */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)', marginBottom: 20 }}>
        {(['提案', '相談'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            style={{
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeSection === s ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeSection === s ? 'var(--color-accent)' : 'var(--color-text-sub)',
              fontSize: 14,
              fontWeight: activeSection === s ? 700 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.15s',
            }}
          >
            {s === '提案' ? `提案一覧（${PROPOSALS.length}件）` : `相談一覧（${consults.length}件）`}
          </button>
        ))}
      </div>

      {/* ─── 提案一覧 ─── */}
      {activeSection === '提案' && (
        <div>
          {/* カテゴリサマリーカード */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {(['next', 'good', 'consult'] as ProposalCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const count = PROPOSALS.filter((p) => p.category === cat).length;
              const currentCount = PROPOSALS.filter((p) => p.category === cat && p.phase === currentPhase).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? 'すべて' : cat)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 10,
                    border: `1px solid ${filterCategory === cat ? meta.color : meta.border}`,
                    background: filterCategory === cat ? meta.bg : 'white',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'all 0.15s',
                    boxShadow: filterCategory === cat ? `0 0 0 2px ${meta.border}` : 'none',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{meta.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginBottom: 2 }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: meta.color }}>
                    {count}
                    <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>件</span>
                  </div>
                  {currentCount > 0 && (
                    <div style={{
                      fontSize: 10, marginTop: 3,
                      color: 'var(--color-text-sub)',
                    }}>
                      現在フェーズ {currentCount}件
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* フィルタバー */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>絞り込み：</span>
            {CATEGORIES.map((cat) => {
              const isActive = filterCategory === cat;
              const meta = cat !== 'すべて' ? CATEGORY_META[cat] : null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 99,
                    border: `1px solid ${isActive ? (meta?.color ?? 'var(--color-accent)') : 'var(--color-border)'}`,
                    background: isActive ? (meta?.bg ?? 'var(--color-accent-light)') : 'transparent',
                    color: isActive ? (meta?.color ?? 'var(--color-accent)') : 'var(--color-text-sub)',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  {meta && <span>{meta.icon}</span>}
                  {cat === 'すべて' ? 'すべて' : meta?.label}
                </button>
              );
            })}
          </div>

          {/* 提案カード一覧 */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {sorted.map((proposal) => {
              const meta = CATEGORY_META[proposal.category];
              const isCurrentPhase = proposal.phase === currentPhase;
              const isTasked = tasked.has(proposal.id);
              const isTasking = tasking === proposal.id;

              return (
                <div
                  key={proposal.id}
                  style={{
                    background: 'white',
                    border: `1px solid ${isCurrentPhase ? meta.border : 'var(--color-border)'}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    boxShadow: isCurrentPhase ? `0 0 0 3px ${meta.bg}` : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* ヘッダー行 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                      {/* カテゴリバッジ */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 99,
                        background: meta.bg, border: `1px solid ${meta.border}`,
                        color: meta.color, fontSize: 11, fontWeight: 700,
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                      {/* フェーズバッジ */}
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99,
                        background: isCurrentPhase ? meta.bg : '#f3f4f6',
                        color: isCurrentPhase ? meta.color : '#6b7280',
                        fontWeight: isCurrentPhase ? 700 : 400,
                        border: `1px solid ${isCurrentPhase ? meta.border : '#e5e7eb'}`,
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {isCurrentPhase && '📍 '}{proposal.phase}
                      </span>
                    </div>

                    {/* タスク化ボタン */}
                    {isTasked ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '5px 12px', borderRadius: 6, flexShrink: 0,
                        background: '#ecfdf5', border: '1px solid #a7f3d0',
                        color: '#065f46', fontSize: 12, fontWeight: 700,
                        whiteSpace: 'nowrap' as const,
                      }}>
                        ✓ タスク化済み
                      </span>
                    ) : (
                      <button
                        onClick={() => addAsTask(proposal)}
                        disabled={isTasking || tasking !== null}
                        style={{
                          padding: '5px 12px', borderRadius: 6, flexShrink: 0,
                          border: '1px solid var(--color-accent)',
                          background: isTasking ? 'var(--color-accent-light)' : 'white',
                          color: 'var(--color-accent)',
                          fontSize: 12, fontWeight: 700,
                          cursor: isTasking || tasking !== null ? 'not-allowed' : 'pointer',
                          opacity: tasking !== null && !isTasking ? 0.5 : 1,
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {isTasking ? '追加中...' : '+ タスクに追加'}
                      </button>
                    )}
                  </div>

                  {/* タイトル */}
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                    {proposal.title}
                  </p>

                  {/* オーナー向け理由 */}
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 6, padding: '8px 12px', marginBottom: 6,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                      オーナー向けの説明
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {proposal.reason}
                    </p>
                  </div>

                  {/* 管理者メモ */}
                  <div style={{
                    background: meta.bg, border: `1px solid ${meta.border}`,
                    borderRadius: 6, padding: '8px 12px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginBottom: 3 }}>
                      管理者メモ
                    </p>
                    <p style={{ fontSize: 13, color: meta.color, lineHeight: 1.6, opacity: 0.9 }}>
                      {proposal.adminNote}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {sorted.length === 0 && (
            <p style={{ textAlign: 'center' as const, fontSize: 14, color: 'var(--color-text-sub)', padding: '24px 0' }}>
              該当する提案はありません
            </p>
          )}

          {tasked.size > 0 && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-sub)', textAlign: 'right' as const }}>
              {tasked.size}件をタスクに追加しました。「タスク」タブで確認できます。
            </p>
          )}
        </div>
      )}

      {/* ─── 相談一覧 ─── */}
      {activeSection === '相談' && (
        <div>
          {loadingConsults ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  height: 80, borderRadius: 10,
                  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                }} />
              ))}
            </div>
          ) : (
            <>
              {/* サマリーカード */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {(['open', 'answered', 'closed'] as const).map((status) => {
                  const count = consults.filter((c) => c.status === status).length;
                  const s = STATUS_STYLE[status];
                  return (
                    <div key={status} style={{
                      padding: '12px',
                      borderRadius: 10,
                      border: `1px solid ${s.border}`,
                      background: s.bg,
                      textAlign: 'center' as const,
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.text }}>{count}</div>
                      <div style={{ fontSize: 11, color: s.text, fontWeight: 700 }}>{STATUS_LABEL[status]}</div>
                    </div>
                  );
                })}
              </div>

              {/* 相談カード */}
              {consults.length === 0 ? (
                <p style={{ textAlign: 'center' as const, fontSize: 14, color: 'var(--color-text-sub)', padding: '24px 0' }}>
                  相談はありません
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {consults.map((c) => {
                    const s = STATUS_STYLE[c.status] ?? STATUS_STYLE['open'];
                    const statusLabel = STATUS_LABEL[c.status] ?? c.status;
                    const isAnswering = answeringId === c.id;
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: 'white',
                          border: '1px solid var(--color-border)',
                          borderRadius: 10,
                          padding: '14px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-sub)' }}>
                            {new Date(c.createdAt).toLocaleDateString('ja-JP')}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                            background: s.bg, color: s.text, border: `1px solid ${s.border}`,
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                          {c.title}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: c.answer ? 8 : 0 }}>
                          {c.message}
                        </p>
                        {c.answer && (
                          <div style={{
                            padding: '8px 12px', borderRadius: 6,
                            background: '#f0f9ff', border: '1px solid #bae6fd',
                            marginTop: 8,
                          }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 3 }}>
                              返答内容
                            </p>
                            <p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6 }}>
                              {c.answer}
                            </p>
                          </div>
                        )}

                        {/* 返答フォーム */}
                        {c.status !== 'answered' && c.status !== 'closed' && (
                          <div style={{ marginTop: 10 }}>
                            {!isAnswering ? (
                              <button
                                onClick={() => setAnsweringId(c.id)}
                                style={{
                                  padding: '6px 14px', borderRadius: 6,
                                  border: '1px solid var(--color-accent)',
                                  background: 'var(--color-accent-light, #eff6ff)',
                                  color: 'var(--color-accent)',
                                  fontSize: 12, fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                返答する
                              </button>
                            ) : (
                              <div style={{ marginTop: 8 }}>
                                <textarea
                                  value={answerText[c.id] ?? ''}
                                  onChange={(e) => setAnswerText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                  placeholder="返答内容を入力してください"
                                  rows={3}
                                  style={{
                                    width: '100%', border: '1px solid var(--color-border)', borderRadius: 6,
                                    padding: '7px 10px', fontSize: 13, resize: 'vertical' as const,
                                    outline: 'none', background: 'white', fontFamily: 'inherit',
                                    lineHeight: 1.6, boxSizing: 'border-box' as const,
                                  }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setAnsweringId(null)}
                                    style={{
                                      padding: '5px 12px', borderRadius: 6, fontSize: 12,
                                      border: '1px solid var(--color-border)', background: 'white',
                                      color: 'var(--color-text-sub)', cursor: 'pointer',
                                    }}
                                  >
                                    キャンセル
                                  </button>
                                  <button
                                    onClick={() => submitAnswer(c.id)}
                                    disabled={!answerText[c.id]?.trim() || answering}
                                    style={{
                                      padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                      border: 'none',
                                      background: answerText[c.id]?.trim() && !answering ? '#2563eb' : '#93c5fd',
                                      color: 'white',
                                      cursor: answerText[c.id]?.trim() && !answering ? 'pointer' : 'not-allowed',
                                    }}
                                  >
                                    {answering ? '送信中...' : '送信する'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
