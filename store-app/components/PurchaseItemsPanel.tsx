'use client';

import { useState, useEffect } from 'react';

type PurchaseItemRow = {
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
  necessity: string;
  phase: string;
  status: string;
  sortOrder: number;
};

const NECESSITY_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  must:        { label: '必須',   bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  recommend:   { label: '推奨',   bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  unnecessary: { label: '不要',   bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
};

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: '未購入',    bg: '#f3f4f6', text: '#374151' },
  purchased: { label: '購入済',    bg: '#ecfdf5', text: '#065f46' },
  skipped:   { label: 'スキップ', bg: '#fff7ed', text: '#c2410c' },
};

type NecessityFilter = 'すべて' | 'must' | 'recommend' | 'unnecessary';
type CategoryTab = '制作備品' | 'おすすめ商品';

export default function PurchaseItemsPanel({
  storeId,
  currentPhase,
}: {
  storeId: string;
  currentPhase: string;
}) {
  const [items, setItems] = useState<PurchaseItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [necessityFilter, setNecessityFilter] = useState<NecessityFilter>('すべて');
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('制作備品');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stores/${storeId}/purchase-items`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (updatingId) return;
    setUpdatingId(itemId);
    // 楽観的更新
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
    );
    try {
      const res = await fetch(`/api/purchase-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // ロールバック
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: items.find((x) => x.id === itemId)?.status ?? 'pending' } : i))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const isRecommendProduct = (item: PurchaseItemRow) => item.category === 'recommend_product';
  const isCraftItem = (item: PurchaseItemRow) => !isRecommendProduct(item);

  const baseItems = items.filter((item) =>
    categoryTab === '制作備品' ? isCraftItem(item) : isRecommendProduct(item)
  );

  const filteredItems = necessityFilter === 'すべて'
    ? baseItems
    : baseItems.filter((item) => item.necessity === necessityFilter);

  const NECESSITY_FILTERS: { key: NecessityFilter; label: string }[] = [
    { key: 'すべて', label: 'すべて' },
    { key: 'must', label: '必須' },
    { key: 'recommend', label: '推奨' },
    { key: 'unnecessary', label: '不要' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            height: 80, borderRadius: 10,
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
          }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* セクションヘッダー */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-sub)', letterSpacing: 0.5, marginBottom: 4 }}>
          🛒 購入備品管理
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>
          現在のフェーズ：<strong>{currentPhase}</strong>
        </p>
      </div>

      {/* カテゴリタブ */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)', marginBottom: 16 }}>
        {(['制作備品', 'おすすめ商品'] as CategoryTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setCategoryTab(tab)}
            style={{
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: categoryTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: categoryTab === tab ? 'var(--color-accent)' : 'var(--color-text-sub)',
              fontSize: 14,
              fontWeight: categoryTab === tab ? 700 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.15s',
            }}
          >
            {tab}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 700,
              padding: '1px 6px', borderRadius: 99,
              background: categoryTab === tab ? 'var(--color-accent)' : '#e5e7eb',
              color: categoryTab === tab ? 'white' : '#6b7280',
            }}>
              {tab === '制作備品'
                ? items.filter(isCraftItem).length
                : items.filter(isRecommendProduct).length}
            </span>
          </button>
        ))}
      </div>

      {/* necessity フィルタタブ（制作備品タブの場合のみ表示） */}
      {categoryTab === '制作備品' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
          {NECESSITY_FILTERS.map(({ key, label }) => {
            const isActive = necessityFilter === key;
            const meta = key !== 'すべて' ? NECESSITY_META[key] : null;
            return (
              <button
                key={key}
                onClick={() => setNecessityFilter(key)}
                style={{
                  padding: '3px 12px', borderRadius: 99,
                  border: `1px solid ${isActive ? (meta?.border ?? 'var(--color-accent)') : 'var(--color-border)'}`,
                  background: isActive ? (meta?.bg ?? 'var(--color-accent-light)') : 'transparent',
                  color: isActive ? (meta?.text ?? 'var(--color-accent)') : 'var(--color-text-sub)',
                  fontSize: 12, fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* アイテム一覧 */}
      {filteredItems.length === 0 ? (
        <p style={{ textAlign: 'center' as const, fontSize: 14, color: 'var(--color-text-sub)', padding: '24px 0' }}>
          該当する備品はありません
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {filteredItems.map((item) => {
            const necessityMeta = NECESSITY_META[item.necessity] ?? NECESSITY_META['recommend'];
            const statusMeta = STATUS_META[item.status] ?? STATUS_META['pending'];
            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: `1px solid ${item.necessity === 'must' ? '#fecaca' : 'var(--color-border)'}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                {/* ヘッダー行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}>
                  {item.emoji && (
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                  )}
                  {/* necessity バッジ */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 8px', borderRadius: 99,
                    fontSize: 11, fontWeight: 700,
                    background: necessityMeta.bg,
                    color: necessityMeta.text,
                    border: `1px solid ${necessityMeta.border}`,
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {necessityMeta.label}
                  </span>
                  {/* tag バッジ */}
                  {item.tag && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 99,
                      fontSize: 11, fontWeight: 700,
                      color: 'white',
                      background: item.tagColor,
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {item.tag}
                    </span>
                  )}
                  {/* phase バッジ */}
                  {item.phase && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 99,
                      fontSize: 11,
                      color: '#6b7280',
                      border: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {item.phase}
                    </span>
                  )}
                </div>

                {/* タイトル */}
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                  {item.name}
                </p>
                {item.brand && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 4 }}>
                    {item.brand}
                    {item.price && <span style={{ marginLeft: 8, fontWeight: 600, color: '#dc2626' }}>{item.price}</span>}
                  </p>
                )}

                {/* 説明文 */}
                {item.desc && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-sub)', lineHeight: 1.7, marginBottom: 12 }}>
                    {item.desc}
                  </p>
                )}

                {/* アクション行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                  {/* status セレクト */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 8px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700,
                      background: statusMeta.bg, color: statusMeta.text,
                    }}>
                      {statusMeta.label}
                    </span>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 6,
                        border: '1px solid var(--color-border)',
                        fontSize: 12, cursor: 'pointer',
                        background: 'white', color: 'var(--color-text)',
                      }}
                    >
                      <option value="pending">未購入</option>
                      <option value="purchased">購入済</option>
                      <option value="skipped">スキップ</option>
                    </select>
                  </div>

                  {/* リンクボタン */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 12px', borderRadius: 6,
                        border: '1px solid var(--color-accent)',
                        background: 'var(--color-accent-light, #eff6ff)',
                        color: 'var(--color-accent)',
                        fontSize: 12, fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      リンクを開く →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
