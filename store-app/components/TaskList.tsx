'use client';

import { useState } from 'react';
import { PHASES, type Task, type Phase } from '@/lib/data';
import { logEvent } from '@/lib/log';

const PHASE_META: Record<Phase, { color: string; bg: string; border: string; icon: string }> = {
  企画:     { color: '#7c3aed', bg: '#f5f3ff', border: '#a78bfa', icon: '💡' },
  デザイン: { color: '#c2410c', bg: '#fff7ed', border: '#fb923c', icon: '🎨' },
  制作:     { color: '#065f46', bg: '#ecfdf5', border: '#34d399', icon: '🔧' },
  納品:     { color: '#1d4ed8', bg: '#eff6ff', border: '#60a5fa', icon: '🚀' },
};

const TASK_CSS = `
  @keyframes taskComplete {
    0%   { opacity: 1; transform: translateX(0); }
    60%  { opacity: 0.4; transform: translateX(8px); }
    100% { opacity: 0; transform: translateX(0); }
  }
  @keyframes checkPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  @keyframes phaseAdvance {
    0%   { opacity: 0; transform: translateY(-8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .task-completing { animation: taskComplete 0.32s ease-in forwards; }
  .checkbox-pop    { animation: checkPop 0.2s ease-out; }
  .phase-advance-banner { animation: phaseAdvance 0.3s ease-out; }
`;

