'use client';

import { useState, useEffect, useCallback } from 'react';

// 自動表示の初回フラグ（ボタンからは何度でも開ける）
const AUTO_SHOWN_KEY = 'pwa-auto-shown-v3';

// Safari 共有アイコン SVG（iOS の↑ボタンを模したもの）
const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
  </svg>
);

const IOS_STEPS = [
  {
    num: '1',
    icon: <ShareIcon />,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    title: '画面下の共有ボタンを押します',
    desc: 'Safariの画面下中央にある「↑」のボタンです',
  },
  {
    num: '2',
    icon: <span style={{ fontSize: 20, fontWeight: 800 }}>＋</span>,
    iconBg: '#f0fdf4',
    iconColor: '#059669',
    title: '「ホーム画面に追加」を押します',
    desc: 'メニューを下にスクロールして「ホーム画面に追加」をタップ',
  },
  {
    num: '3',
    icon: <span style={{ fontSize: 18 }}>🏠</span>,
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    title: 'ホーム画面のアイコンから開いてください',
    desc: '右上の「追加」を押せば完了。次からはアイコンで起動！',
  },
] as const;

export default function PWAInstallModal() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

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
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // スタンドアロン（インストール済み）は自動表示しない
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // 「📱 アプリ化」ボタンのクリックで常に開く（localStorage に関係なく）
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

    // 初回訪問のみ: 3秒後に自動表示
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!sessionStorage.getItem(AUTO_SHOWN_KEY)) {
      timer = setTimeout(() => {
        sessionStorage.setItem(AUTO_SHOWN_KEY, '1');
        open();
      }, 3000);
    }

    return () => {
      document.removeEventListener('click', clickHandler);
      window.removeEventListener('beforeinstallprompt', promptHandler);
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  if (!show) return null;

  // スタンドアロン起動済み（ホーム画面からアイコンで起動）
  if (isStandalone) {
    return (
      <>
        <style>{`
          @keyframes pwaOverlayIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pwaSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .pwa-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.52); animation: pwaOverlayIn 0.22s ease-out; }
          .pwa-sheet { position: fixed; bottom: 0; left: 0; right: 0; z-index: 201; background: white; border-radius: 22px 22px 0 0; padding: 8px 20px calc(env(safe-area-inset-bottom, 0px) + 24px); animation: pwaSheetIn 0.32s cubic-bezier(0.32, 0.72, 0, 1); max-width: 600px; margin: 0 auto; box-shadow: 0 -8px 40px rgba(0,0,0,0.16); }
        `}</style>
        <div className="pwa-overlay" onClick={close} />
        <div className="pwa-sheet">
          <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 99, margin: '12px auto 24px' }} />
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              アプリとして起動中です
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
              ホーム画面のアイコンから起動しているため、<br />すでにアプリモードで動作しています。
            </p>
            <button onClick={close} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              閉じる
            </button>
          </div>
        </div>
      </>
    );
  }

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
        .pwa-step {
          display: flex; gap: 14px; align-items: center;
          background: #f9fafb; border-radius: 12px; padding: 13px 14px;
        }
        .pwa-step-icon {
          width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-weight: 800;
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
            <img src="/icons/icon-192.png" alt="アイコン" width={46} height={46}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
                📱 ホーム画面に追加する
              </p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>
                {isIOS ? 'Safari から3ステップで完了' : 'アプリのようにすぐ起動できます'}
              </p>
            </div>
          </div>
          <button onClick={close} style={{
            background: '#f3f4f6', border: 'none', borderRadius: 99,
            width: 32, height: 32, fontSize: 14, color: '#6b7280',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>✕</button>
        </div>

        {isIOS ? (
          // ─── iOS 手順 ───────────────────────────────────────────────────────
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {IOS_STEPS.map((step, i) => (
                <div key={i} className="pwa-step">
                  <div
                    className="pwa-step-icon"
                    style={{ background: step.iconBg, color: step.iconColor }}
                  >
                    {step.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                      <span style={{ color: step.iconColor, marginRight: 4 }}>{i + 1}.</span>
                      {step.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ヒント */}
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 10, padding: '10px 14px', marginBottom: 18,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
              <p style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.6 }}>
                このガイドはいつでも「📱 アプリ化」ボタンから再表示できます。
              </p>
            </div>

            <button onClick={close} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: '#2563eb', color: 'white',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
            }}>
              わかりました
            </button>
          </div>
        ) : (
          // ─── Android / Chrome ────────────────────────────────────────────────
          <div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.7 }}>
              ホーム画面に追加すると、ブラウザを開かずアプリのようにすぐ起動できます。
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[
                { icon: '⚡', text: 'すぐ起動できる' },
                { icon: '📵', text: 'URLバーなし' },
                { icon: '📱', text: 'アプリのように' },
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

            {deferredPrompt ? (
              <button onClick={installAndroid} style={{
                width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                background: '#2563eb', color: 'white',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                marginBottom: 10,
              }}>
                ホーム画面に追加する
              </button>
            ) : (
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 10, padding: '12px 14px', marginBottom: 14,
              }}>
                <p style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                  Chromeのメニューから追加できます
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                  右上の「⋮」メニュー →「ホーム画面に追加」を選択してください。
                </p>
              </div>
            )}

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
