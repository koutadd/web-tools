import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

const VALID_CATEGORIES = ['equipment', 'software', 'service', 'consumable', 'recommend_product', 'other'] as const;
const VALID_PHASES     = ['企画', 'デザイン', '制作', '納品', ''] as const;
const VALID_NECESSITY  = ['must', 'recommend', 'unnecessary'] as const;

// POST /api/purchase-items — 購入備品登録（管理側）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId, category, name, brand, price,
      url, emoji, tag, tagColor, desc,
      necessity, phase, status, sortOrder,
    } = body;

    if (!storeId || typeof storeId !== 'string') {
      return err('storeId は必須です');
    }
    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      return err('category は equipment / software / service / consumable / recommend_product / other のいずれかを指定してください');
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return err('備品名は必須です');
    }
    if (necessity !== undefined && !(VALID_NECESSITY as readonly string[]).includes(necessity)) {
      return err('necessity は must / recommend / unnecessary のいずれかを指定してください');
    }
    if (phase !== undefined && !(VALID_PHASES as readonly string[]).includes(phase)) {
      return err('phase は 企画 / デザイン / 制作 / 納品 のいずれかを指定してください');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const item = await prisma.purchaseItem.create({
      data: {
        storeId,
        category,
        name:      name.trim(),
        brand:     typeof brand     === 'string' ? brand.trim()     : '',
        price:     typeof price     === 'string' ? price.trim()     : '',
        url:       typeof url       === 'string' ? url.trim()       : '',
        emoji:     typeof emoji     === 'string' ? emoji.trim()     : '',
        tag:       typeof tag       === 'string' ? tag.trim()       : '',
        tagColor:  typeof tagColor  === 'string' ? tagColor.trim()  : '#6b7280',
        desc:      typeof desc      === 'string' ? desc.trim()      : '',
        necessity: typeof necessity === 'string' ? necessity        : 'recommend',
        phase:     typeof phase     === 'string' ? phase            : '',
        status:    typeof status    === 'string' ? status           : 'pending',
        sortOrder: typeof sortOrder === 'number' ? sortOrder        : 0,
      },
    });

    return ok(item, 201);
  } catch {
    return err('購入備品の作成に失敗しました', 500);
  }
}
