export type Phase = "企画" | "デザイン" | "制作" | "納品";
export type TaskStatus = "未着手" | "進行中" | "完了";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  currentPhase: Phase;
  tasks: Task[];
}

export const PHASES: Phase[] = ["企画", "デザイン", "制作", "納品"];

export const stores: Store[] = [
  {
    id: "1",
    name: "カフェ トキワ",
    category: "飲食",
    currentPhase: "制作",
    tasks: [
      { id: "t1", title: "ロゴデザイン確認", status: "完了" },
      { id: "t2", title: "メニュー写真撮影", status: "完了" },
      { id: "t3", title: "トップページ制作", status: "進行中" },
      { id: "t4", title: "スマホ対応確認", status: "未着手" },
      { id: "t5", title: "本番環境デプロイ", status: "未着手" },
    ],
  },
  {
    id: "2",
    name: "美容室 ハルカ",
    category: "美容",
    currentPhase: "デザイン",
    tasks: [
      { id: "t1", title: "ヒアリングシート作成", status: "完了" },
      { id: "t2", title: "競合調査", status: "完了" },
      { id: "t3", title: "ワイヤーフレーム作成", status: "進行中" },
      { id: "t4", title: "デザインカンプ確認", status: "未着手" },
      { id: "t5", title: "コーディング開始", status: "未着手" },
    ],
  },
  {
    id: "3",
    name: "整体院 ナカムラ",
    category: "医療・健康",
    currentPhase: "企画",
    tasks: [
      { id: "t1", title: "初回ヒアリング", status: "完了" },
      { id: "t2", title: "サイトマップ作成", status: "進行中" },
      { id: "t3", title: "コンセプト提案", status: "未着手" },
      { id: "t4", title: "スケジュール確定", status: "未着手" },
    ],
  },
  {
    id: "4",
    name: "雑貨店 ソラ",
    category: "小売",
    currentPhase: "納品",
    tasks: [
      { id: "t1", title: "最終デザイン確認", status: "完了" },
      { id: "t2", title: "テスト環境チェック", status: "完了" },
      { id: "t3", title: "本番公開", status: "完了" },
      { id: "t4", title: "納品書類送付", status: "進行中" },
    ],
  },
  {
    id: "5",
    name: "学習塾 みらい",
    category: "教育",
    currentPhase: "制作",
    tasks: [
      { id: "t1", title: "コース情報入力", status: "完了" },
      { id: "t2", title: "問い合わせフォーム実装", status: "進行中" },
      { id: "t3", title: "SEO設定", status: "未着手" },
      { id: "t4", title: "公開前チェック", status: "未着手" },
    ],
  },
  {
    id: "6",
    name: "ペットサロン ポポ",
    category: "ペット",
    currentPhase: "デザイン",
    tasks: [
      { id: "t1", title: "ブランドカラー決定", status: "完了" },
      { id: "t2", title: "トップビジュアル制作", status: "進行中" },
      { id: "t3", title: "料金ページデザイン", status: "未着手" },
    ],
  },
];

export function getStore(id: string): Store | undefined {
  return stores.find((s) => s.id === id);
}
