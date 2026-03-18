import { prisma } from '@/lib/prisma';
import { ok, err, isValidPhase } from '@/lib/api';

type Ctx = { params: Promise<{ taskId: string }> };

// PATCH /api/tasks/[taskId] — タスク更新（完了フラグ・タイトル・フェーズ）
export async function PATCH(request: Request, { params }: Ctx) {
  const { taskId } = await params;

  try {
    const body = await request.json();
    const { title, done, phase, order } = body;

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return err('タスク名が空です');
    }
    if (done !== undefined && typeof done !== 'boolean') {
      return err('完了フラグはtrue/falseで指定してください');
    }
    if (phase !== undefined && !isValidPhase(phase)) {
      return err('フェーズの値が正しくありません（企画・デザイン・制作・納品のいずれかを指定）');
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return err('タスクが見つかりません', 404);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(done !== undefined && { done }),
        ...(phase !== undefined && { phase }),
        ...(order !== undefined && typeof order === 'number' && { order }),
      },
    });

    return ok(updated);
  } catch {
    return err('タスクの更新に失敗しました', 500);
  }
}

// DELETE /api/tasks/[taskId] — タスク削除
export async function DELETE(_req: Request, { params }: Ctx) {
  const { taskId } = await params;

  try {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return err('タスクが見つかりません', 404);

    await prisma.task.delete({ where: { id: taskId } });
    return ok({ message: 'タスクを削除しました' });
  } catch {
    return err('タスクの削除に失敗しました', 500);
  }
}
