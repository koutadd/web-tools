import { type Phase } from './data';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type EquipmentPriority = '必須' | '推奨';
export type EquipmentStatus   = '未購入' | '注文済み' | '購入済み' | '不要';

export type EquipmentItem = {
  id: number;
  phase: Phase | '全フェーズ';
  title: string;
  reason: string;
  priority: EquipmentPriority;
  status: EquipmentStatus;
  deadline?: string;
  amazonUrl: string;
  price: string;
  emoji: string;
  tag?: string;
  purchaseNotes?: string;  // 買う時の注意点
  criteria?: string;       // おすすめの選び方
};

// ─── ステータス表示 ────────────────────────────────────────────────────────────

export const EQUIPMENT_STATUS_META: Record<EquipmentStatus, {
  label: string; bg: string; text: string; border: string;
}> = {
  未購入:  { label: '未購入',  bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  注文済み: { label: '注文済み', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  購入済み: { label: '購入済み', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  不要:    { label: '不要',    bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
};

export const PRIORITY_META: Record<EquipmentPriority, {
  label: string; bg: string; text: string; border: string;
}> = {
  必須: { label: '必須', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  推奨: { label: '推奨', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
};

// ─── 備品データ ───────────────────────────────────────────────────────────────

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // ── 撮影・デザインフェーズ ──
  {
    id: 1, phase: 'デザイン', priority: '必須',
    title: 'スマートフォン用三脚',
    reason: '店舗外観・内観写真を手ブレなく安定して撮影するために必要です。三脚を使うだけで写真のクオリティが大幅に上がります。',
    status: '未購入', deadline: '2026-03-25',
    price: '¥1,980〜',
    emoji: '📷',
    tag: '撮影に必須',
    amazonUrl: 'https://www.amazon.co.jp/s?k=スマートフォン+三脚+撮影',
    purchaseNotes: 'スマホホルダーのサイズが合うか確認してください。対応幅55〜85mmが目安です。ねじがゆるまないか購入前にレビューを確認しましょう。',
    criteria: '高さ調整できる3段タイプが便利です。ねじ式より素早く固定できるレバー式がおすすめ。屋外でも使うなら重さ500g以下の軽量タイプを選ぶと疲れません。',
  },
  {
    id: 2, phase: 'デザイン', priority: '推奨',
    title: 'リングライト（スタッフ写真用）',
    reason: 'スタッフ写真の顔の影をなくし、明るくプロっぽい仕上がりになります。自然光が入らない時間帯でも綺麗に撮れます。',
    status: '未購入',
    price: '¥2,500〜',
    emoji: '💡',
    tag: 'スタッフ写真に最適',
    amazonUrl: 'https://www.amazon.co.jp/s?k=リングライト+撮影+スタッフ',
    purchaseNotes: 'USB充電タイプを選ぶとコンセント不要で場所を選ばず使えます。スマホホルダー付きのモデルを選ぶとさらに効率的です。',
    criteria: '直径20cm以上のものが明るく使いやすいです。色温度（暖色・白・寒色）が切り替えられるものを選ぶと、店内の雰囲気に合った写真が撮れます。',
  },
  {
    id: 3, phase: 'デザイン', priority: '必須',
    title: 'USBメモリ（32GB以上）',
    reason: '撮影した写真データを担当者へ渡すときに使います。クラウドアップロードが難しい場合でも確実にデータを共有できます。',
    status: '購入済み',
    price: '¥980〜',
    emoji: '💾',
    amazonUrl: 'https://www.amazon.co.jp/s?k=USBメモリ+32GB',
    purchaseNotes: '差し込み口がUSB Type-Aかどうか確認してください。Type-Cしかないパソコンには別途変換アダプターが必要です。',
    criteria: '容量は32GBあれば十分です。速度より信頼性を優先し、サンディスク・バッファロー・東芝など有名ブランドを選ぶと安心です。',
  },

  // ── 制作フェーズ ──
  {
    id: 4, phase: '制作', priority: '推奨',
    title: 'QRコードスタンド（卓上）',
    reason: 'サイト公開後に来店客をWebへ誘導するために使います。受付や会計カウンターに置くと自然に見てもらえます。',
    status: '未購入',
    price: '¥500〜',
    emoji: '📋',
    amazonUrl: 'https://www.amazon.co.jp/s?k=QRコード+スタンド+卓上',
    purchaseNotes: '印刷したQRコードを差し込む形式を選んでください。ラミネート加工すると汚れにくく長持ちします。',
    criteria: 'アクリル素材のシンプルなものが清潔感があり、どんな受付にも馴染みます。シルバー・黒・クリアのいずれかが合わせやすいです。',
  },
  {
    id: 5, phase: '制作', priority: '推奨',
    title: 'コンタクトレンズ洗浄液（サンプル展示用）',
    reason: 'Webで紹介する商品の写真撮影に使います。実物があるとリアルで説得力のある写真が撮れます。',
    status: '不要',
    price: '¥980〜',
    emoji: '🧴',
    amazonUrl: 'https://www.amazon.co.jp/s?k=コンタクトレンズ+洗浄液',
    purchaseNotes: '現在「不要」に設定されています。必要になった場合は状態を変更してください。',
    criteria: '展示用なので現物が1本あれば十分です。店内で取り扱っている商品を使うと一番リアルな撮影ができます。',
  },

  // ── 納品・公開後 ──
  {
    id: 6, phase: '納品', priority: '推奨',
    title: 'ブルーライトカットメガネ（スタッフ用）',
    reason: '公開後のWeb運用でPC作業が増えます。スタッフの目の健康管理にもなります。長時間の確認作業が楽になります。',
    status: '未購入',
    price: '¥3,000〜',
    emoji: '👓',
    tag: 'スタッフの健康に',
    amazonUrl: 'https://www.amazon.co.jp/s?k=ブルーライトカット+メガネ',
    purchaseNotes: '度なしタイプを選んでください。JIS規格対応のものを選ぶと安心です。全スタッフ分を一度に買わず、まず1本試してから追加購入がおすすめ。',
    criteria: 'フレームはTR90などの軽量素材を選ぶと長時間かけても疲れにくいです。レンズカット率は30〜50%で十分効果があります。',
  },
  {
    id: 7, phase: '全フェーズ', priority: '推奨',
    title: 'モバイルバッテリー（撮影時用）',
    reason: '長時間の撮影でスマホが電池切れにならないよう備えておくと安心です。出張撮影の際にも役立ちます。',
    status: '購入済み',
    price: '¥2,800〜',
    emoji: '🔋',
    amazonUrl: 'https://www.amazon.co.jp/s?k=モバイルバッテリー+大容量',
    purchaseNotes: 'PSEマーク（電気安全マーク）付きを必ず確認してください。スマホの充電口に合うケーブルが付属しているかも確認しましょう。',
    criteria: '容量10,000mAh以上のものを選ぶとスマホを約2〜3回充電できます。急速充電対応だと撮影の休憩時間に素早く充電できて便利です。',
  },
];

// ─── ユーティリティ ───────────────────────────────────────────────────────────

export function getEquipmentByPhase(phase: Phase): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter(
    (e) => e.phase === phase || e.phase === '全フェーズ'
  );
}

export function getPendingEquipment(): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter(
    (e) => e.status === '未購入' && e.priority === '必須'
  );
}
