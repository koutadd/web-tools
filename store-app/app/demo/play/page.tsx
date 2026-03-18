'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type ItemStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
type HighlightTarget = '' | 'todo' | 'item-photo' | 'submit-btn' | 'item-submitted' | 'consult';
type StepAction = 'next' | 'click' | 'auto';

interface StepDef {
  title: string;
  why: string;
  hint: string;
  target: HighlightTarget;
  action: StepAction;
}

// ─── ステップ定義 ─────────────────────────────────────────────────────────────

const STEPS: StepDef[] = [
  {
    title: '「今やること」を確認しましょう',
    why: 'このエリアには、今すぐ対応が必要な項目が一覧で表示されます。ここを確認するだけで次の行動がわかります。',
    hint: '黄色く光っているエリアを見てください。',
    target: 'todo',
    action: 'next',
  },
  {
    title: '提出が必要な項目を見てみましょう',
    why: '「店舗外観写真」がまだ提出されていません。この画面からファイルを送ることができます。',
    hint: 'カテゴリごとに整理されているので、何が必要かひと目で分かります。',
    target: 'item-photo',
    action: 'next',
  },
  {
    title: '「提出する」ボタンを押してみてください',
    why: 'ファイルを選ぶだけで、担当者のGoogleドライブへ自動的に送られます。',
    hint: '📌 ハイライトされたボタンを押さないと次に進めません。',
    target: 'submit-btn',
    action: 'click',
  },
  {
    title: 'ファイルを送信しています...',
    why: '担当者のフォルダへ安全に送信中です。通常は数秒で完了します。',
    hint: 'そのままお待ちください。',
    target: '',
    action: 'auto',
  },
  {
    title: '✅ 送信完了！「確認待ち」になりました',
    why: '担当者がデータを確認します。問題なければ「承認」、修正が必要なら「差し戻し」の通知が届きます。',
    hint: 'ステータスが「確認待ち」に変わったことを確認しましょう。',
    target: 'item-submitted',
    action: 'next',
  },
  {
    title: '相談したいことがあればいつでも聞けます',
    why: '写真の撮り方・提出方法・スケジュールなど、小さなことでも気軽に質問できます。担当者が回答します。',
    hint: '相談は「担当者へ相談」ボタンから送れます。',
    target: 'consult',
    action: 'next',
  },
  {
    title: '🎉 一連の流れを体験できました！',
    why: 'これがオーナーページの基本的な使い方です。実際の画面もこれと全く同じ操作です。',
    hint: '',
    target: '',
    action: 'next',
  },
];

// ─── シナリオデータ ──────────────────────────────────────────────────────────

interface ScenarioMeta {
  storeName: string;
  phase: string;
  phaseColor: string;
  phaseBg: string;
  progress: number;
  whoWaiting: string;
  extraItems: Array<{ emoji: string; label: string; status: ItemStatus; desc: string }>;
}

