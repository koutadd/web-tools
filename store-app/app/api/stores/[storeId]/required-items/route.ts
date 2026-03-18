import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId]/required-items?category=photo&whoWaiting=owner&status=pending
// 写真ガイド情報（isPhotoRequired=true の場合は guideChecklist も含む）を含めて返す
export async function GET(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  const { searchParams } = new URL(request.url);
  const category   = searchParams.get('category');   // optional
  const whoWaiting = searchParams.get('whoWaiting'); // optional
  const status     = searchParams.get('status');     // optional

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const items = await prisma.requiredItem.findMany({
      where: {
        storeId,
        ...(category   ? { category }   : {}),
        ...(whoWaiting ? { whoWaiting } : {}),
        ...(status     ? { status }     : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // 最新の提出のみ
        },
      },
    });

    return ok(
      items.map((item) => {
        // guideChecklistJson をパースして返す（パース失敗時は空配列）
        let guideChecklist: unknown[] = [];
        try {
          guideChecklist = JSON.parse(item.guideChecklistJson);
        } catch {
          // ignore
        }

        return {
          id:                   item.id,
          category:             item.category,
          label:                item.label,
          description:          item.description,
          requiredPhase:        item.requiredPhase,
          assigneeType:         item.assigneeType,
          assigneeName:         item.assigneeName,
          ownerResponsibleName: item.ownerResponsibleName,
          adminResponsibleName: item.adminResponsibleName,
          whoWaiting:           item.whoWaiting,
          dueAt:                item.dueAt,
          dueLabel:             item.dueLabel,
          reason:               item.reason,
          status:               item.status,
          sortOrder:            item.sortOrder,
          // 写真ガイド
          isPhotoRequired:      item.isPhotoRequired,
          guide: item.isPhotoRequired
            ? {
                title:           item.guideTitle,
                description:     item.guideDescription,
                checklist:       guideChecklist,
                exampleImageKey: item.guideExampleImageKey,
              }
            : null,
          // 最新提出
          latestSubmission: item.submissions[0] ?? null,
        };
      }),
    );
  } catch {
    return err('必要項目一覧の取得に失敗しました', 500);
  }
}
