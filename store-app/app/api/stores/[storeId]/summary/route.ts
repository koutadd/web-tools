import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId]/summary — 管理画面向けサマリ
// 不足情報 / 誰待ち / 期限超過 / 相談多発項目 を集計して返す
export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        requiredItems: {
          include: { submissions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        consultations: true,
        tasks: true,
      },
    });
    if (!store) return err('店舗が見つかりません', 404);

    const now = new Date();

    // ─── 不足項目（status=pending/rejected、まだ未提出）
    const missingItems = store.requiredItems
      .filter((i) => i.status === 'pending' || i.status === 'rejected')
      .map((i) => ({
        id:          i.id,
        category:    i.category,
        label:       i.label,
        status:      i.status,
        whoWaiting:  i.whoWaiting,
        dueLabel:    i.dueLabel,
        dueAt:       i.dueAt,
        requiredPhase: i.requiredPhase,
      }));

    // ─── 誰待ち集計
    const whoWaitingCounts = {
      owner:  store.requiredItems.filter((i) => i.whoWaiting === 'owner').length,
      admin:  store.requiredItems.filter((i) => i.whoWaiting === 'admin').length,
      system: store.requiredItems.filter((i) => i.whoWaiting === 'system').length,
      none:   store.requiredItems.filter((i) => i.whoWaiting === 'none').length,
    };

    // ─── 期限超過項目（dueAt が設定されていて過去、かつ未完了）
    const overdueItems = store.requiredItems
      .filter((i) => i.dueAt && i.dueAt < now && i.status !== 'approved')
      .map((i) => ({
        id:        i.id,
        label:     i.label,
        dueAt:     i.dueAt,
        status:    i.status,
        whoWaiting: i.whoWaiting,
      }));

    // ─── 相談多発項目（targetType=required_item ごとの相談数）
    const consultationsByTarget: Record<string, { targetId: string; count: number; label: string }> = {};
    for (const c of store.consultations) {
      if (c.targetType === 'required_item' && c.targetId) {
        if (!consultationsByTarget[c.targetId]) {
          const item = store.requiredItems.find((i) => i.id === c.targetId);
          consultationsByTarget[c.targetId] = {
            targetId: c.targetId,
            count: 0,
            label: item?.label ?? '（不明）',
          };
        }
        consultationsByTarget[c.targetId].count++;
      }
    }
    const heavyConsultationItems = Object.values(consultationsByTarget)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ─── 相談全体サマリ
    const consultationSummary = {
      total:    store.consultations.length,
      open:     store.consultations.filter((c) => c.status === 'open').length,
      answered: store.consultations.filter((c) => c.status === 'answered').length,
      closed:   store.consultations.filter((c) => c.status === 'closed').length,
    };

    // ─── 提出待ちの required_items（submitted 状態）
    const pendingReviewItems = store.requiredItems
      .filter((i) => i.status === 'submitted')
      .map((i) => ({
        id:          i.id,
        label:       i.label,
        whoWaiting:  i.whoWaiting,
        latestSubmission: i.submissions[0] ?? null,
      }));

    // ─── required_items 完了率
    const total     = store.requiredItems.length;
    const approved  = store.requiredItems.filter((i) => i.status === 'approved').length;
    const completionRate = total > 0 ? approved / total : 0;

    return ok({
      storeId,
      storeName:    store.name,
      currentPhase: store.currentPhase,
      whoWaiting:   store.whoWaiting,
      requiredItemsSummary: {
        total,
        approved,
        submitted: store.requiredItems.filter((i) => i.status === 'submitted').length,
        pending:   store.requiredItems.filter((i) => i.status === 'pending').length,
        rejected:  store.requiredItems.filter((i) => i.status === 'rejected').length,
        completionRate,
      },
      whoWaitingCounts,
      missingItems,
      overdueItems,
      pendingReviewItems,
      heavyConsultationItems,
      consultationSummary,
    });
  } catch {
    return err('サマリの取得に失敗しました', 500);
  }
}
