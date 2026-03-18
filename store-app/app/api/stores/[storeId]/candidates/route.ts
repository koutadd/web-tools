import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId]/candidates?category=vendor|property|signage|...
export async function GET(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category'); // optional filter

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const candidates = await prisma.candidate.findMany({
      where: {
        storeId,
        ...(category ? { category } : {}),
      },
      orderBy: [{ status: 'asc' }, { score: 'desc' }, { createdAt: 'asc' }],
    });

    return ok(
      candidates.map((c) => ({
        id:       c.id,
        category: c.category,
        name:     c.name,
        url:      c.url,
        summary:  c.summary,
        pros:     c.pros,
        cons:     c.cons,
        price:    c.price,
        contact:  c.contact,
        score:    c.score,
        status:   c.status,
      })),
    );
  } catch {
    return err('候補一覧の取得に失敗しました', 500);
  }
}
