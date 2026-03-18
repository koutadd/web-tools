'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pwa-install-v2';

// Safari 共有アイコン SVG
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IOS_STEPS = [
  {
    num: '1',
    icon: <ShareIcon />,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    title: '共有ボタンをタップ',
    desc: 'Safari 下部中央の「↑」アイコン',
  },
  {
    num: '2',
    icon: <span style={{ fontSize: 18 }}>＋</span>,
    iconBg: '#f0fdf4',
    iconColor: '#059669',
    title: 'ホーム画面に追加',
    desc: 'スクロールして「ホーム画面に追加」を選択',
  },
  {
    num: '3',
    icon: <span style={{ fontSize: 18 }}>✓</span>,
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    title: '「追加」をタップ',
    desc: '右上の「追加」で完了。次からはアプリで起動！',
  },
];

export default function PWAInstallModal() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const open = useCallback(() => setShow(true), []);

  const close = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'dismissed');
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    // スタンドアロン（インストール済み）は何もしない
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // data-pwa-install 属性のボタンクリックでモーダルを開く
    const clickHandler = (e: Event) => {
      if ((e.target as Element).closest('[data-pwa-install]')) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener('click', clickHandler);

    // Android: beforeinstallprompt をキャプチャ
    const promptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', promptHandler);

    // 初回訪問: 3秒後に自動表示
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!localStorage.getItem(STORAGE_KEY)) {
      timer = setTimeout(open, 3000);
    }

    return () => {
      document.removeEventListener('click', clickHandler);
      window.removeEventListener('beforeinstallprompt', promptHandler);
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes pwaOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pwaSheetIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .pwa-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.52);
          animation: pwaOverlayIn 0.22s ease-out;
        }
        .pwa-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 201;
          background: white;
          border-radius: 22px 22px 0 0;
          padding: 8px 20px calc(env(safe-area-inset-bottom, 0px) + 24px);
          animation: pwaSheetIn 0.32s cubic-bezier(0.32, 0.72, 0, 1);
          max-width: 600px; margin: 0 auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.16);
        }
      `}</style>

      {/* Overlay */}
      <div className="pwa-overlay" onClick={close} />

      {/* Bottom Sheet */}
      <div className="pwa-sheet">
        {/* ドラッグハンドル */}
        <div style={{
          width: 40, height: 4, background: '#d1d5db', borderRadius: 99,
          margin: '12px auto 20px',
        }} />

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src="/icons/icon-192.png" alt="アイコン" width={48} height={48}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
                ホーム画面に追加
              </p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>アプリとして起動できます</p>
            </div>
          </div>
          <button onClick={close} style={{
            background: '#f3f4f6', border: 'none', borderRadius: 99,
            width: 32, height: 32, fontSize: 14, color: '#6b7280',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {isIOS ? (
          // ─── iOS 手順 ───
          <div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18, lineHeight: 1.7 }}>
              Safari で以下の手順で追加すると、URLバーなしで起動できます。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {IOS_STEPS.map((step) => (
                <div key={step.num} style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  background: '#f9fafb', borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: step.iconBg, color: step.iconColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800,
                  }}>
                    {step.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <p style={{ fontSize: 12, color: '#065f46', lineHeight: 1.5 }}>
                追加後はホーム画面のアイコンから起動してください。URLバーが消えてアプリのように使えます。
              </p>
            </div>

            <button onClick={close} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: '#f3f4f6', color: '#374151',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              閉じる
            </button>
          </div>
        ) : (
          // ─── Android / Chrome ───
          <div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.7 }}>
              ホーム画面に追加すると、ブラウザを開かずアプリのようにすぐ起動できます。
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '⚡', text: 'すぐ起動できる' },
                { icon: '📵', text: 'URLバーなし' },
                { icon: '📱', text: 'アプリのように使える' },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  flex: 1, textAlign: 'center',
                  background: '#eff6ff', borderRadius: 10, padding: '10px 4px',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <p style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{text}</p>
                </div>
              ))}
            </div>

            <button onClick={installAndroid} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none',
              background: '#2563eb', color: 'white',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
              marginBottom: 10,
            }}>
              ホーム画面に追加する
            </button>
            <button onClick={close} style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              background: 'transparent', color: '#9ca3af',
              fontSize: 14, cursor: 'pointer',
            }}>
              あとで
            </button>
          </div>
        )}
      </div>
    </>
  );
}
