import { PHASES, type Phase } from '@/lib/data';

const PHASE_COLORS: Record<Phase, string> = {
  企画: '#a78bfa',
  デザイン: '#fb923c',
  制作: '#34d399',
  納品: '#60a5fa',
};

export default function PhaseBar({ currentPhase }: { currentPhase: Phase }) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
        }}
      >
        {PHASES.map((phase, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;

          return (
            <div key={phase} style={{ textAlign: 'center' }}>
              {/* ステップ円 + ライン */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                {/* 左ライン */}
                {i > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      background: isDone || isActive ? PHASE_COLORS[phase] : 'var(--color-border)',
                      transition: 'background 0.3s',
                    }}
                  />
                )}

                {/* 円 */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isDone
                      ? PHASE_COLORS[phase]
                      : isActive
                        ? PHASE_COLORS[phase]
                        : 'var(--color-border)',
                    border: isActive ? `3px solid ${PHASE_COLORS[phase]}` : 'none',
                    boxShadow: isActive ? `0 0 0 3px ${PHASE_COLORS[phase]}33` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {isDone ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2,7 5.5,10.5 12,3.5" />
                    </svg>
                  ) : (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isActive ? 'white' : 'transparent',
                      }}
                    />
                  )}
                </div>

                {/* 右ライン */}
                {i < PHASES.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      background:
                        i < currentIndex - 1
                          ? PHASE_COLORS[PHASES[i + 1]]
                          : 'var(--color-border)',
                      transition: 'background 0.3s',
                    }}
                  />
                )}
              </div>

              {/* フェーズ名 */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? PHASE_COLORS[phase]
                    : isDone
                      ? 'var(--color-text-sub)'
                      : '#9ca3af',
                }}
              >
                {phase}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
