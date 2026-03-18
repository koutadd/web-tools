'use client';

import { useState } from 'react';
import PhaseBar from './PhaseBar';
import TaskList from './TaskList';
import ResearchPanel from './ResearchPanel';
import AdminProposalPanel from './AdminProposalPanel';
import AdminStatusPanel from './AdminStatusPanel';
import EquipmentPanel from './EquipmentPanel';
import PurchaseItemsPanel from './PurchaseItemsPanel';
import { PHASES, type Store, type Phase } from '@/lib/data';

type Tab = 'タスク' | '状況' | '購入備品' | 'リサーチ' | '提案・相談' | '情報・メモ';
const TABS: Tab[] = ['タスク', '状況', '購入備品', 'リサーチ', '提案・相談', '情報・メモ'];

const PHASE_COLORS: Record<Phase, string> = {
  企画: '#a78bfa',
  デザイン: '#fb923c',
  制作: '#34d399',
  納品: '#60a5fa',
};

export default function StoreDetail({ store }: { store: Store }) {
  const [activeTab, setActiveTab] = useState<Tab>('タスク');
  const [currentPhase, setCurrentPhase] = useState<Phase>(store.currentPhase);
  const [changingPhase, setChangingPhase] = useState(false);

  const changePhase = async (phase: Phase) => {
    if (phase === currentPhase || changingPhase) return;
    const prev = currentPhase;
    setCurrentPhase(phase);
    setChangingPhase(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPhase: phase }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCurrentPhase(prev);
    } finally {
      setChangingPhase(false);
    }
  };

  return (
    <div>
      {/* フェーズバー */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: 20,
          boxShadow: 'var(--shadow)',
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-sub)',
            marginBottom: 14,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          現在のフェーズ
        </p>
        <PhaseBar currentPhase={currentPhase} />

        {/* フェーズ変更ボタン */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-text-sub)', whiteSpace: 'nowrap' }}>
            フェーズを変更：
          </span>
          {PHASES.map((phase) => {
            const isActive = phase === currentPhase;
            return (
              <button
                key={phase}
                onClick={() => changePhase(phase)}
                disabled={changingPhase}
                style={{
                  padding: '4px 16px',
                  borderRadius: 99,
                  border: `2px solid ${PHASE_COLORS[phase]}`,
                  background: isActive ? PHASE_COLORS[phase] : 'transparent',
                  color: isActive ? 'white' : PHASE_COLORS[phase],
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                  cursor: isActive || changingPhase ? 'default' : 'pointer',
                  opacity: changingPhase && !isActive ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {phase}
              </button>
            );
          })}
        </div>
      </div>

      {/* タブ */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid var(--color-border)',
          marginBottom: 20,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-sub)',
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'タスク' && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <TaskList initialTasks={store.tasks} storeId={store.id} />
        </div>
      )}

      {activeTab === '状況' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <AdminStatusPanel
              storeId={store.id}
              currentPhase={currentPhase}
              storeName={store.name}
              deadline={store.deadline}
            />
          </div>
          <EquipmentPanel currentPhase={currentPhase} />
        </div>
      )}

      {activeTab === '購入備品' && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow)',
        }}>
          <PurchaseItemsPanel storeId={store.id} currentPhase={currentPhase} />
        </div>
      )}

      {activeTab === 'リサーチ' && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <ResearchPanel storeId={store.id} currentPhase={currentPhase} />
        </div>
      )}

      {activeTab === '提案・相談' && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <AdminProposalPanel storeId={store.id} currentPhase={currentPhase} />
        </div>
      )}

      {activeTab === '情報・メモ' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 基本情報 */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text-sub)',
                marginBottom: 16,
              }}
            >
              基本情報
            </h2>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '店舗名', value: store.name },
                { label: '業種', value: store.category },
                { label: '開始日', value: store.startDate },
                { label: '納期', value: store.deadline },
                { label: '現在フェーズ', value: store.currentPhase },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 16 }}>
                  <dt
                    style={{
                      width: 100,
                      fontSize: 13,
                      color: 'var(--color-text-sub)',
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </dt>
                  <dd style={{ fontSize: 14, fontWeight: 500 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* メモ */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text-sub)',
                marginBottom: 12,
              }}
            >
              メモ
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                color: 'var(--color-text)',
              }}
            >
              {store.memo || 'メモはありません'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
