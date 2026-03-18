'use client';

import { useState, useEffect } from 'react';

export default function OwnerFixedCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ① スクロール修正: ヘッダー高さ分オフセット + ハイライト
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    // 固定ヘッダー分（ある場合）+ 余白 16px を引く
    const OFFSET = 16;
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });

    // スクロール後、軽くハイライト
    el.classList.add('cta-scroll-highlight');
    setTimeout(() => el.classList.remove('cta-scroll-highlight'), 1600);
  };

  return (
    <>
      <style>{`
        @keyframes ctaSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        /* ハイライトアニメ */
        @keyframes ctaHighlight {
          0%   { box-shadow: 0 0 0 0   rgba(37,99,235,0.25); }
          40%  { box-shadow: 0 0 0 6px rgba(37,99,235,0.18); }
          100% { box-shadow: 0 0 0 0   rgba(37,99,235,0);    }
        }
        .cta-scroll-highlight {
          animation: ctaHighlight 1.4s ease-out;
          border-radius: 12px;
        }

        .owner-fixed-cta {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 40;
          padding: 10px 16px 16px;
          background: white;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
          animation: ctaSlideUp 0.25s ease-out;
        }
        .owner-fixed-cta-hidden { display: none; }

        .cta-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 13px 8px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: opacity 0.15s, transform 0.1s;
          line-height: 1.3;
        }
        .cta-btn:active {
          opacity: 0.8;
          transform: scale(0.96);
        }
      `}</style>

      <div className={visible ? 'owner-fixed-cta' : 'owner-fixed-cta-hidden'}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 568, margin: '0 auto' }}>
          <button
            className="cta-btn"
            onClick={() => scrollTo('checklist')}
            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
          >
            <span style={{ fontSize: 16 }}>📋</span>
            残りタスクを見る
          </button>
          <button
            className="cta-btn"
            onClick={() => scrollTo('consult')}
            style={{ background: '#2563eb', color: 'white', boxShadow: '0 3px 10px #2563eb55' }}
          >
            <span style={{ fontSize: 16 }}>💬</span>
            担当者に相談する
          </button>
        </div>
      </div>
    </>
  );
}
