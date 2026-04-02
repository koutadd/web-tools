import Link from "next/link";
import { stores, PHASES, type Phase } from "@/lib/data";

const phaseColor: Record<Phase, string> = {
  企画: "bg-purple-100 text-purple-700",
  デザイン: "bg-blue-100 text-blue-700",
  制作: "bg-yellow-100 text-yellow-700",
  納品: "bg-green-100 text-green-700",
};

const phaseProgressColor: Record<Phase, string> = {
  企画: "bg-purple-400",
  デザイン: "bg-blue-400",
  制作: "bg-yellow-400",
  納品: "bg-green-500",
};

function getPhaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase);
}

function getTaskSummary(tasks: { status: string }[]) {
  const done = tasks.filter((t) => t.status === "完了").length;
  return { done, total: tasks.length };
}

export default function HomePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm">全{stores.length}件の店舗</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => {
          const phaseIndex = getPhaseIndex(store.currentPhase);
          const progress = Math.round(((phaseIndex + 1) / PHASES.length) * 100);
          const { done, total } = getTaskSummary(store.tasks);

          return (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900 text-base leading-tight">
                    {store.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{store.category}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                    phaseColor[store.currentPhase]
                  }`}
                >
                  {store.currentPhase}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>進捗</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      phaseProgressColor[store.currentPhase]
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  {PHASES.map((phase, i) => (
                    <span
                      key={phase}
                      className={`text-xs ${
                        i <= phaseIndex
                          ? "text-gray-700 font-medium"
                          : "text-gray-300"
                      }`}
                    >
                      {phase}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  タスク完了：{done} / {total}
                </span>
                <span className="text-xs text-blue-500 font-medium">
                  詳細を見る →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
