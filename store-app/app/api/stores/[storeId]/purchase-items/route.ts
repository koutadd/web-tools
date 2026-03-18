import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  try {
    const items = await prisma.purchaseItem.findMany({
      where: { storeId },
      orderBy: [{ necessity: 'asc' }, { sortOrder: 'asc' }],
    });
    return ok(items);
  } catch {
    return err('購入備品一覧の取得に失敗しました', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  try {
    const body = await req.json();
    const item = await prisma.purchaseItem.create({
      data: { storeId, ...body },
    });
    return ok(item, 201);
  } catch {
    return err('購入備品の作成に失敗しました', 500);
  }
}
