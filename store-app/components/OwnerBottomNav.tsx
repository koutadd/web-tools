'use client';

import { useState, useEffect, useCallback } from 'react';

const TABS = [
  { id: 'owner-todo', icon: '📋', label: 'やること' },
  { id: 'checklist',  icon: '✅', label: 'チェック' },
  { id: 'purchase',   icon: '🛒', label: '備品'     },
  { id: 'consult',    icon: '💬', label: '相談'     },
] as const;

type TabId = typeof TABS[number]['id'];

export default function OwnerBottomNav() {
  const [active, setActive] = useState<TabId>('owner-todo');
  const [pressed, setPressed] = useState<string>('');

  // ─── スクロール位置でアクティブタブを同期 ──────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let mostVisible: string = '';
        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisible = entry.target.id;
          }
        });
        if (mostVisible && maxRatio > 0.08) {
          setActive(mostVisible as TabId);
        }
      },
      { threshold: [0, 0.08, 0.3, 0.6], rootMargin: '-8% 0px -42% 0px' }
    );

    TABS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // ─── タブタップ → スクロール ───────────────────────────────────────────────
  const scrollTo = useCallback((id: TabId) => {
    setActive(id);
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  return (
    <>
      <style>{`
        .owner-bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(229,231,235,0.8);
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .nav-inner {
          display: flex;
          max-width: 568px;
          margin: 0 auto;
        }
        .nav-tab {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; padding: 8px 4px 10px;
          background: none; border: none; cursor: pointer;
          position: relative; min-height: 60px;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: transform 0.1s ease;
        }
        .nav-tab.pressed {
          transform: scale(0.82);
          transition: transform 0.05s ease;
        }
        .nav-icon {
          font-size: 22px; line-height: 1;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
          display: block;
        }
        .nav-tab.active .nav-icon {
          transform: translateY(-2px) scale(1.15);
        }
        .nav-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.3px;
          transition: color 0.15s;
          line-height: 1;
        }
        .nav-active-bar {
          position: absolute; top: 0;
          left: 50%; transform: translateX(-50%);
          width: 28px; height: 3px;
          background: #2563eb; border-radius: 0 0 3px 3px;
          animation: navBarPop 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes navBarPop {
          from { width: 0px; opacity: 0; }
          to   { width: 28px; opacity: 1; }
        }
      `}</style>

      <nav className="owner-bottom-nav" role="navigation" aria-label="メインメニュー">
        <div className="nav-inner">
          {TABS.map(({ id, icon, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                className={[
                  'nav-tab',
                  isActive ? 'active' : '',
                  pressed === id ? 'pressed' : '',
                ].join(' ')}
                onClick={() => scrollTo(id)}
                onTouchStart={() => setPressed(id)}
                onTouchEnd={() => { setPressed(''); scrollTo(id); }}
                onTouchCancel={() => setPressed('')}
                onMouseDown={() => setPressed(id)}
                onMouseUp={() => setPressed('')}
                onMouseLeave={() => setPressed('')}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && <div className="nav-active-bar" />}
                <span className="nav-icon">{icon}</span>
                <span className="nav-label" style={{ color: isActive ? '#2563eb' : '#9ca3af' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
