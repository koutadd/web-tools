import { prisma } from '@/lib/prisma';
import { ok, err, type ValidPhase } from '@/lib/api';
import { PHASE_TIPS } from '@/lib/suggestions';
import { getRulesForPhase } from '@/lib/suggestionRules';
import { computeDynamicAlerts } from '@/lib/suggestionEngine';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId]/suggestions?audience=owner|admin
// 静的ルールを DB upsert し、動的アラートと合わせて返す
export async function GET(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  const { searchParams } = new URL(request.url);
  const audienceFilter = searchParams.get('audience'); // 'owner' | 'admin' | null(全件)

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        tasks:             { orderBy: { order: 'asc' } },
        requiredItems:     { orderBy: { sortOrder: 'asc' } },
        uploadDestination: true,
        consultations:     { select: { id: true, status: true } },
      },
    });
    if (!store) return err('店舗が見つかりません', 404);

    const phase = store.currentPhase as ValidPhase;

    // ─── 静的ルールを DB に upsert（dismissed/done は上書きしない）───
    const rules = getRulesForPhase(phase);
    await Promise.all(
      rules.map((rule) =>
        prisma.suggestion.upsert({
          where: {
            storeId_sourceType_sourceRef: {
              storeId,
              sourceType: 'rule',
              sourceRef: rule.ruleId,
            },
          },
          update: {}, // status(dismissed等)は保持
          create: {
            storeId,
            audience:    rule.audience,
            category:    rule.category,
            title:       rule.title,
            description: rule.description,
            reason:      rule.reason,
            priority:    rule.priority,
            dueLabel:    rule.dueLabel,
            link:        rule.link,
            phase:       rule.phase,
            sourceType:  'rule',
            sourceRef:   rule.ruleId,
          },
        }),
      ),
    );

    // ─── DB から active な提案を取得 ──────────────────────────────────
    const dbSuggestions = await prisma.suggestion.findMany({
      where: {
        storeId,
        phase,
        status: 'active',
        ...(audienceFilter ? { audience: audienceFilter } : {}),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    // ─── 動的アラート生成 ──────────────────────────────────────────────
    const allAlerts = computeDynamicAlerts({
      store,
      tasks:             store.tasks,
      requiredItems:     store.requiredItems,
      uploadDestination: store.uploadDestination,
      consultations:     store.consultations,
    });
    const alerts = audienceFilter
      ? allAlerts.filter((a) => a.audience === audienceFilter)
      : allAlerts;

    // ─── 未完了タスク先頭 ──────────────────────────────────────────────
    const nextTask = store.tasks.find((t) => !t.done) ?? null;

    return ok({
      storeId,
      storeName:    store.name,
      currentPhase: phase,
      nextTask:     nextTask
        ? { id: nextTask.id, title: nextTask.title, phase: nextTask.phase }
        : null,
      phaseTips: PHASE_TIPS[phase] ?? [],
      // 静的ルールベース提案（DB保存済み、dismissible）
      suggestions: dbSuggestions.map((s) => ({
        id:          s.id,
        audience:    s.audience,
        category:    s.category,
        title:       s.title,
        description: s.description,
        reason:      s.reason,
        priority:    s.priority,
        dueLabel:    s.dueLabel,
        link:        s.link,
        status:      s.status,
        sourceType:  s.sourceType,
        sourceRef:   s.sourceRef,
      })),
      // 動的アラート（毎回計算、DB非保存）
      alerts,
    });
  } catch {
    return err('提案データの取得に失敗しました', 500);
  }
}
