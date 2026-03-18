'use client';

import { useState } from 'react';
import { PHASES, type Task, type Phase } from '@/lib/data';
import { logEvent } from '@/lib/log';

const PHASE_COLORS: Record<Phase, string> = {
  企画:     '#a78bfa',
  デザイン: '#fb923c',
  制作:     '#34d399',
  納品:     '#60a5fa',
};

export default function TaskList({
  initialTasks,
  storeId,
}: {
  initialTasks: Task[];
  storeId: string;
}) {
  const [tasks, setTasks]           = useState<Task[]>(initialTasks);
  const [filter, setFilter]         = useState<Phase | 'すべて'>('すべて');
  const [newTitle, setNewTitle]     = useState('');
  const [newPhase, setNewPhase]     = useState<Phase>('企画');
  const [adding, setAdding]         = useState(false);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [showDone, setShowDone]     = useState(false);
  // チェックボックスのポップアニメ用
  const [popping, setPopping]       = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target || completing.has(id)) return;
    const newDone = !target.done;

    if (newDone) {
      // チェックボックスポップ → 完了アニメ → done 状態へ
      setPopping((p) => new Set([...p, id]));
      setTimeout(() => setPopping((p) => { const n = new Set(p); n.delete(id); return n; }), 200);

      setCompleting((p) => new Set([...p, id]));
      setTimeout(() => {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: true } : t));
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

  const allFiltered  = filter === 'すべて' ? tasks : tasks.filter((t) => t.phase === filter);
  const pendingTasks = allFiltered.filter((t) => !t.done);
  const doneTasks    = allFiltered.filter((t) => t.done);
  const totalDone    = tasks.filter((t) => t.done).length;
  const progress     = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;
  const filters: (Phase | 'すべて')[] = ['すべて', ...PHASES];

  return (
    <div>
      {/* ── 進捗バー ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 5,
        }}>
          <span>進捗</span>
          <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
            {progress}%（{totalDone} / {tasks.length}件完了）
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
            borderRadius: 99,
            transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* ── フィルタタブ ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {filters.map((f) => {
          const isActive = filter === f;
          const count = f === 'すべて'
            ? tasks.filter((t) => !t.done).length
            : tasks.filter((t) => t.phase === f && !t.done).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 99,
                border: isActive
                  ? `2px solid ${f === 'すべて' ? 'var(--color-accent)' : PHASE_COLORS[f as Phase]}`
                  : '2px solid var(--color-border)',
                background: isActive
                  ? f === 'すべて' ? 'var(--color-accent-light)' : PHASE_COLORS[f as Phase] + '22'
                  : 'transparent',
                color: isActive
                  ? f === 'すべて' ? 'var(--color-accent)' : PHASE_COLORS[f as Phase]
                  : 'var(--color-text-sub)',
                fontSize: 13, fontWeight: isActive ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f}（{count}）
            </button>
          );
        })}
      </div>

      {/* ── 未完了タスク ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pendingTasks.length === 0 && doneTasks.length === 0 && (
          <p style={{ color: 'var(--color-text-sub)', fontSize: 14, padding: '8px 0' }}>タスクがありません</p>
        )}
        {pendingTasks.length === 0 && doneTasks.length > 0 && (
          <div className="animate-slide-down" style={{
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
          return (
            <div
              key={task.id}
              className={isCompleting ? 'task-completing' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}
            >
              {/* チェックボックス */}
              <div
                onClick={() => toggle(task.id)}
                className={isPopping ? 'checkbox-pop' : undefined}
                style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  border: isCompleting
                    ? `2px solid ${PHASE_COLORS[task.phase]}`
                    : '2px solid var(--color-border)',
                  background: isCompleting ? PHASE_COLORS[task.phase] : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
              >
                {isCompleting && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5,5.5 4,8.5 9.5,2.5" />
                  </svg>
                )}
              </div>

              {/* タスク名 */}
              <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text)' }}>
                {task.title}
              </span>

              {/* フェーズバッジ */}
              <span style={{
                padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                background: PHASE_COLORS[task.phase] + '22',
                color: PHASE_COLORS[task.phase],
                fontSize: 11, fontWeight: 600,
              }}>
                {task.phase}
              </span>

              {/* 削除ボタン */}
              <button
                onClick={() => deleteTask(task.id)}
                title="このタスクを削除"
                style={{
                  width: 26, height: 26, borderRadius: 4, flexShrink: 0,
                  border: '1px solid var(--color-border)', background: 'transparent',
                  color: '#9ca3af', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#ef4444';
                  el.style.color = '#ef4444';
                  el.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--color-border)';
                  el.style.color = '#9ca3af';
                  el.style.background = 'transparent';
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* ── 完了済みタスク（折りたたみ） ── */}
      {doneTasks.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowDone((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              fontSize: 13, color: 'var(--color-text-sub)', padding: '4px 0',
              fontWeight: 500,
            }}
          >
            <span style={{
              display: 'inline-block', fontSize: 10,
              transition: 'transform 0.15s',
              transform: showDone ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>▶</span>
            完了済み {doneTasks.length}件
          </button>

          {showDone && (
            <div className="animate-slide-down" style={{
              marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {doneTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', opacity: 0.65,
                    background: '#f9fafb', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <div
                    onClick={() => toggle(task.id)}
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${PHASE_COLORS[task.phase]}`,
                      background: PHASE_COLORS[task.phase],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
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
                      border: '1px solid var(--color-border)', background: 'transparent',
                      color: '#d1d5db', fontSize: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── タスク追加フォーム ── */}
      <form
        onSubmit={addTask}
        style={{
          marginTop: 14, display: 'flex', gap: 8, alignItems: 'center',
          padding: '10px 12px',
          background: 'var(--color-accent-light)',
          border: '1px dashed #93c5fd',
          borderRadius: 'var(--radius)',
        }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="タスク名を入力..."
          style={{
            flex: 1, border: '1px solid var(--color-border)',
            borderRadius: 6, padding: '6px 10px', fontSize: 13,
            outline: 'none', background: 'white',
          }}
        />
        <select
          value={newPhase}
          onChange={(e) => setNewPhase(e.target.value as Phase)}
          style={{
            border: '1px solid var(--color-border)', borderRadius: 6,
            padding: '6px 8px', fontSize: 13,
            background: 'white', outline: 'none',
          }}
        >
          {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: 'var(--color-accent)', color: 'white',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            cursor: adding || !newTitle.trim() ? 'not-allowed' : 'pointer',
            opacity: adding || !newTitle.trim() ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {adding ? '追加中...' : '+ 追加'}
        </button>
      </form>
    </div>
  );
}
