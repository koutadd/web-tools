import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

const VALID_CATEGORIES = ['vendor', 'property', 'signage', 'printer', 'studio', 'other'] as const;

// POST /api/candidates — 候補作成（管理側）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, category, name, url, summary, pros, cons, price, contact, score } = body;

    if (!storeId || typeof storeId !== 'string') {
      return err('店舗IDは必須です');
    }
    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      return err('カテゴリは vendor / property / signage / printer / studio / other のいずれかを指定してください');
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return err('候補名は必須です');
    }
    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) {
      return err('スコアは0〜100の数値で指定してください');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const candidate = await prisma.candidate.create({
      data: {
        storeId,
        category,
        name: name.trim(),
        url:     typeof url     === 'string' ? url.trim()     : '',
        summary: typeof summary === 'string' ? summary.trim() : '',
        pros:    typeof pros    === 'string' ? pros.trim()    : '',
        cons:    typeof cons    === 'string' ? cons.trim()    : '',
        price:   typeof price   === 'string' ? price.trim()   : '',
        contact: typeof contact === 'string' ? contact.trim() : '',
        score:   typeof score   === 'number' ? score          : 0,
      },
    });

    return ok(candidate, 201);
  } catch {
    return err('候補の作成に失敗しました', 500);
  }
}
