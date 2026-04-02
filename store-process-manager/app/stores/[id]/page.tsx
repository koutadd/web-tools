"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStore, PHASES, type Phase, type TaskStatus } from "@/lib/data";

const phaseColor: Record<Phase, { bg: string; text: string; ring: string }> = {
  企画: { bg: "bg-purple-500", text: "text-purple-700", ring: "ring-purple-300" },
  デザイン: { bg: "bg-blue-500", text: "text-blue-700", ring: "ring-blue-300" },
  制作: { bg: "bg-yellow-500", text: "text-yellow-700", ring: "ring-yellow-300" },
  納品: { bg: "bg-green-500", text: "text-green-700", ring: "ring-green-300" },
};

const statusStyle: Record<TaskStatus, string> = {
  未着手: "bg-gray-100 text-gray-500",
  進行中: "bg-blue-100 text-blue-700",
  完了: "bg-green-100 text-green-700",
};

const statusIcon: Record<TaskStatus, string> = {
  未着手: "○",
  進行中: "◐",
  完了: "●",
};

type Tab = "進行状況" | "タスク";

export default function StoreDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const store = getStore(id);
  const [activeTab, setActiveTab] = useState<Tab>("進行状況");

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">店舗が見つかりませんでした。</p>
        <Link href="/" className="text-blue-500 hover:underline text-sm">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const currentPhaseIndex = PHASES.indexOf(store.currentPhase);
  const doneTasks = store.tasks.filter((t) => t.status === "完了").length;
  const inProgressTasks = store.tasks.filter((t) => t.status === "進行中").length;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-4"
        >
          ← 店舗一覧
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{store.category}</p>
          </div>
          <span
            className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              phaseColor[store.currentPhase].text
            } bg-opacity-10 ring-2 ${phaseColor[store.currentPhase].ring} ring-opacity-50`}
            style={{ backgroundColor: "transparent" }}
          >
            現在：{store.currentPhase}
          </span>
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["進行状況", "タスク"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "タスク" && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                {store.tasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 進行状況タブ */}
      {activeTab === "進行状況" && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">フェーズ進捗</h3>
            <div className="relative">
              {/* コネクターライン */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-blue-400 transition-all duration-500"
                style={{
                  width: `${
                    currentPhaseIndex === 0
                      ? 0
                      : (currentPhaseIndex / (PHASES.length - 1)) * 100
                  }%`,
                }}
              />

              <div className="relative flex justify-between">
                {PHASES.map((phase, index) => {
                  const isDone = index < currentPhaseIndex;
                  const isCurrent = index === currentPhaseIndex;
                  const colors = phaseColor[phase];

                  return (
                    <div key={phase} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 transition-all ${
                          isDone
                            ? "bg-blue-400"
                            : isCurrent
                            ? `${colors.bg} ring-4 ${colors.ring} scale-110`
                            : "bg-gray-200"
                        }`}
                      >
                        {isDone ? "✓" : index + 1}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isCurrent ? colors.text : isDone ? "text-gray-600" : "text-gray-300"
                        }`}
                      >
                        {phase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{doneTasks}</p>
              <p className="text-xs text-gray-500 mt-1">完了タスク</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
              <p className="text-xs text-gray-500 mt-1">進行中タスク</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">
                {store.tasks.length - doneTasks - inProgressTasks}
              </p>
              <p className="text-xs text-gray-500 mt-1">未着手タスク</p>
            </div>
          </div>
        </div>
      )}

      {/* タスクタブ */}
      {activeTab === "タスク" && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {store.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-base ${
                    task.status === "完了"
                      ? "text-green-500"
                      : task.status === "進行中"
                      ? "text-blue-500"
                      : "text-gray-300"
                  }`}
                >
                  {statusIcon[task.status]}
                </span>
                <span
                  className={`text-sm ${
                    task.status === "完了" ? "text-gray-400 line-through" : "text-gray-800"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[task.status]}`}
              >
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
