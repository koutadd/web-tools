'use client';

import { useState, useCallback } from 'react';

export type PurchaseItemData = {
  id: string;
  category: string;
  name: string;
  brand: string;
  price: string;
  url: string;
  emoji: string;
  tag: string;
  tagColor: string;
  desc: string;
  notes: string;
  necessity: string;
  phase: string;
  status: string;
};

const NECESSITY_META: Record<string, { label: string; bg: string; text: string; border: string; accent: string }> = {
  must:        { label: '必須',   bg: '#fef2f2', text: '#dc2626', border: '#fecaca', accent: '#dc2626' },
  recommend:   { label: '推奨',   bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', accent: '#2563eb' },
  unnecessary: { label: '不要',   bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb', accent: '#9ca3af' },
};

// カテゴリ別「おすすめの選び方」静的ヒント
const SELECTION_TIPS: Record<string, string> = {
  equipment:        'レビューを確認してから購入しましょう。まず1点試してから追加購入するのがおすすめです。担当者に確認したい場合は「相談する」からお気軽にどうぞ。',
  software:         '無料トライアルがあれば試してから契約を検討しましょう。複数人で使う場合はライセンス数の上限も確認してください。',
  service:          'サポート範囲と費用を事前に確認してください。担当者と相談してから選ぶと安心です。',
  consumable:       '使用頻度を考慮してまとめ買いするとコスパが良くなります。保管場所の確保も忘れずに。',
  recommend_product:'実際に使ってみてから追加購入を検討するのがおすすめです。お客様へのご紹介にもお役立てください。',
  other:            '不明な点は担当者にお気軽にご相談ください。一緒に最適なものを選びます。',
};

const PHASE_LABEL: Record<string, string> = {
  '企画': '企画フェーズまでに',
  'デザイン': 'デザイン開始前まで',
  '制作': '制作フェーズまでに',
  '納品': '公開前まで',
  '': '時期は担当者と確認',
};

// ─── 購入状態トグルボタン ────────────────────────────────────────────────────

function PurchaseToggle({
  itemId,
  initialStatus,
  necessity,
}: {
  itemId: string;
  initialStatus: string;
  necessity: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = status === 'purchased' ? 'pending' : 'purchased';
      setStatus(next); // 楽観的更新
      setLoading(true);
      try {
        await fetch(`/api/purchase-items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
      } catch {
        setStatus(status); // 失敗時ロールバック
      } finally {
        setLoading(false);
      }
    },
    [itemId, status],
  );

  const isPurchased = status === 'purchased';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: 99, flexShrink: 0,
        fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
        background: isPurchased ? '#dcfce7' : (necessity === 'must' ? '#fef2f2' : '#f3f4f6'),
        color: isPurchased ? '#15803d' : (necessity === 'must' ? '#dc2626' : '#6b7280'),
        transition: 'all 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 13 }}>{isPurchased ? '✅' : (necessity === 'must' ? '⚠️' : '○')}</span>
      {isPurchased ? '購入済' : (necessity === 'must' ? '未購入' : '未購入')}
    </button>
  );
}

// ─── 商品詳細モーダル ─────────────────────────────────────────────────────────

function ItemDetailModal({
  item,
  onClose,
}: {
  item: PurchaseItemData;
  onClose: () => void;
}) {
  const meta = NECESSITY_META[item.necessity] ?? NECESSITY_META['recommend'];
  const phaseLabel = PHASE_LABEL[item.phase] ?? item.phase;
  const selectionTip = SELECTION_TIPS[item.category] ?? SELECTION_TIPS['other'];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 60,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 40px',
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* ドラッグバー */}
        <div style={{
          width: 40, height: 4, borderRadius: 99,
          background: '#e5e7eb', margin: '0 auto 20px',
        }} />

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: meta.bg, border: `1px solid ${meta.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {item.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
              }}>
                {meta.label}
              </span>
              {item.tag && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: item.tagColor + '18', color: item.tagColor,
                  border: `1px solid ${item.tagColor}44`,
                }}>
                  {item.tag}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.4, marginBottom: 3 }}>
              {item.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-sub)' }}>
              {item.brand}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: '#f3f4f6', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#6b7280', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* 価格 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: '#f9fafb', border: '1px solid var(--color-border)',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-sub)' }}>参考価格</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{item.price}</span>
          {item.price !== '無料' && <span style={{ fontSize: 12, color: '#9ca3af' }}>〜</span>}
        </div>

        {/* 3つの詳細ブロック */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>

          {/* なぜ必要か */}
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: meta.bg, border: `1px solid ${meta.border}`,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: meta.text, marginBottom: 6, letterSpacing: 0.5 }}>
              なぜ必要ですか？
            </p>
            <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7 }}>
              {item.desc}
            </p>
          </div>

          {/* いつまでに */}
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: '#fffbeb', border: '1px solid #fde68a',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6, letterSpacing: 0.5 }}>
              いつまでに必要ですか？
            </p>
            <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.7, fontWeight: 600 }}>
              {phaseLabel}
            </p>
            {item.phase && (
              <p style={{ fontSize: 12, color: '#92400e', marginTop: 4, lineHeight: 1.6 }}>
                現在の進行フェーズに合わせて、早めにご準備をお願いします。
              </p>
            )}
          </div>

          {/* 買う時の注意点 */}
          {item.notes && (
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: '#f0f9ff', border: '1px solid #bae6fd',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 6, letterSpacing: 0.5 }}>
                ⚠️ 買う時の注意点
              </p>
              <p style={{ fontSize: 14, color: '#0c4a6e', lineHeight: 1.7 }}>
                {item.notes}
              </p>
            </div>
          )}

          {/* おすすめの選び方 */}
          {item.necessity !== 'unnecessary' && (
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: '#f8fafc', border: '1px solid #e2e8f0',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: 0.5 }}>
                📌 おすすめの選び方
              </p>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.75 }}>
                {selectionTip}
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '14px',
              borderRadius: 12, border: 'none',
              background: item.necessity === 'must' ? '#dc2626' : meta.accent,
              color: 'white', fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: `0 3px 12px ${meta.accent}44`,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.emoji}</span>
            {item.category === 'recommend_product' ? 'Amazonで見る' : '詳細・購入ページを開く'}
            <span style={{ fontSize: 16 }}>→</span>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 商品カード ────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onDetail,
  compact = false,
}: {
  item: PurchaseItemData;
  onDetail: (item: PurchaseItemData) => void;
  compact?: boolean;
}) {
  const meta = NECESSITY_META[item.necessity] ?? NECESSITY_META['recommend'];
  const isPurchased = item.status === 'purchased';

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${isPurchased ? '#bbf7d0' : item.necessity === 'must' ? meta.border : 'var(--color-border)'}`,
        background: isPurchased ? '#f0fdf4' : item.necessity === 'must' ? meta.bg : 'white',
        boxShadow: !isPurchased && item.necessity === 'must' ? `0 0 0 2px ${meta.border}` : 'none',
        overflow: 'hidden',
      }}
    >
      {/* 必須・未購入の警告バナー */}
      {item.necessity === 'must' && !isPurchased && (
        <div style={{
          background: '#dc2626', color: 'white',
          fontSize: 11, fontWeight: 700, padding: '4px 14px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span>⚠️</span> ※必ず購入してください ─ 出店に必須です
        </div>
      )}

      <button
        onClick={() => onDetail(item)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: compact ? '10px 12px' : '13px 14px',
          background: 'none', border: 'none',
          textAlign: 'left', cursor: 'pointer', width: '100%',
        }}
      >
        {/* アイコン */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: isPurchased ? '#dcfce7' : meta.bg,
          border: `1px solid ${isPurchased ? '#86efac' : meta.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, position: 'relative',
        }}>
          {item.emoji}
          {isPurchased && (
            <span style={{
              position: 'absolute', bottom: -4, right: -4,
              fontSize: 14, lineHeight: 1,
            }}>✅</span>
          )}
        </div>

        {/* テキスト */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-block',
              padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
              flexShrink: 0,
            }}>
              {meta.label}
            </span>
            {item.phase && (
              <span style={{
                display: 'inline-block',
                padding: '1px 7px', borderRadius: 99, fontSize: 10,
                background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
                flexShrink: 0,
              }}>
                {PHASE_LABEL[item.phase] ?? item.phase}
              </span>
            )}
          </div>
          <p style={{
            fontSize: 14, fontWeight: 700,
            color: isPurchased ? '#15803d' : 'var(--color-text)',
            marginBottom: 2, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textDecoration: isPurchased ? 'line-through' : 'none',
          }}>
            {item.name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>
            {item.brand}
            {item.price && <span style={{ marginLeft: 8, color: '#dc2626', fontWeight: 700 }}>{item.price}〜</span>}
          </p>
        </div>

        {/* 矢印 */}
        <span style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}>›</span>
      </button>

      {/* 購入トグル行 */}
      <div style={{
        padding: '0 14px 12px',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <PurchaseToggle
          itemId={item.id}
          initialStatus={item.status}
          necessity={item.necessity}
        />
      </div>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────

export default function OwnerPurchaseSection({
  items,
}: {
  items: PurchaseItemData[];
}) {
  const [detailItem, setDetailItem] = useState<PurchaseItemData | null>(null);
  const [activeTab, setActiveTab] = useState<'equipment' | 'products'>('equipment');

  const equipmentItems = items.filter((i) => i.category !== 'recommend_product');
  const productItems   = items.filter((i) => i.category === 'recommend_product');

  const mustItems      = equipmentItems.filter((i) => i.necessity === 'must');
  const recommendItems = equipmentItems.filter((i) => i.necessity === 'recommend');

  return (
    <section style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      marginBottom: 16,
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
    }}>
      {/* ヘッダー */}
      <div style={{ padding: '16px 20px 0' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', letterSpacing: 0.5, marginBottom: 12 }}>
          🛒 備品・おすすめ商品
        </p>

        {/* タブ */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)' }}>
          {[
            { key: 'equipment' as const, label: `制作に必要なもの（${equipmentItems.length}件）` },
            { key: 'products'  as const, label: `アイケア商品（${productItems.length}件）` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 14px',
                background: 'none', border: 'none',
                borderBottom: activeTab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: activeTab === key ? 'var(--color-accent)' : 'var(--color-text-sub)',
                fontSize: 13, fontWeight: activeTab === key ? 700 : 400,
                cursor: 'pointer', marginBottom: '-2px',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 制作備品タブ */}
      {activeTab === 'equipment' && (
        <div style={{ padding: '16px 20px 20px' }}>
          {mustItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: '#dc2626',
                letterSpacing: 0.5, marginBottom: 8,
              }}>
                必須 — 制作前に準備が必要なもの
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mustItems.map((item) => (
                  <ItemCard key={item.id} item={item} onDetail={setDetailItem} />
                ))}
              </div>
            </div>
          )}

          {recommendItems.length > 0 && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, color: '#1d4ed8',
                letterSpacing: 0.5, marginBottom: 8,
              }}>
                推奨 — あると制作がスムーズになるもの
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendItems.map((item) => (
                  <ItemCard key={item.id} item={item} onDetail={setDetailItem} compact />
                ))}
              </div>
            </div>
          )}

          {equipmentItems.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-sub)', textAlign: 'center', padding: '20px 0' }}>
              備品データがありません
            </p>
          )}
        </div>
      )}

      {/* おすすめ商品タブ */}
      {activeTab === 'products' && (
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 12, lineHeight: 1.6 }}>
            アイケアラボからのおすすめ商品です。商品名をタップすると詳細・注意点をご確認いただけます。
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}>
            {productItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setDetailItem(item)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  padding: '12px', borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'box-shadow 0.15s',
                }}
              >
                {/* タグ */}
                <span style={{
                  display: 'inline-block',
                  fontSize: 10, fontWeight: 700,
                  color: 'white', background: item.tagColor,
                  padding: '2px 7px', borderRadius: 99, alignSelf: 'flex-start',
                }}>
                  {item.tag}
                </span>
                {/* アイコン＋タイトル */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
                    {item.name}
                  </span>
                </div>
                {/* ブランド・価格 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-sub)' }}>{item.brand}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>{item.price}〜</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-sub)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
                <div style={{
                  marginTop: 2, padding: '6px 0', borderRadius: 6,
                  background: '#ff9900', color: 'white',
                  fontSize: 11, fontWeight: 700, textAlign: 'center',
                }}>
                  詳細を見る →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 商品詳細モーダル */}
      {detailItem && (
        <ItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </section>
  );
}
