import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

const VALID_NECESSITY = ['must', 'recommend', 'unnecessary'] as const;
const VALID_STATUSES  = ['pending', 'purchased', 'skipped'] as const;

// PATCH /api/purchase-items/[id] — ステータス・各フィールド更新
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      status, necessity, name, brand, price,
      url, emoji, tag, tagColor, desc, sortOrder,
    } = body;

    if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return err('ステータスは pending / purchased / skipped のいずれかを指定してください');
    }
    if (necessity !== undefined && !(VALID_NECESSITY as readonly string[]).includes(necessity)) {
      return err('necessity は must / recommend / unnecessary のいずれかを指定してください');
    }

    const existing = await prisma.purchaseItem.findUnique({ where: { id } });
    if (!existing) return err('購入備品が見つかりません', 404);

    const updated = await prisma.purchaseItem.update({
      where: { id },
      data: {
        ...(status    !== undefined && { status }),
        ...(necessity !== undefined && { necessity }),
        ...(name      !== undefined && { name:     String(name).trim() }),
        ...(brand     !== undefined && { brand:    String(brand).trim() }),
        ...(price     !== undefined && { price:    String(price).trim() }),
        ...(url       !== undefined && { url:      String(url).trim() }),
        ...(emoji     !== undefined && { emoji:    String(emoji).trim() }),
        ...(tag       !== undefined && { tag:      String(tag).trim() }),
        ...(tagColor  !== undefined && { tagColor: String(tagColor).trim() }),
        ...(desc      !== undefined && { desc:     String(desc).trim() }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return ok(updated);
  } catch {
    return err('購入備品の更新に失敗しました', 500);
  }
}

// DELETE /api/purchase-items/[id]
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const existing = await prisma.purchaseItem.findUnique({ where: { id } });
    if (!existing) return err('購入備品が見つかりません', 404);
    await prisma.purchaseItem.delete({ where: { id } });
    return ok({ message: '購入備品を削除しました' });
  } catch {
    return err('購入備品の削除に失敗しました', 500);
  }
}
