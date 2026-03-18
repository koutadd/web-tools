'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PHASES, type Phase } from '@/lib/data';

const PHASE_COLORS: Record<Phase, string> = {
  企画: '#a78bfa',
  デザイン: '#fb923c',
  制作: '#34d399',
  納品: '#60a5fa',
};

export default function AddStoreForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [phase, setPhase] = useState<Phase>('企画');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setCategory('');
    setDeadline('');
    setPhase('企画');
    setError('');
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !deadline) {
      setError('店舗名・業種・納期は必須です');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          currentPhase: phase,
          startDate: new Date().toISOString().slice(0, 10),
          deadline,
          memo: '',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? '作成に失敗しました');
      }
      close();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 18px',
          borderRadius: 8,
          border: '2px dashed var(--color-accent)',
          background: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          width: '100%',
          justifyContent: 'center',
          marginBottom: 16,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#dbeafe';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-light)';
        }}
      >
        ＋ 新しい店舗を追加
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 14,
    outline: 'none',
    background: 'white',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 13,
    color: 'var(--color-text-sub)',
    fontWeight: 600,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>新しい店舗を追加</h2>
        <button
          type="button"
          onClick={close}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: 'var(--color-text-sub)',
            lineHeight: 1,
            padding: '2px 6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* 入力フォーム */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <label style={labelStyle}>
          店舗名 <span style={{ color: '#ef4444', fontSize: 11 }}>必須</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：アイケアラボ 渋谷店"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          業種 <span style={{ color: '#ef4444', fontSize: 11 }}>必須</span>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例：眼科・コンタクト"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          納期 <span style={{ color: '#ef4444', fontSize: 11 }}>必須</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          開始フェーズ
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PHASES.map((p) => {
              const isSelected = p === phase;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhase(p)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 99,
                    border: `2px solid ${PHASE_COLORS[p]}`,
                    background: isSelected ? PHASE_COLORS[p] : 'transparent',
                    color: isSelected ? 'white' : PHASE_COLORS[p],
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </label>
      </div>

      {/* エラー */}
      {error && (
        <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>
      )}

      {/* 送信ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={close}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            fontSize: 14,
            cursor: 'pointer',
            color: 'var(--color-text-sub)',
          }}
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '8px 22px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--color-accent)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {saving ? '追加中...' : '追加する'}
        </button>
      </div>
    </form>
  );
}