const SCENARIOS: Record<string, ScenarioMeta> = {
  '1': {
    storeName: 'サンプル店（初回スタート）',
    phase: '企画',
    phaseColor: '#a78bfa',
    phaseBg: '#f5f3ff',
    progress: 5,
    whoWaiting: 'owner',
    extraItems: [
      { emoji: '📄', label: '店舗コンセプトシート', status: 'pending', desc: '企画の方向性を決めるための基本資料' },
      { emoji: '💰', label: '予算感のご確認', status: 'pending', desc: '制作規模の目安として必要です' },
    ],
  },
  '2': {
    storeName: 'サンプル店（スムーズ進行）',
    phase: 'デザイン',
    phaseColor: '#fb923c',
    phaseBg: '#fff7ed',
    progress: 45,
    whoWaiting: 'owner',
    extraItems: [
      { emoji: '🎨', label: 'ロゴデータ', status: 'approved', desc: '高解像度の .ai または .svg ファイル' },
      { emoji: '📄', label: '営業時間・メニュー情報', status: 'approved', desc: 'テキストまたはGoogleドキュメント' },
    ],
  },
  '3': {
    storeName: 'サンプル店（確認待ち）',
    phase: 'デザイン',
    phaseColor: '#fb923c',
    phaseBg: '#fff7ed',
    progress: 60,
    whoWaiting: 'admin',
    extraItems: [
      { emoji: '🎨', label: 'ロゴデータ', status: 'submitted', desc: '高解像度の .ai または .svg ファイル' },
      { emoji: '📄', label: '営業時間・メニュー情報', status: 'approved', desc: 'テキストまたはGoogleドキュメント' },
    ],
  },
  '4': {
    storeName: 'サンプル店（差し戻し）',
    phase: '制作',
    phaseColor: '#34d399',
    phaseBg: '#ecfdf5',
    progress: 70,
    whoWaiting: 'owner',
    extraItems: [
      { emoji: '🎨', label: 'ロゴデータ（高解像度）', status: 'rejected', desc: '解像度が低すぎます。300dpi以上のものを再提出してください。' },
      { emoji: '📄', label: '営業時間・メニュー情報', status: 'approved', desc: 'テキストまたはGoogleドキュメント' },
    ],
  },
  '5': {
    storeName: 'サンプル店（完了間近）',
    phase: '納品',
    phaseColor: '#60a5fa',
    phaseBg: '#eff6ff',
    progress: 90,
    whoWaiting: 'owner',
    extraItems: [
      { emoji: '🎨', label: 'ロゴデータ', status: 'approved', desc: '高解像度の .ai または .svg ファイル' },
      { emoji: '📄', label: '営業時間・メニュー情報', status: 'approved', desc: 'テキストまたはGoogleドキュメント' },
    ],
  },
};

const DEFAULT_META: ScenarioMeta = {
  storeName: 'アイケアラボ 渋谷店（デモ）',
  phase: 'デザイン',
  phaseColor: '#fb923c',
  phaseBg: '#fff7ed',
  progress: 40,
  whoWaiting: 'owner',
  extraItems: [
    { emoji: '🎨', label: 'ロゴデータ', status: 'pending', desc: '高解像度の .ai または .svg ファイル' },
    { emoji: '📄', label: '営業時間・メニュー情報', status: 'approved', desc: 'テキストまたはGoogleドキュメント' },
  ],
};

// ─── ステータスバッジ ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, { label: string; color: string; bg: string }> = {
    pending:   { label: '未提出',   color: '#6b7280', bg: '#f3f4f6' },
    submitted: { label: '確認待ち', color: '#1d4ed8', bg: '#dbeafe' },
    approved:  { label: '承認済み', color: '#065f46', bg: '#d1fae5' },
    rejected:  { label: '差し戻し', color: '#b91c1c', bg: '#fee2e2' },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      color: s.color,
      background: s.bg,
      padding: '3px 9px',
      borderRadius: 20,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ─── ハイライトスタイル ────────────────────────────────────────────────────────

