'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/';

  const [passcode, setPasscode] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('パスコードを入力してください。');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/review-auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ passcode }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'エラーが発生しました。');
      }
    } catch {
      setError('通信エラーが発生しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: '36px 32px',
      }}>
        {/* ロゴ / タイトル */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 36,
            marginBottom: 12,
          }}>🔒</div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 6,
          }}>
            レビュー用アクセス
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            パスコードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* パスコード入力 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 6,
            }}>
              パスコード
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError('');
              }}
              placeholder="パスコードを入力"
              autoFocus
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: error ? '2px solid #fca5a5' : '1.5px solid #d1d5db',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                background: error ? '#fef2f2' : 'white',
                letterSpacing: '0.15em',
                transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 12, color: '#dc2626', lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 9,
              border: 'none',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '確認中...' : '入る'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReviewLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
