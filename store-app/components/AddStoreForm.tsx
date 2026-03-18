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

const STAFF_OPTIONS = ['未定', '本部対応', '店舗対応'] as const;
const STATUS_OPTIONS = ['準備前', '準備中', '出店可能', '出店済み'] as const;

export default function AddStoreForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // 必須
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [phase, setPhase] = useState<Phase>('企画');

  // 任意
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [staffReadiness, setStaffReadiness] = useState<string>('未定');
  const [openStatus, setOpenStatus] = useState<string>('準備前');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName(''); setDeadline(''); setPhase('企画');
    setContactName(''); setContactInfo(''); setLocation('');
    setBusinessHours(''); setStaffReadiness('未定'); setOpenStatus('準備前');
    setShowOptional(false); setError('');
  };

  const close = () => { reset(); setOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline) {
      setError('店舗名・出店予定日は必須です');
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
          currentPhase: phase,
          startDate: new Date().toISOString().slice(0, 10),
          deadline,
          contactName, contactInfo, location, businessHours,
          staffReadiness, openStatus, memo: '',
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
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 18px', borderRadius: 10,
          border: '2px dashed var(--color-accent)',
          background: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          width: '100%', justifyContent: 'center', marginBottom: 16,
          transition: 'all 0.15s',
        }}
      >
        ＋ 新しい店舗を追加
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8,
    padding: '10px 12px', fontSize: 15, outline: 'none',
    background: 'white', boxSizing: 'border-box', color: '#111827',
  };
  const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 6,
    fontSize: 13, color: '#374151', fontWeight: 600,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, padding: '20px', marginBottom: 24,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>新しい店舗を追加</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>必須項目だけで登録できます</p>
        </div>
        <button type="button" onClick={close}
          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', padding: '4px 8px' }}>
          ✕
        </button>
      </div>

      {/* ─── 必須項目 ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        <label style={labelStyle}>
          店舗名 <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>必須</span>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="例：アイケアLaBo 駒込駅前店"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          出店予定日 <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>必須</span>
          <input
            type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            style={{ ...inputStyle, color: deadline ? '#111827' : '#9ca3af' }}
          />
        </label>

        <div style={labelStyle}>
          開始フェーズ
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PHASES.map((p) => {
              const isSelected = p === phase;
              return (
                <button key={p} type="button" onClick={() => setPhase(p)}
                  style={{
                    padding: '6px 14px', borderRadius: 99,
                    border: `2px solid ${PHASE_COLORS[p]}`,
                    background: isSelected ? PHASE_COLORS[p] : 'transparent',
                    color: isSelected ? 'white' : PHASE_COLORS[p],
                    fontSize: 13, fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 任意項目（折りたたみ）─── */}
      <div style={{
        borderTop: '1px solid #f3f4f6', paddingTop: 14, marginBottom: 16,
      }}>
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#6b7280', fontWeight: 600, padding: 0,
            marginBottom: showOptional ? 16 : 0,
          }}
        >
          <span style={{
            display: 'inline-block', fontSize: 9, transition: 'transform 0.2s',
            transform: showOptional ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>▶</span>
          任意項目を入力する（担当者名・連絡先・出店場所など）
        </button>

        {showOptional && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={labelStyle}>
              担当者名
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="例：田中 太郎"
                style={inputStyle} />
            </label>

            <label style={labelStyle}>
              連絡先
              <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
                placeholder="例：090-xxxx-xxxx / LINE / メールなど"
                style={inputStyle} />
            </label>

            <label style={labelStyle}>
              出店場所
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="例：○○モール 1F / 駒込駅前"
                style={inputStyle} />
            </label>

            <label style={labelStyle}>
              営業時間
              <input type="text" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="例：10:00〜20:00（年中無休）"
                style={inputStyle} />
            </label>

            <div style={labelStyle}>
              スタッフ準備
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STAFF_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => setStaffReadiness(opt)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                      border: `1.5px solid ${staffReadiness === opt ? '#2563eb' : '#e5e7eb'}`,
                      background: staffReadiness === opt ? '#eff6ff' : 'white',
                      color: staffReadiness === opt ? '#2563eb' : '#6b7280',
                      fontWeight: staffReadiness === opt ? 700 : 400,
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={labelStyle}>
              出店ステータス
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => setOpenStatus(opt)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                      border: `1.5px solid ${openStatus === opt ? '#059669' : '#e5e7eb'}`,
                      background: openStatus === opt ? '#ecfdf5' : 'white',
                      color: openStatus === opt ? '#065f46' : '#6b7280',
                      fontWeight: openStatus === opt ? 700 : 400,
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={close}
          style={{
            padding: '10px 18px', borderRadius: 8,
            border: '1px solid #e5e7eb', background: 'transparent',
            fontSize: 14, cursor: 'pointer', color: '#6b7280',
          }}>
          キャンセル
        </button>
        <button type="submit" disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'var(--color-accent)', color: 'white',
            fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? '追加中...' : '追加する'}
        </button>
      </div>
    </form>
  );
}
