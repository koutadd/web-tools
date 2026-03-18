import { prisma } from '@/lib/prisma';
import { ok, err, isValidPhase } from '@/lib/api';

// GET /api/stores — 店舗一覧（タスク件数・完了数を含む）
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        tasks: {
          select: { id: true, title: true, done: true, phase: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = stores.map((s) => {
      const nextTask = s.tasks.find((t) => !t.done) ?? null;
      return {
        id: s.id,
        name: s.name,
        contactName: s.contactName,
        location: s.location,
        openStatus: s.openStatus,
        staffReadiness: s.staffReadiness,
        currentPhase: s.currentPhase,
        startDate: s.startDate,
        deadline: s.deadline,
        memo: s.memo,
        taskCount: s.tasks.length,
        taskDoneCount: s.tasks.filter((t) => t.done).length,
        nextTask: nextTask ? { id: nextTask.id, title: nextTask.title, phase: nextTask.phase } : null,
      };
    });

    return ok(result);
  } catch {
    return err('店舗一覧の取得に失敗しました', 500);
  }
}

// POST /api/stores — 店舗作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, currentPhase, startDate, deadline, memo,
      contactName, contactInfo, location, businessHours,
      openStatus, staffReadiness,
    } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return err('店舗名は必須です');
    }
    if (!isValidPhase(currentPhase)) {
      return err('フェーズの値が正しくありません（企画・デザイン・制作・納品のいずれかを指定）');
    }
    if (!startDate || typeof startDate !== 'string') {
      return err('開始日は必須です（YYYY-MM-DD形式）');
    }
    if (!deadline || typeof deadline !== 'string') {
      return err('出店予定日は必須です（YYYY-MM-DD形式）');
    }

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        category: '',
        currentPhase,
        startDate,
        deadline,
        memo: typeof memo === 'string' ? memo.trim() : '',
        contactName: typeof contactName === 'string' ? contactName.trim() : '',
        contactInfo: typeof contactInfo === 'string' ? contactInfo.trim() : '',
        location: typeof location === 'string' ? location.trim() : '',
        businessHours: typeof businessHours === 'string' ? businessHours.trim() : '',
        openStatus: typeof openStatus === 'string' ? openStatus : '準備前',
        staffReadiness: typeof staffReadiness === 'string' ? staffReadiness : '未定',
      },
    });

    return ok(store, 201);
  } catch {
    return err('店舗の作成に失敗しました', 500);
  }
}