function highlightStyle(active: boolean): React.CSSProperties {
  if (!active) return {};
  return {
    borderRadius: 14,
    outline: '3px solid #f59e0b',
    outlineOffset: 4,
    boxShadow: '0 0 0 10px rgba(245,158,11,0.12)',
  };
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') ?? '';

  const meta = SCENARIOS[scenario] ?? DEFAULT_META;
  const isPlayMode = !scenario;

  const [stepIdx, setStepIdx] = useState(0);
  const [photoStatus, setPhotoStatus] = useState<ItemStatus>('pending');
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnActive, setBtnActive] = useState(false); // press animation

  const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];
  const isComplete = stepIdx >= STEPS.length - 1;
  const totalSteps = STEPS.length;

  // Step 3: ローディング後に自動進行
  useEffect(() => {
    if (step.action !== 'auto') return;
    const t = setTimeout(() => {
      setPhotoStatus('submitted');
      setStepIdx((s) => s + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [step.action, stepIdx]);

  function handleNext() {
    if (!isComplete) setStepIdx((s) => s + 1);
  }

  function handleSubmitClick() {
    if (stepIdx !== 2 || btnLoading) return;
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      setStepIdx(3); // loading step
    }, 500);
  }

  function restart() {
    setStepIdx(0);
    setPhotoStatus('pending');
    setBtnLoading(false);
  }

  // シナリオ表示時の初期photoStatus
  const displayPhotoStatus: ItemStatus =
    !isPlayMode && scenario === '3' ? 'submitted' :
    !isPlayMode && scenario === '4' ? 'rejected' :
    !isPlayMode && scenario === '5' ? 'approved' :
    photoStatus;

  // シナリオ別カラー
  const { phase, phaseColor, phaseBg } = meta;

  // 現在のターゲット（シナリオ表示時はハイライトなし）
  const target: HighlightTarget = isPlayMode ? step.target : '';
  const hasOverlay = isPlayMode && !!target && !isComplete;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif',
      background: '#f8fafc',
      minHeight: '100dvh',
    }}>

      {/* ─── 暗幕オーバーレイ ─── */}
      {hasOverlay && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 50,
          pointerEvents: 'none',
          transition: 'opacity 0.3s',
        }} />
      )}

      {/* ─── 上部プログレスバー（固定）─── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 300,
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          onClick={() => router.push('/demo')}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', color: '#6b7280',
            fontSize: 12, padding: '4px 0',
            flexShrink: 0,
          }}
        >
          ← 一覧
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: isPlayMode
                ? `${(stepIdx / (totalSteps - 1)) * 100}%`
                : `${meta.progress}%`,
              background: isPlayMode
                ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                : phaseColor,
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {isPlayMode ? `STEP ${stepIdx + 1} / ${totalSteps}` : `${meta.progress}%`}
        </span>
      </div>

      {/* ─── モック オーナーページ ─── */}
      <div style={{ paddingTop: 54, paddingBottom: 230 }}>

        {/* 店舗ヘッダー */}
        <div style={{
          background: `linear-gradient(135deg, ${phaseColor} 0%, ${phaseColor}bb 100%)`,
          padding: '18px 16px 22px',
          color: 'white',
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <p style={{ fontSize: 11, opacity: 0.75, marginBottom: 5 }}>制作進捗</p>
            <h1 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>
              {meta.storeName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.25)',
                padding: '3px 12px', borderRadius: 20,
              }}>
                {phase}フェーズ
              </span>
              {meta.whoWaiting === 'owner' && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 12px', borderRadius: 20,
                }}>
                  あなたの番です ✋
                </span>
              )}
              {meta.whoWaiting === 'admin' && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 12px', borderRadius: 20,
                }}>
                  担当者が確認中 ⏳
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

          {/* ─── 今やること ─── */}
          <div style={{
            position: 'relative',
            zIndex: target === 'todo' ? 100 : 'auto',
            ...highlightStyle(target === 'todo'),
            marginBottom: 14,
          }}>
            <section style={{
              background: 'white',
              borderRadius: 14,
              padding: '14px 16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 10, letterSpacing: 0.5 }}>
                今やること
              </p>
              {(displayPhotoStatus === 'pending' || displayPhotoStatus === 'rejected') && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: phaseBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    📸
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                      店舗外観写真を提出する
                      {displayPhotoStatus === 'rejected' && (
                        <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700, marginLeft: 8 }}>
                          差し戻し
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>デザイン開始前まで</p>
                  </div>
                </div>
              )}
              {meta.extraItems
                .filter((i) => i.status === 'pending' || i.status === 'rejected')
                .map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0',
                    borderTop: '1px solid #f3f4f6',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: phaseBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {item.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: 11, color: '#9ca3af' }}>デザイン開始前まで</p>
                    </div>
                  </div>
                ))}
              {displayPhotoStatus !== 'pending' && displayPhotoStatus !== 'rejected' &&
               meta.extraItems.every((i) => i.status !== 'pending' && i.status !== 'rejected') && (
                <p style={{ fontSize: 13, color: '#6b7280', padding: '6px 0' }}>
                  現在、対応待ちの項目はありません。担当者の確認をお待ちください。
                </p>
              )}
            </section>
          </div>

          {/* ─── チェックリスト ─── */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, letterSpacing: 0.5 }}>
            必要情報チェックリスト
          </p>

          {/* 店舗外観写真カード */}
          <div style={{
            position: 'relative',
            zIndex: ['item-photo', 'item-submitted', 'submit-btn'].includes(target) ? 100 : 'auto',
            ...highlightStyle(target === 'item-photo' || target === 'item-submitted'),
            marginBottom: 10,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📸</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>店舗外観写真</p>
                  </div>
                  <StatusBadge status={displayPhotoStatus} />
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                  お店の正面外観を撮った写真。できれば昼・夜の2パターン。
                </p>

                {/* 差し戻しコメント */}
                {displayPhotoStatus === 'rejected' && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#fef2f2',
                    borderRadius: 8,
                    marginBottom: 10,
                    fontSize: 12,
                    color: '#b91c1c',
                    lineHeight: 1.5,
                  }}>
                    ⚠️ 画像が暗くて確認できません。明るい時間帯に撮り直して再提出してください。
                  </div>
                )}

                {/* 提出ボタン */}
                {(displayPhotoStatus === 'pending' || displayPhotoStatus === 'rejected') && (
                  <div style={{
                    position: 'relative',
                    zIndex: target === 'submit-btn' ? 110 : 'auto',
                    ...highlightStyle(target === 'submit-btn'),
                  }}>
                    <button
                      onClick={handleSubmitClick}
                      onMouseDown={() => setBtnActive(true)}
                      onMouseUp={() => setBtnActive(false)}
                      onMouseLeave={() => setBtnActive(false)}
                      onTouchStart={() => setBtnActive(true)}
                      onTouchEnd={() => setBtnActive(false)}
                      disabled={btnLoading}
                      style={{
                        width: '100%',
                        padding: '11px',
                        background: btnLoading
                          ? '#93c5fd'
                          : target === 'submit-btn' && !btnLoading
                            ? '#1d4ed8'
                            : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: btnLoading ? 'not-allowed' : 'pointer',
                        transform: btnActive && !btnLoading ? 'scale(0.96)' : 'scale(1)',
                        boxShadow: btnActive
                          ? '0 1px 4px rgba(37,99,235,0.2)'
                          : '0 3px 10px rgba(37,99,235,0.28)',
                        transition: 'transform 0.1s, box-shadow 0.1s, background 0.1s',
                        opacity: isPlayMode && stepIdx < 2 ? 0.45 : 1,
                      }}
                    >
                      {btnLoading
                        ? '送信中...'
                        : target === 'submit-btn' && isPlayMode
                          ? '📤 ここを押してください ←'
                          : displayPhotoStatus === 'rejected'
                            ? '📤 再提出する'
                            : '📤 提出する'}
                    </button>
                  </div>
                )}

                {/* 提出済み状態 */}
                {displayPhotoStatus === 'submitted' && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#eff6ff',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#1d4ed8',
                    fontWeight: 600,
                  }}>
                    ✅ 提出完了 — 担当者が確認中です
                  </div>
                )}

                {/* 承認済み状態 */}
                {displayPhotoStatus === 'approved' && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#f0fdf4',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#065f46',
                    fontWeight: 600,
                  }}>
                    ✅ 承認されました
                  </div>
                )}
              </div>

              {/* ローディングバー（Step 3） */}
              {stepIdx === 3 && (
                <div style={{ height: 3, background: '#dbeafe' }}>
                  <div style={{
                    height: '100%',
                    background: '#2563eb',
                    borderRadius: 99,
                    animation: 'demoLoadBar 1.8s ease-out forwards',
                  }} />
                  <style>{`
                    @keyframes demoLoadBar {
                      from { width: 0% }
                      to   { width: 100% }
                    }
                  `}</style>
                </div>
              )}
            </div>
          </div>

          {/* その他のアイテム */}
          {meta.extraItems.map((item, idx) => (
            <div key={idx} style={{
              background: 'white',
              borderRadius: 12,
              marginBottom: 10,
              border: '1px solid #e5e7eb',
              padding: '13px 14px',
              opacity: isPlayMode && stepIdx >= 2 ? 0.45 : 1,
              transition: 'opacity 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{item.emoji}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.label}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</p>
              {item.status === 'rejected' && (
                <div style={{
                  marginTop: 10, padding: '10px 12px',
                  background: '#fef2f2', borderRadius: 8,
                  fontSize: 12, color: '#b91c1c', lineHeight: 1.5,
                }}>
                  ⚠️ 解像度が低すぎます。300dpi以上のものを再提出してください。
                </div>
              )}
            </div>
          ))}

          {/* ─── 相談ウィジェット ─── */}
          <div style={{
            position: 'relative',
            zIndex: target === 'consult' ? 100 : 'auto',
            ...highlightStyle(target === 'consult'),
            marginBottom: 8,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 10, letterSpacing: 0.5 }}>
                担当者へ相談
              </p>
              <button style={{
                width: '100%',
                padding: '11px',
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
              }}>
                💬 相談する・質問する
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── 下部ステップパネル（固定）─── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 200,
        background: 'white',
        borderTop: '2px solid #e5e7eb',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
        padding: '16px 20px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}>

        {/* シナリオ表示モード（チュートリアルなし）*/}
        {!isPlayMode ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: phaseBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {phase === '企画' ? '💡' : phase === 'デザイン' ? '🎨' : phase === '制作' ? '🔧' : '🚀'}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 1 }}>
                  {meta.storeName}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>
                  {phase}フェーズ — 進捗 {meta.progress}%
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => router.push('/demo')}
                style={{
                  flex: 1, padding: '10px',
                  background: 'white', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontSize: 13, fontWeight: 700,
                  color: '#374151', cursor: 'pointer',
                }}
              >
                一覧に戻る
              </button>
              <button
                onClick={() => router.push('/demo/play')}
                style={{
                  flex: 2, padding: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700,
                  color: 'white', cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                }}
              >
                ▶ 体験モードを始める
              </button>
            </div>
          </>
        ) : isComplete ? (
          /* 完了画面 */
          <>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              {step.title}
            </p>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.65, marginBottom: 14 }}>
              {step.why}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => router.push('/demo')}
                style={{
                  flex: 1, padding: '10px',
                  background: 'white', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontSize: 13, fontWeight: 700,
                  color: '#374151', cursor: 'pointer',
                }}
              >
                デモ一覧へ
              </button>
              <button
                onClick={restart}
                style={{
                  flex: 1, padding: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700,
                  color: 'white', cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                }}
              >
                もう一度体験
              </button>
            </div>
          </>
        ) : (
          /* 通常ステップ */
          <>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              {step.title}
            </p>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: step.hint ? 3 : 12 }}>
              {step.why}
            </p>
            {step.hint && (
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                {step.hint}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* 一覧に戻るボタン（常時表示）*/}
              <button
                onClick={() => router.push('/demo')}
                style={{
                  padding: '9px 14px',
                  background: 'white', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  color: '#9ca3af', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                終了
              </button>

              {/* 次へ（action=next の場合）*/}
              {step.action === 'next' && (
                <button
                  onClick={handleNext}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 700,
                    color: 'white', cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                  }}
                >
                  次へ →
                </button>
              )}

              {/* 操作誘導メッセージ（action=click）*/}
              {step.action === 'click' && (
                <div style={{
                  flex: 1, padding: '10px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  color: '#92400e',
                  textAlign: 'center',
                }}>
                  ↑ 上のボタンを押してください
                </div>
              )}

              {/* 自動進行中（action=auto）*/}
              {step.action === 'auto' && (
                <div style={{
                  flex: 1, padding: '10px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  color: '#1d4ed8',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  送信中... しばらくお待ちください
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DemoPlayPage() {
  return (
    <Suspense>
      <PlayContent />
    </Suspense>
  );
}
