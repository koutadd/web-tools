'use client';

import { useState, useEffect } from 'react';

type ConsultationRow = {
  id: string;
  title: string;
  message: string;
  status: string;
  answer: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  open:     { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  answered: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  closed:   { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
};

const STATUS_LABEL: Record<string, string> = {
  open: '未対応', answered: '回答済み', closed: 'クローズ',
};

export default function ConsultWidget({
  storeId,
  storeName,
}: {
  storeId: string;
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [consults, setConsults] = useState<ConsultationRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setLoadingHistory(true);
    fetch(`/api/stores/${storeId}/consultations`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setConsults(Array.isArray(data) ? data : []))
      .catch(() => setConsults([]))
      .finally(() => setLoadingHistory(false));
  }, [storeId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '担当者への相談',
          message: text.trim(),
          createdBy: 'owner',
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setConsults((prev) => [created, ...prev]);
      setText('');
      setOpen(false);
    } catch {
      console.error('相談の送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const displayConsults = consults.slice(0, 5);
  const remainingCount = consults.length - displayConsults.length;

  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '18px 20px',
        marginBottom: 16,
        boxShadow: 'var(--shadow)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: 14, letterSpacing: 0.5 }}>
        💬 担当者への相談
      </p>

      {/* 相談するボタン */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: '2px dashed #93c5fd',
            background: '#eff6ff',
            color: '#1d4ed8',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginBottom: consults.length > 0 ? 16 : 0,
          }}
        >
          ＋ 担当者に相談する
        </button>
      )}

      {/* 相談入力フォーム */}
      {open && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: consults.length > 0 ? 16 : 0,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            ご相談内容を入力してください
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例：トップページの写真を差し替えたいのですが、どうすれば良いですか？"
            rows={4}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 14,
              resize: 'vertical' as const,
              outline: 'none',
              background: 'white',
              boxSizing: 'border-box' as const,
              lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setOpen(false); setText(''); }}
              style={{
                padding: '7px 16px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'white',
                fontSize: 13,
                cursor: 'pointer',
                color: 'var(--color-text-sub)',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                padding: '7px 20px',
                borderRadius: 6,
                border: 'none',
                background: !text.trim() || sending ? '#93c5fd' : '#2563eb',
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                cursor: !text.trim() || sending ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {sending ? '送信中...' : '送信する'}
            </button>
          </div>
        </div>
      )}

      {/* 相談履歴 */}
      {loadingHistory ? (
        <p style={{ fontSize: 12, color: 'var(--color-text-sub)', textAlign: 'center' as const }}>
          読み込み中...
        </p>
      ) : displayConsults.length > 0 ? (
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 10, fontWeight: 600 }}>
            相談履歴
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {displayConsults.map((c) => {
              const s = STATUS_STYLE[c.status] ?? STATUS_STYLE['open'];
              const statusLabel = STATUS_LABEL[c.status] ?? c.status;
              return (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: 'white',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-sub)' }}>
                      {new Date(c.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 99,
                      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: c.answer ? 8 : 0 }}>
                    {c.message}
                  </p>
                  {c.answer && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px', borderRadius: 6,
                      background: '#f0f9ff', border: '1px solid #bae6fd',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 3 }}>
                        担当者より
                      </p>
                      <p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6 }}>
                        {c.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {remainingCount > 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-sub)', textAlign: 'center' as const }}>
                他{remainingCount}件
              </p>
            )}
          </div>
        </div>
      ) : !open ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-sub)', textAlign: 'center' as const, paddingTop: 4 }}>
          相談履歴はありません
        </p>
      ) : null}
    </section>
  );
}
