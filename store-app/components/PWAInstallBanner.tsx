'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    // すでにPWAとして動作中 → 表示しない
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // 過去に非表示にした → 表示しない
    if (sessionStorage.getItem('pwa-banner-dismissed')) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(ios);

    if (ios) {
      // iOS はタイマーで表示（beforeinstallprompt が来ない）
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setPrompt(null);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes bannerSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .pwa-banner {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 68px);
          left: 0; right: 0; z-index: 45;
          padding: 0 12px;
          animation: bannerSlideUp 0.3s ease-out;
        }
        .pwa-banner-inner {
          max-width: 568px; margin: 0 auto;
          background: #1e293b; border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.20);
          display: flex; align-items: center; gap: 12px;
        }
      `}</style>

      <div className="pwa-banner">
        <div className="pwa-banner-inner">
          <img src="/icons/icon-192.png" alt="アイコン" width={40} height={40}
            style={{ borderRadius: 10, flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'white', marginBottom: 2 }}>
              ホーム画面に追加できます
            </p>
            {isIOS ? (
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                Safari の <strong style={{ color: '#60a5fa' }}>共有ボタン</strong> →「<strong style={{ color: '#60a5fa' }}>ホーム画面に追加</strong>」をタップ
              </p>
            ) : (
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                アプリとしてインストールするとすぐに起動できます
              </p>
            )}
          </div>

          {!isIOS && (
            <button onClick={install} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: '#2563eb', color: 'white',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}>
              追加する
            </button>
          )}

          <button onClick={dismiss} style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0,
            lineHeight: 1,
          }}>
            ×
          </button>
        </div>
      </div>
    </>
  );
}
