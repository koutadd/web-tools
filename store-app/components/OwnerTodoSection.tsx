'use client';

import { useState } from 'react';

export type TodoItem = {
  id: string;
  label: string;
  reason: string | null;
  dueLabel: string | null;
  category: string;
};

type PhaseColor = { bg: string; text: string; border: string; light: string };

const CATEGORY_ICONS: Record<string, string> = {
  photo:    '📷',
  logo:     '🎨',
  document: '📄',
  access:   '🗺️',
  sns:      '📱',
  other:    '📌',
};

export default function OwnerTodoSection({
  items,
  phaseColor,
  isOwnerWaiting,
}: {
  items: TodoItem[];
  phaseColor: PhaseColor;
  isOwnerWaiting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const topItem   = items[0] ?? null;
  const restItems = items.slice(1);
  const hasRest   = restItems.length > 0;

  const accentColor = isOwnerWaiting ? '#dc2626' : phaseColor.text;
  const borderColor = isOwnerWaiting ? '#fca5a5' : phaseColor.border;
  const bgColor     = isOwnerWaiting ? '#fef2f2' : phaseColor.light;

  // ─── 完了状態 ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <section style={{
        background: 'white',
        border: '1px solid #a7f3d0',
        borderRadius: 14, padding: '20px',
        marginBottom: 16,
        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32, lineHeight: 1 }}>🎉</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#065f46', marginBottom: 3 }}>
              今やることはありません！
            </p>
            <p style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
              担当者が作業を進めています。完成次第ご連絡いたします。
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{
      background: 'white',
      border: `2px solid ${borderColor}`,
      borderRadius: 14,
      marginBottom: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      overflow: 'hidden',
    }}>
      {/* ─── ヘッダー ─── */}
      <div style={{
        padding: '13px 18px',
        background: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 800,
          color: accentColor, letterSpacing: 1.2,
          textTransform: 'uppercase' as const,
        }}>
          {isOwnerWaiting ? '⚡ あなたのやること' : '✅ 担当者が作業中です'}
        </p>
        {items.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
            background: isOwnerWaiting ? '#fecaca' : phaseColor.border,
            color: accentColor,
          }}>
            {items.length}件 対応待ち
          </span>
        )}
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* ─── メインタスク（1件目）─── */}
        {topItem && (
          <div style={{
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 10, padding: '14px 16px',
            marginBottom: hasRest || true ? 12 : 0,
            position: 'relative',
          }}>
            {/* 左帯 */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 4, background: accentColor,
              borderRadius: '10px 0 0 10px',
            }} />

            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>
                  {CATEGORY_ICONS[topItem.category] ?? '📌'}
                </span>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', flex: 1, minWidth: 0 }}>
                  {topItem.label}
                </p>
              </div>

              {topItem.reason && (
                <p style={{
                  fontSize: 13, color: '#4b5563', lineHeight: 1.7,
                  marginBottom: topItem.dueLabel ? 8 : 0,
                }}>
                  {topItem.reason}
                </p>
              )}

              {topItem.dueLabel && (
                <span style={{
                  display: 'inline-block',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                }}>
                  ⏰ {topItem.dueLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── 残りのタスク（折りたたみ）─── */}
        {hasRest && (
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                width: '100%',
                padding: '8px 12px', borderRadius: 8,
                border: '1px solid #e5e7eb', background: '#f9fafb',
                color: '#6b7280', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left' as const,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>他 <strong style={{ color: accentColor }}>{restItems.length}件</strong> の対応が必要です</span>
              <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: 10 }}>▶</span>
            </button>

            {expanded && (
              <div style={{
                marginTop: 6, borderRadius: 8, overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}>
                {restItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 14px',
                      borderTop: idx === 0 ? 'none' : '1px solid #f3f4f6',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
                      {CATEGORY_ICONS[item.category] ?? '📌'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: item.dueLabel ? 3 : 0 }}>
                        {item.label}
                      </p>
                      {item.dueLabel && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                          background: '#fef3c7', color: '#92400e',
                        }}>
                          ⏰ {item.dueLabel}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CTA ─── */}
        <a
          href="#checklist"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 20px', borderRadius: 10,
            background: accentColor, color: 'white',
            fontSize: 14, fontWeight: 800, textDecoration: 'none',
            boxShadow: `0 3px 10px ${accentColor}44`,
          }}
        >
          今すぐ対応する ↓
        </a>
      </div>
    </section>
  );
}
