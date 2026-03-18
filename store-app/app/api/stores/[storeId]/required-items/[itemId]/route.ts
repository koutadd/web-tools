import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; itemId: string }> }
) {
  const { itemId } = await params;
  try {
    const body = await req.json();
    const item = await prisma.requiredItem.update({
      where: { id: itemId },
      data: body,
    });
    return ok(item);
  } catch {
    return err('必要項目の更新に失敗しました', 500);
  }
}
