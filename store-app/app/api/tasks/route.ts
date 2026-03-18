import { prisma } from '@/lib/prisma';
import { ok, err, isValidPhase } from '@/lib/api';

// POST /api/tasks — タスク作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, title, phase, done, order } = body;

    if (!storeId || typeof storeId !== 'string') {
      return err('店舗IDは必須です');
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return err('タスク名は必須です');
    }
    if (!isValidPhase(phase)) {
      return err('フェーズの値が正しくありません（企画・デザイン・制作・納品のいずれかを指定）');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    // order 省略時は既存タスク最大値 + 1
    let taskOrder = typeof order === 'number' ? order : 0;
    if (typeof order !== 'number') {
      const maxTask = await prisma.task.findFirst({
        where: { storeId },
        orderBy: { order: 'desc' },
      });
      taskOrder = maxTask ? maxTask.order + 1 : 0;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        phase,
        done: typeof done === 'boolean' ? done : false,
        order: taskOrder,
        storeId,
      },
    });

    return ok(task, 201);
  } catch {
    return err('タスクの作成に失敗しました', 500);
  }
}