export default function TaskList({
  initialTasks,
  storeId,
  currentPhase,
  onPhaseAdvance,
}: {
  initialTasks: Task[];
  storeId: string;
  currentPhase: Phase;
  onPhaseAdvance?: (next: Phase) => void;
}) {
  const [tasks, setTasks]           = useState<Task[]>(initialTasks);
  const [filter, setFilter]         = useState<Phase | 'すべて'>('すべて');
  const [newTitle, setNewTitle]     = useState('');
  const [newPhase, setNewPhase]     = useState<Phase>(currentPhase);
  const [adding, setAdding]         = useState(false);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [popping, setPopping]       = useState<Set<string>>(new Set());
  const [showDone, setShowDone]     = useState(false);
  // アコーディオン展開
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // フェーズ自動昇格の通知
  const [advanceMsg, setAdvanceMsg] = useState<string | null>(null);

  // ─── タスク toggle + フェーズ自動進行 ─────────────────────────────────────
  const toggle = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target || completing.has(id)) return;
    const newDone = !target.done;

    if (newDone) {
      setPopping((p) => new Set([...p, id]));
      setTimeout(() => setPopping((p) => { const n = new Set(p); n.delete(id); return n; }), 200);

      setCompleting((p) => new Set([...p, id]));
      setTimeout(() => {
        setTasks((prev) => {
          const next = prev.map((t) => t.id === id ? { ...t, done: true } : t);

          // ① フェーズ自動進行チェック
          const phaseIdx = PHASES.indexOf(currentPhase);
          if (phaseIdx < PHASES.length - 1) {
            const phaseTasks = next.filter((t) => t.phase === currentPhase);
            if (phaseTasks.length > 0 && phaseTasks.every((t) => t.done)) {
              const nextPhase = PHASES[phaseIdx + 1];
              // 少し遅延してから通知（アニメーション終了後）
              setTimeout(() => {
                setAdvanceMsg(`${currentPhase} → ${nextPhase} に自動昇格しました 🎉`);
                onPhaseAdvance?.(nextPhase);
                setTimeout(() => setAdvanceMsg(null), 4000);
              }, 400);
            }
          }
          return next;
        });
        setCompleting((p) => { const n = new Set(p); n.delete(id); return n; });
      }, 280);
      logEvent('task_completed', { itemId: id, itemTitle: target.title });
    } else {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: false } : t));
    }

    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone }),
    }).catch(() => {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !newDone } : t));
    });
  };

  const deleteTask = (id: string) => {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => setTasks(prev));
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, title, phase: newPhase, done: false }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTasks((prev) => [
        ...prev,
        { id: created.id, title: created.title, done: created.done, phase: created.phase as Phase },
      ]);
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => prev === id ? null : id);
  };

  // ─── フェーズ進行状況 ────────────────────────────────────────────────────
  const currentPhaseTasks   = tasks.filter((t) => t.phase === currentPhase);
  const currentPhaseDone    = currentPhaseTasks.filter((t) => t.done).length;
  const currentPhaseRemain  = currentPhaseTasks.length - currentPhaseDone;
  const phaseProgress       = currentPhaseTasks.length > 0
    ? Math.round((currentPhaseDone / currentPhaseTasks.length) * 100) : 0;
  const phaseComplete       = currentPhaseTasks.length > 0 && currentPhaseRemain === 0;
  const nextPhase           = PHASES[PHASES.indexOf(currentPhase) + 1];
  const meta                = PHASE_META[currentPhase];

  // ─── 表示リスト ──────────────────────────────────────────────────────────
  const allFiltered  = filter === 'すべて' ? tasks : tasks.filter((t) => t.phase === filter);
  const pendingTasks = allFiltered.filter((t) => !t.done);
  const doneTasks    = allFiltered.filter((t) => t.done);
  const totalDone    = tasks.filter((t) => t.done).length;
  const progress     = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  return (
    <div>
      <style>{TASK_CSS}</style>

      {/* ─── フェーズ自動昇格通知 ─── */}
      {advanceMsg && (
        <div className="phase-advance-banner" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10, marginBottom: 12,
          background: '#ecfdf5', border: '1px solid #6ee7b7',
        }}>
          <span style={{ fontSize: 18 }}>🚀</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>{advanceMsg}</span>
        </div>
      )}

      {/* ─── ③ フェーズ進行バナー ─── */}
      <div style={{
        padding: '12px 14px', borderRadius: 10, marginBottom: 14,
        background: phaseComplete ? '#ecfdf5' : meta.bg,
        border: `1px solid ${phaseComplete ? '#6ee7b7' : meta.border}66`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>
            {meta.icon} {currentPhase}フェーズの進行状況
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: meta.color }}>
            {currentPhaseDone}/{currentPhaseTasks.length}
          </span>
        </div>
        <div style={{ height: 5, background: `${meta.border}33`, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', width: `${phaseProgress}%`,
            background: meta.border, borderRadius: 99,
            transition: 'width 0.45s ease',
          }} />
        </div>
        <p style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
          {phaseComplete
            ? nextPhase
              ? `✅ ${currentPhase}完了！次は${nextPhase}フェーズです`
              : '✅ 全フェーズ完了！'
            : nextPhase
              ? `あと ${currentPhaseRemain} 件完了で ${nextPhase} フェーズへ進みます`
              : `あと ${currentPhaseRemain} 件で完了`
          }
        </p>
      </div>

      {/* ─── 全体進捗バー ─── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 4,
        }}>
          <span>全体進捗</span>
          <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
            {progress}%（{totalDone}/{tasks.length}件完了）
          </span>
        </div>
        <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
            borderRadius: 99, transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* ─── フィルタタブ ─── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14,
        overflowX: 'auto', scrollbarWidth: 'none',
        flexWrap: 'nowrap',
      }}>
        {(['すべて', ...PHASES] as const).map((f) => {
          const isActive = filter === f;
          const count    = f === 'すべて'
            ? tasks.filter((t) => !t.done).length
            : tasks.filter((t) => t.phase === f && !t.done).length;
          const fmeta    = f === 'すべて' ? null : PHASE_META[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                border: `1.5px solid ${isActive ? (fmeta?.border ?? '#2563eb') : '#e5e7eb'}`,
                background: isActive ? (fmeta?.bg ?? '#eff6ff') : 'white',
                color: isActive ? (fmeta?.color ?? '#1d4ed8') : 'var(--color-text-sub)',
                fontSize: 12, fontWeight: isActive ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.12s',
              }}
            >
              {f}（{count}）
            </button>
          );
        })}
      </div>

      {/* ─── ④ 未完了タスク（アコーディオン）─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {pendingTasks.length === 0 && doneTasks.length === 0 && (
          <p style={{ color: 'var(--color-text-sub)', fontSize: 14, padding: '8px 0' }}>タスクがありません</p>
        )}
        {pendingTasks.length === 0 && doneTasks.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 8,
            background: '#ecfdf5', border: '1px solid #a7f3d0',
          }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>
              このフィルターのタスクはすべて完了！
            </span>
          </div>
        )}

        {pendingTasks.map((task) => {
          const isCompleting = completing.has(task.id);
          const isPopping    = popping.has(task.id);
          const isExpanded   = expandedId === task.id;
          const tmeta        = PHASE_META[task.phase];

          return (
            <div
              key={task.id}
              className={isCompleting ? 'task-completing' : undefined}
              style={{
                background: 'white',
                border: `1px solid ${isExpanded ? tmeta.border : '#e5e7eb'}`,
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
                boxShadow: isExpanded ? `0 2px 10px ${tmeta.border}33` : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* ── 常時表示行 ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
              }}>
                {/* チェックボックス */}
                <div
                  onClick={(e) => { e.stopPropagation(); toggle(task.id); }}
                  className={isPopping ? 'checkbox-pop' : undefined}
                  style={{
                    width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                    border: isCompleting ? `2px solid ${tmeta.border}` : '2px solid #d1d5db',
                    background: isCompleting ? tmeta.border : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {isCompleting && (
                    <svg width="12" height="12" viewBox="0 0 11 11" fill="none" stroke="white"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1.5,5.5 4,8.5 9.5,2.5" />
                    </svg>
                  )}
                </div>

                {/* タスク名（クリックで展開） */}
                <span
                  onClick={() => toggleExpand(task.id)}
                  style={{
                    flex: 1, fontSize: 14, fontWeight: 500,
                    color: 'var(--color-text)', lineHeight: 1.4,
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {task.title}
                </span>

                {/* フェーズバッジ */}
                <span style={{
                  padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                  background: tmeta.bg, color: tmeta.color,
                  fontSize: 10, fontWeight: 700,
                  border: `1px solid ${tmeta.border}66`,
                }}>
                  {tmeta.icon} {task.phase}
                </span>

                {/* 展開トグル */}
                <button
                  onClick={() => toggleExpand(task.id)}
                  style={{
                    width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                    border: 'none', background: isExpanded ? '#f1f5f9' : 'transparent',
                    color: '#9ca3af', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.12s',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    fontSize: 10,
                  }}>▶</span>
                </button>
              </div>

              {/* ── 展開パネル ── */}
              <div style={{
                maxHeight: isExpanded ? '160px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.25s ease-out',
              }}>
                <div style={{
                  padding: '0 14px 14px',
                  borderTop: `1px solid ${tmeta.border}44`,
                }}>
                  <div style={{ height: 10 }} />

                  {/* フェーズ情報 */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                    padding: '8px 12px', borderRadius: 8, background: tmeta.bg,
                  }}>
                    <span style={{ fontSize: 16 }}>{tmeta.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, color: tmeta.color, fontWeight: 700 }}>
                        {task.phase}フェーズのタスク
                      </p>
                      <p style={{ fontSize: 11, color: tmeta.color, opacity: 0.75 }}>
                        このタスクを完了すると{task.phase}フェーズが進みます
                      </p>
                    </div>
                  </div>

                  {/* アクション行 */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { toggle(task.id); setExpandedId(null); }}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        background: tmeta.border, color: 'white',
                        border: 'none', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 5,
                      }}
                    >
                      ✓ 完了にする
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: '#fef2f2', color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 完了済みタスク（折りたたみ）─── */}
      {doneTasks.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={() => setShowDone((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              fontSize: 12, color: 'var(--color-text-sub)', padding: '4px 0',
              cursor: 'pointer',
            }}
          >
            <span style={{
              display: 'inline-block', fontSize: 9,
              transform: showDone ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 0.15s',
            }}>▶</span>
            完了済み {doneTasks.length}件
          </button>

          <div style={{
            maxHeight: showDone ? `${doneTasks.length * 52}px` : '0',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease-out',
            marginTop: showDone ? 6 : 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {doneTasks.map((task) => {
                const tmeta = PHASE_META[task.phase];
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', opacity: 0.6,
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: 8,
                  }}>
                    <div
                      onClick={() => toggle(task.id)}
                      style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${tmeta.border}`,
                        background: tmeta.border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1.5,5.5 4,8.5 9.5,2.5" />
                      </svg>
                    </div>
                    <span style={{
                      flex: 1, fontSize: 13,
                      color: 'var(--color-text-sub)', textDecoration: 'line-through',
                    }}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                        border: '1px solid #e5e7eb', background: 'transparent',
                        color: '#d1d5db', fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── タスク追加フォーム ─── */}
      <form
        onSubmit={addTask}
        style={{
          marginTop: 14, padding: '12px',
          background: '#f8faff', border: '1px dashed #93c5fd',
          borderRadius: 10,
        }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="タスク名を入力..."
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid #e5e7eb', borderRadius: 6,
            padding: '8px 10px', fontSize: 13,
            outline: 'none', background: 'white', marginBottom: 8,
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value as Phase)}
            style={{
              flex: 1, border: '1px solid #e5e7eb', borderRadius: 6,
              padding: '8px 6px', fontSize: 13,
              background: 'white', outline: 'none', minWidth: 0,
            }}
          >
            {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            style={{
              flex: '0 0 auto', padding: '8px 18px', borderRadius: 6, border: 'none',
              background: 'var(--color-accent)', color: 'white',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              cursor: adding || !newTitle.trim() ? 'not-allowed' : 'pointer',
              opacity: adding || !newTitle.trim() ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {adding ? '追加中...' : '+ 追加'}
          </button>
        </div>
      </form>
    </div>
  );
}
