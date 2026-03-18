'use client';

import { useState, useRef } from 'react';
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
const TAB_IDX = TABS.reduce((acc, t, i) => ({ ...acc, [t]: i }), {} as Record<Tab, number>);

const PHASE_COLORS: Record<Phase, string> = {
  企画:     '#a78bfa',
  デザイン: '#fb923c',
  制作:     '#34d399',
  納品:     '#60a5fa',
};
const PHASE_ICONS: Record<Phase, string> = {
  企画:     '💡',
  デザイン: '🎨',
  制作:     '🔧',
  納品:     '🚀',
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const SLIDE_CSS = `
  @keyframes tabSlideRight {
    from { transform: translateX(28px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes tabSlideLeft {
    from { transform: translateX(-28px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  .tab-slide-right { animation: tabSlideRight 0.22s ease-out; }
  .tab-slide-left  { animation: tabSlideLeft  0.22s ease-out; }

  /* タブバー横スクロール: スクロールバー非表示 */
  .tab-bar { display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .tab-bar::-webkit-scrollbar { display: none; }
`;

export default function StoreDetail({ store }: { store: Store }) {
  const [activeTab, setActiveTab]     = useState<Tab>('タスク');
  const [slideDir, setSlideDir]       = useState<'right' | 'left' | ''>('');
  const [currentPhase, setCurrentPhase] = useState<Phase>(store.currentPhase);
  const [changingPhase, setChangingPhase] = useState(false);
  const [pressedId, setPressedId]     = useState('');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ─── タブ切り替え ──────────────────────────────────────────────────────────
  function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    const dir = TAB_IDX[tab] > TAB_IDX[activeTab] ? 'right' : 'left';
    setSlideDir(dir);
    setActiveTab(tab);
    setTimeout(() => setSlideDir(''), 260);
    // アクティブタブを視野に入れる
    tabRefs.current[tab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // ─── フェーズ変更 ─────────────────────────────────────────────────────────
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

  // ─── ボタン押下感ハンドラー ────────────────────────────────────────────────
  function press(id: string) {
    return {
      onMouseDown:  () => setPressedId(id),
      onMouseUp:    () => setPressedId(''),
      onMouseLeave: () => setPressedId(''),
      onTouchStart: () => setPressedId(id),
      onTouchEnd:   () => setPressedId(''),
    };
  }
  function pressStyle(id: string, base?: React.CSSProperties): React.CSSProperties {
    const active = pressedId === id;
    return {
      ...base,
      transform: active ? 'scale(0.95)' : 'scale(1)',
      boxShadow: active ? 'none' : (base?.boxShadow ?? undefined),
      transition: 'transform 0.1s, box-shadow 0.1s, background 0.15s, opacity 0.15s',
    };
  }

  const slideClass = slideDir === 'right' ? 'tab-slide-right' : slideDir === 'left' ? 'tab-slide-left' : '';

  return (
    <div>
      <style>{SLIDE_CSS}</style>

      {/* ─── フェーズカード ─── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '16px 16px 18px',
        marginBottom: 16,
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-sub)', marginBottom: 12, fontWeight: 600, letterSpacing: 0.5 }}>
          現在のフェーズ
        </p>
        <PhaseBar currentPhase={currentPhase} />

        {/* ② フェーズ手動変更（折りたたみ・補助的扱い）*/}
        <details style={{ marginTop: 14 }}>
          <summary style={{
            fontSize: 11, color: 'var(--color-text-sub)', cursor: 'pointer',
            listStyle: 'none', display: 'flex', alignItems: 'center', gap: 5,
            userSelect: 'none', paddingTop: 10,
            borderTop: '1px solid var(--color-border)',
          }}>
            <span style={{ fontSize: 9 }}>▶</span>
            手動でフェーズを変更する（管理者用）
          </summary>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {PHASES.map((phase) => {
              const isActive = phase === currentPhase;
              const pid = `phase-${phase}`;
              return (
                <button
                  key={phase}
                  onClick={() => changePhase(phase)}
                  disabled={changingPhase}
                  {...press(pid)}
                  style={pressStyle(pid, {
                    flex: '1 0 0', minWidth: 0,
                    padding: '7px 4px', borderRadius: 8,
                    border: `1.5px solid ${PHASE_COLORS[phase]}`,
                    background: isActive ? PHASE_COLORS[phase] : 'transparent',
                    color: isActive ? 'white' : PHASE_COLORS[phase],
                    fontSize: 11, fontWeight: 700,
                    cursor: isActive || changingPhase ? 'default' : 'pointer',
                    opacity: changingPhase && !isActive ? 0.45 : 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 2, whiteSpace: 'nowrap',
                  })}
                >
                  <span style={{ fontSize: 14 }}>{PHASE_ICONS[phase]}</span>
                  <span>{changingPhase && isActive ? '変更中' : phase}</span>
                </button>
              );
            })}
          </div>
        </details>
      </div>

      {/* ─── タブバー（横スクロール・横書き固定）─── */}
      <div
        className="tab-bar"
        style={{
          borderBottom: '2px solid var(--color-border)',
          marginBottom: 16,
          flexWrap: 'nowrap',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const pid = `tab-${tab}`;
          return (
            <button
              key={tab}
              ref={(el) => { tabRefs.current[tab] = el; }}
              onClick={() => switchTab(tab)}
              {...press(pid)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-sub)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                writingMode: 'horizontal-tb',
                textOrientation: 'mixed',
                transform: pressedId === pid ? 'scale(0.95)' : 'scale(1)',
                transition: 'color 0.15s, transform 0.1s',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ─── タブコンテンツ（スライドアニメ）─── */}
      <div className={slideClass}>

        {activeTab === 'タスク' && (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            boxShadow: 'var(--shadow)',
          }}>
            <TaskList
              initialTasks={store.tasks}
              storeId={store.id}
              currentPhase={currentPhase}
              onPhaseAdvance={changePhase}
            />
          </div>
        )}

        {activeTab === '状況' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              boxShadow: 'var(--shadow)',
            }}>
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
            padding: '16px',
            boxShadow: 'var(--shadow)',
          }}>
            <PurchaseItemsPanel storeId={store.id} currentPhase={currentPhase} />
          </div>
        )}

        {activeTab === 'リサーチ' && (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            boxShadow: 'var(--shadow)',
          }}>
            <ResearchPanel storeId={store.id} currentPhase={currentPhase} />
          </div>
        )}

        {activeTab === '提案・相談' && (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            boxShadow: 'var(--shadow)',
          }}>
            <AdminProposalPanel storeId={store.id} currentPhase={currentPhase} />
          </div>
        )}

        {activeTab === '情報・メモ' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              boxShadow: 'var(--shadow)',
            }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: 14, letterSpacing: 0.5 }}>
                基本情報
              </h2>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '店舗名',       value: store.name },
                  { label: '業種',         value: store.category },
                  { label: '開始日',       value: store.startDate },
                  { label: '納期',         value: store.deadline },
                  { label: '現在フェーズ', value: store.currentPhase },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 12 }}>
                    <dt style={{ width: 90, fontSize: 12, color: 'var(--color-text-sub)', flexShrink: 0 }}>
                      {label}
                    </dt>
                    <dd style={{ fontSize: 14, fontWeight: 500 }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              boxShadow: 'var(--shadow)',
            }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: 10, letterSpacing: 0.5 }}>
                メモ
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                {store.memo || 'メモはありません'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
