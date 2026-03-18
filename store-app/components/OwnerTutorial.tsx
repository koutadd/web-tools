'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'owner-tutorial-seen-v1';

type Step = {
  emoji: string;
  title: string;
  desc: string;
  targetId: string | null;
  scrollTop?: boolean;
};

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'この画面の使い方をご説明します',
    desc: 'お店の準備を進めるための画面です。5つのポイントをご確認ください。「次へ」を押すと各セクションに案内します。',
    targetId: null,
  },
  {
    emoji: '📋',
    title: 'ここがあなたのやることです',
    desc: '「あなたのやること」に今すぐ対応が必要なことが表示されます。赤いバッジが出ているときは優先して確認してください。',
    targetId: 'owner-todo',
  },
  {
    emoji: '✅',
    title: 'チェックリストに答えましょう',
    desc: '写真・書類など必要なものをリストで確認できます。準備できたものにチェックを入れてください。',
    targetId: 'checklist',
  },
  {
    emoji: '💬',
    title: 'わからないときは相談できます',
    desc: '担当者へのメッセージ送信もこの画面からできます。どんな小さなことでも気軽にご相談ください。',
    targetId: 'consult',
  },
  {
    emoji: '📊',
    title: '進捗を確認しましょう',
    desc: '画面上部のバーで全体の進捗を確認できます。完了するにつれてバーが伸びていきます！',
    targetId: null,
    scrollTop: true,
  },
];

export default function OwnerTutorial() {
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState(true);
  const [step, setStep] = useState(-1);

  const startTutorial = useCallback(() => {
    setStep(0);
    setSeen(true);
    localStorage.setItem(STORAGE_KEY, '1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(STORAGE_KEY)) {
      setSeen(false);
    }
    // ヘッダーの「使い方」ボタンから起動
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-tutorial-start]')) {
        e.preventDefault();
        startTutorial();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [startTutorial]);

  const closeTutorial = () => setStep(-1);

  const highlight = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      el.classList.add('tutorial-highlight');
      setTimeout(() => el.classList.remove('tutorial-highlight'), 1600);
    }, 400);
  };

  const goNext = () => {
    const nextIdx = step + 1;
    if (nextIdx >= STEPS.length) {
      closeTutorial();
      return;
    }
    const nextStep = STEPS[nextIdx];
    if (nextStep.targetId) {
      highlight(nextStep.targetId);
    } else if (nextStep.scrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setStep(nextIdx);
  };

  if (!mounted) return null;

  const isActive = step >= 0;
  const currentStep = isActive ? STEPS[step] : null;

  return (
    <>
      <style>{`
        @keyframes tutHighlight {
          0%   { box-shadow: 0 0 0 0   rgba(37,99,235,0.35); }
          35%  { box-shadow: 0 0 0 10px rgba(37,99,235,0.20); }
          100% { box-shadow: 0 0 0 0   rgba(37,99,235,0);    }
        }
        .tutorial-highlight {
          animation: tutHighlight 1.6s ease-out;
          border-radius: 14px;
        }
        @keyframes tutPanelIn {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .tutorial-panel { animation: tutPanelIn 0.25s ease-out; }
        @keyframes tutBannerIn {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .tutorial-banner { animation: tutBannerIn 0.3s ease-out; }
      `}</style>

      {/* ─── 初回バナー ─── */}
      {!seen && !isActive && (
        <div className="tutorial-banner" style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1.5px solid #bfdbfe', borderRadius: 14,
          padding: '16px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 16px rgba(37,99,235,0.12)',
        }}>
          <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>🎯</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8', marginBottom: 3 }}>
              まずはこちらをご確認ください
            </p>
            <p style={{ fontSize: 12, color: '#3b82f6', lineHeight: 1.5 }}>
              画面の使い方を5ステップでご説明します（1分程度）
            </p>
          </div>
          <button onClick={startTutorial} style={{
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: '#2563eb', color: 'white',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
            boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
          }}>
            使い方を見る
          </button>
        </div>
      )}

      {/* ─── チュートリアルパネル（固定下部）─── */}
      {isActive && currentStep && (
        <div className="tutorial-panel" style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)',
          left: 0, right: 0, zIndex: 50,
          padding: '0 12px', pointerEvents: 'none',
        }}>
          <div style={{
            maxWidth: 568, margin: '0 auto',
            background: '#1e293b', borderRadius: 16,
            padding: '16px 18px 14px',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.22)',
            pointerEvents: 'auto',
          }}>
            {/* プログレスドット */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    height: 6, borderRadius: 99,
                    width: i === step ? 22 : 6,
                    background: i === step ? '#3b82f6' : i < step ? '#475569' : '#334155',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
              <button onClick={closeTutorial} style={{
                background: 'none', border: 'none', color: '#64748b',
                fontSize: 12, cursor: 'pointer', padding: '2px 6px', fontWeight: 600,
              }}>
                ✕ 閉じる
              </button>
            </div>

            {/* ステップ内容 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{currentStep.emoji}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 5, lineHeight: 1.3 }}>
                  {currentStep.title}
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                  {currentStep.desc}
                </p>
              </div>
            </div>

            {/* 次へボタン */}
            <button onClick={goNext} style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: '#3b82f6', color: 'white',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
            }}>
              {step < STEPS.length - 1
                ? `次へ（${step + 1} / ${STEPS.length - 1}）`
                : '完了 ✓'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
