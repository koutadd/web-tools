'use client';

import { useState } from 'react';
import {
  getEquipmentByPhase,
  EQUIPMENT_STATUS_META,
  PRIORITY_META,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';
import { type Phase } from '@/lib/data';

// ─── ステータス循環 ──────────────────────────────────────────────────────────

const STATUS_ORDER: EquipmentStatus[] = ['未購入', '注文済み', '購入済み', '不要'];

function nextStatus(current: EquipmentStatus): EquipmentStatus {
  return STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
}

// ─── 商品詳細モーダル ────────────────────────────────────────────────────────

function DetailModal({
  item,
  onClose,
}: {
  item: EquipmentItem;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<EquipmentStatus>(item.status);
  const [consulting, setConsulting] = useState(false);
  const [consultText, setConsultText] = useState('');
  const [sent, setSent] = useState(false);
  const priorityMeta = PRIORITY_META[item.priority];
  const statusMeta = EQUIPMENT_STATUS_META[status];

  const handleConsult = () => {
    if (!consultText.trim()) return;
    setSent(true);
    setTimeout(() => { setConsulting(false); setConsultText(''); setSent(false); }, 2200);
  };

  return (
    // オーバーレイ
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      {/* モーダル本体 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 520,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '0 0 32px',
        }}
      >
        {/* ドラッグハンドル */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb' }} />
        </div>

        {/* ヘッダー */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{item.emoji}</span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                {item.title}
              </h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                  background: priorityMeta.bg, border: `1px solid ${priorityMeta.border}`,
                  color: priorityMeta.text, fontSize: 11, fontWeight: 700,
                }}>
                  {priorityMeta.label}
                </span>
                {item.tag && (
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                    background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 500,
                  }}>
                    {item.tag}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#f3f4f6', border: 'none',
              fontSize: 16, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* 画像プレースホルダー */}
        <div style={{
          margin: '16px 20px',
          height: 140,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px dashed #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6,
        }}>
          <span style={{ fontSize: 36 }}>{item.emoji}</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>商品イメージ</span>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 価格 + ステータス */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 10,
            background: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            <div>
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>参考価格</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{item.price}</p>
            </div>
            <button
              onClick={() => setStatus(nextStatus(status))}
              style={{
                padding: '6px 16px', borderRadius: 99,
                background: statusMeta.bg, border: `1px solid ${statusMeta.border}`,
                color: statusMeta.text, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {statusMeta.label} ▸ 変更
            </button>
          </div>

          {/* いつまでに */}
          {item.deadline && (
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: '#fff7ed', border: '1px solid #fed7aa',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>
                ⏰ いつまでに必要か
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
                {item.deadline} までに準備をお願いします
              </p>
            </div>
          )}

          {/* なぜ必要か */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              💡 なぜ必要か
            </p>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
              {item.reason}
            </p>
          </div>

          {/* 買う時の注意点 */}
          {item.purchaseNotes && (
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: '#fefce8', border: '1px solid #fde68a',
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                ⚠️ 買う時の注意点
              </p>
              <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
                {item.purchaseNotes}
              </p>
            </div>
          )}

          {/* おすすめの選び方 */}
          {item.criteria && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                📌 おすすめの選び方
              </p>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>
                {item.criteria}
              </p>
            </div>
          )}

          {/* Amazonボタン */}
          <a
            href={item.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 0', borderRadius: 12,
              background: '#ff9900', color: 'white',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}
          >
            🛒 Amazonで見てみる
          </a>

          {/* 相談フォーム */}
          {!consulting ? (
            <button
              onClick={() => setConsulting(true)}
              style={{
                padding: '12px 0', borderRadius: 12,
                background: 'white', border: '1px solid #e5e7eb',
                color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              💬 担当者に相談する
            </button>
          ) : sent ? (
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                ✅ 送信しました。担当者より返信いたします。
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                「{item.title}」について相談する
              </p>
              <textarea
                value={consultText}
                onChange={(e) => setConsultText(e.target.value)}
                placeholder="ご質問・ご相談内容をご記入ください"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13, resize: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleConsult}
                  disabled={!consultText.trim()}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                    background: consultText.trim() ? '#3b82f6' : '#e5e7eb',
                    color: consultText.trim() ? 'white' : '#9ca3af',
                    fontSize: 13, fontWeight: 700,
                    cursor: consultText.trim() ? 'pointer' : 'default',
                  }}
                >
                  送信する
                </button>
                <button
                  onClick={() => { setConsulting(false); setConsultText(''); }}
                  style={{
                    padding: '10px 16px', borderRadius: 8,
                    background: 'none', border: '1px solid #e5e7eb',
                    color: '#6b7280', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── コンパクトアイテムカード ────────────────────────────────────────────────

function ItemCard({
  item,
  onDetail,
}: {
  item: EquipmentItem;
  onDetail: (item: EquipmentItem) => void;
}) {
  const [status, setStatus] = useState<EquipmentStatus>(item.status);
  const statusMeta = EQUIPMENT_STATUS_META[status];
  const priorityMeta = PRIORITY_META[item.priority];
  const isDone = status === '購入済み' || status === '不要';

  return (
    <div
      style={{
        background: isDone ? '#f9fafb' : 'white',
        border: `1px solid ${isDone ? '#e5e7eb' : item.priority === '必須' ? '#fecaca' : '#e5e7eb'}`,
        borderRadius: 12,
        padding: '14px 16px',
        opacity: isDone ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* 上段: emoji + タイトル + 優先度バッジ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              {item.title}
            </span>
            <span style={{
              padding: '1px 8px', borderRadius: 99,
              background: priorityMeta.bg, border: `1px solid ${priorityMeta.border}`,
              color: priorityMeta.text, fontSize: 10, fontWeight: 700,
            }}>
              {priorityMeta.label}
            </span>
          </div>
          {/* 価格 + 期限 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{item.price}</span>
            {item.deadline && (
              <span style={{
                fontSize: 10, padding: '1px 7px', borderRadius: 99,
                background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontWeight: 600,
              }}>
                期限: {item.deadline}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 理由（1行省略） */}
      <p style={{
        fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 10,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
      }}>
        {item.reason}
      </p>

      {/* 下段: ステータス + アクションボタン */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setStatus(nextStatus(status))}
          style={{
            padding: '5px 12px', borderRadius: 99,
            background: statusMeta.bg, border: `1px solid ${statusMeta.border}`,
            color: statusMeta.text, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {statusMeta.label} ▸
        </button>
        <button
          onClick={() => onDetail(item)}
          style={{
            padding: '5px 12px', borderRadius: 99,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            color: '#374151', fontSize: 11, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          詳しく見る →
        </button>
        <a
          href={item.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '5px 12px', borderRadius: 99,
            background: '#ff9900', color: 'white',
            fontSize: 11, fontWeight: 700, textDecoration: 'none',
          }}
        >
          🛒 Amazon
        </a>
      </div>
    </div>
  );
}

// ─── セクションヘッダー ──────────────────────────────────────────────────────

function SectionHeader({
  label, count, bg, text, border, icon,
}: {
  label: string; count: number; bg: string; text: string; border: string; icon: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 8,
      background: bg, border: `1px solid ${border}`,
      marginBottom: 10,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: text }}>{label}</span>
      <span style={{
        marginLeft: 'auto', fontSize: 11, fontWeight: 700,
        padding: '1px 8px', borderRadius: 99,
        background: 'rgba(255,255,255,0.7)', color: text,
      }}>
        {count}件
      </span>
    </div>
  );
}

// ─── メインパネル ────────────────────────────────────────────────────────────

export default function EquipmentPanel({ currentPhase }: { currentPhase: Phase }) {
  const [detailItem, setDetailItem] = useState<EquipmentItem | null>(null);
  const [showRecommended, setShowRecommended] = useState(false);

  const items = getEquipmentByPhase(currentPhase);
  const requiredItems = items.filter((i) => i.priority === '必須');
  const recommendedItems = items.filter((i) => i.priority === '推奨');

  if (items.length === 0) return null;

  const pendingRequired = requiredItems.filter((i) => i.status === '未購入').length;

  return (
    <>
      {/* モーダル */}
      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}

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
        {/* パネルヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 2 }}>
              🛍️ 購入備品・推奨品
            </p>
            <p style={{ fontSize: 11, color: '#6b7280' }}>
              このフェーズで準備しておくと良いものです
            </p>
          </div>
          {pendingRequired > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            }}>
              必須 {pendingRequired}件未購入
            </span>
          )}
        </div>

        {/* ── 必須品 ── */}
        {requiredItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader
              label="必須品"
              count={requiredItems.length}
              bg="#fef2f2" text="#dc2626" border="#fecaca"
              icon="🔴"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requiredItems.map((item) => (
                <ItemCard key={item.id} item={item} onDetail={setDetailItem} />
              ))}
            </div>
          </div>
        )}

        {/* ── 推奨品 ── */}
        {recommendedItems.length > 0 && (
          <div>
            <button
              onClick={() => setShowRecommended(!showRecommended)}
              style={{
                width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left' as const,
              }}
            >
              <SectionHeader
                label={`推奨品 ${showRecommended ? '▲' : '▼'}`}
                count={recommendedItems.length}
                bg="#eff6ff" text="#1d4ed8" border="#bfdbfe"
                icon="🔵"
              />
            </button>
            {showRecommended && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="animate-slide-down">
                {recommendedItems.map((item) => (
                  <ItemCard key={item.id} item={item} onDetail={setDetailItem} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
