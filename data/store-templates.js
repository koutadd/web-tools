/**
 * store-templates.js
 * 店舗管理システム: タスクテンプレート & モックデータ
 *
 * 将来的な拡張ポイント:
 * - TASK_TEMPLATES を API / Google Sheets / Excel から取得に差し替え可能
 * - MOCK_STORES を /api/stores エンドポイントに差し替え可能
 * - 各関数は外部データソースに対応できるよう I/F を統一してある
 */

'use strict';

// ============================================================
// PHASES
// ============================================================
const PHASES = [
  '物件調整中',
  '契約準備',
  '契約完了',
  '内装進行中',
  '採用進行中',
  'クリエイティブ準備中',
  'システム準備中',
  'オープン準備中',
  'オープン済み',
];

// ============================================================
// TASK STATUSES
// ============================================================
const TASK_STATUSES = ['未着手', '対応中', '完了', '保留'];

// ============================================================
// TASK TEMPLATES
// key = store_type ('直営' | 'FC')
// ============================================================
const TASK_TEMPLATES = {
  '直営': [
    // ── 契約 ──────────────────────────────
    { id: 'tt-01', category: '契約',       task_name: '契約書確認',           department: '管理',           phase_group: '契約準備',       sort_order:  1, is_required: true  },
    { id: 'tt-02', category: '契約',       task_name: '請求書確認',           department: '経理',           phase_group: '契約準備',       sort_order:  2, is_required: true  },
    { id: 'tt-03', category: '契約',       task_name: 'キックオフMTG',        department: '管理',           phase_group: '契約準備',       sort_order:  3, is_required: true  },
    // ── 不動産 ────────────────────────────
    { id: 'tt-04', category: '不動産',     task_name: '物件情報確認',         department: '管理',           phase_group: '物件調整',       sort_order:  4, is_required: true  },
    { id: 'tt-05', category: '不動産',     task_name: '物件契約締結',         department: '管理',           phase_group: '物件調整',       sort_order:  5, is_required: true  },
    // ── 内装 ──────────────────────────────
    { id: 'tt-06', category: '内装',       task_name: '内装打ち合わせ',       department: '施工',           phase_group: '内装',           sort_order:  6, is_required: true  },
    { id: 'tt-07', category: '内装',       task_name: '内装工事開始',         department: '施工',           phase_group: '内装',           sort_order:  7, is_required: true  },
    { id: 'tt-08', category: '内装',       task_name: '内装完了確認',         department: '施工',           phase_group: '内装',           sort_order:  8, is_required: true  },
    // ── 看板 ──────────────────────────────
    { id: 'tt-09', category: '看板',       task_name: '看板内容確認',         department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order:  9, is_required: true  },
    { id: 'tt-10', category: '看板',       task_name: '看板発注',             department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 10, is_required: true  },
    { id: 'tt-11', category: '看板',       task_name: '看板設置完了確認',     department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 11, is_required: true  },
    // ── チラシ ────────────────────────────
    { id: 'tt-12', category: 'チラシ',     task_name: 'チラシ制作依頼',       department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 12, is_required: true  },
    { id: 'tt-13', category: 'チラシ',     task_name: 'チラシ内容確認・承認', department: '管理',           phase_group: 'クリエイティブ', sort_order: 13, is_required: true  },
    { id: 'tt-14', category: 'チラシ',     task_name: 'チラシ印刷・配布手配', department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 14, is_required: false },
    // ── 名刺・ツール ──────────────────────
    { id: 'tt-15', category: '名刺・ツール', task_name: '名刺制作依頼',       department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 15, is_required: true  },
    { id: 'tt-16', category: '名刺・ツール', task_name: '名刺内容確認・承認', department: '管理',           phase_group: 'クリエイティブ', sort_order: 16, is_required: true  },
    // ── Web ───────────────────────────────
    { id: 'tt-17', category: 'Web',        task_name: 'Web情報確認',          department: 'システム',       phase_group: 'システム',       sort_order: 17, is_required: true  },
    { id: 'tt-18', category: 'Web',        task_name: 'Web掲載情報更新',      department: 'システム',       phase_group: 'システム',       sort_order: 18, is_required: true  },
    { id: 'tt-19', category: 'Web',        task_name: 'Googleビジネス登録',   department: 'システム',       phase_group: 'システム',       sort_order: 19, is_required: true  },
    // ── 採用 ──────────────────────────────
    { id: 'tt-20', category: '採用',       task_name: '求人掲載',             department: '人事',           phase_group: '採用',           sort_order: 20, is_required: true  },
    { id: 'tt-21', category: '採用',       task_name: '採用面接',             department: '人事',           phase_group: '採用',           sort_order: 21, is_required: true  },
    { id: 'tt-22', category: '採用',       task_name: 'スタッフ採用完了',     department: '人事',           phase_group: '採用',           sort_order: 22, is_required: true  },
    // ── 研修 ──────────────────────────────
    { id: 'tt-23', category: '研修',       task_name: '研修日程調整',         department: '人事',           phase_group: '採用',           sort_order: 23, is_required: true  },
    { id: 'tt-24', category: '研修',       task_name: '研修実施',             department: '人事',           phase_group: '採用',           sort_order: 24, is_required: true  },
    // ── システム ──────────────────────────
    { id: 'tt-25', category: 'システム',   task_name: '予約システム設定',     department: 'システム',       phase_group: 'システム',       sort_order: 25, is_required: true  },
    { id: 'tt-26', category: 'システム',   task_name: '決済端末準備',         department: 'システム',       phase_group: 'システム',       sort_order: 26, is_required: true  },
    { id: 'tt-27', category: 'システム',   task_name: 'POS設定',              department: 'システム',       phase_group: 'システム',       sort_order: 27, is_required: true  },
    // ── 備品 ──────────────────────────────
    { id: 'tt-28', category: '備品',       task_name: '備品発注',             department: '管理',           phase_group: 'オープン準備',   sort_order: 28, is_required: true  },
    { id: 'tt-29', category: '備品',       task_name: '備品納品確認',         department: '管理',           phase_group: 'オープン準備',   sort_order: 29, is_required: true  },
    // ── 共有 ──────────────────────────────
    { id: 'tt-30', category: '共有',       task_name: 'オープン前最終確認',   department: '管理',           phase_group: 'オープン準備',   sort_order: 30, is_required: true  },
    { id: 'tt-31', category: '共有',       task_name: '進捗報告MTG（月次）',  department: '管理',           phase_group: 'オープン準備',   sort_order: 31, is_required: false },
  ],

  'FC': [
    // ── 契約 ──────────────────────────────
    { id: 'ft-01', category: '契約',       task_name: 'FC契約書確認',               department: '法務',           phase_group: '契約準備',       sort_order:  1, is_required: true  },
    { id: 'ft-02', category: '契約',       task_name: '加盟金・保証金入金確認',     department: '経理',           phase_group: '契約準備',       sort_order:  2, is_required: true  },
    { id: 'ft-03', category: '契約',       task_name: '請求書確認',                 department: '経理',           phase_group: '契約準備',       sort_order:  3, is_required: true  },
    { id: 'ft-04', category: '契約',       task_name: 'キックオフMTG（FC本部参加）',department: '管理',           phase_group: '契約準備',       sort_order:  4, is_required: true  },
    // ── 不動産 ────────────────────────────
    { id: 'ft-05', category: '不動産',     task_name: '物件情報確認',               department: '管理',           phase_group: '物件調整',       sort_order:  5, is_required: true  },
    { id: 'ft-06', category: '不動産',     task_name: '物件契約締結',               department: '管理',           phase_group: '物件調整',       sort_order:  6, is_required: true  },
    // ── 内装 ──────────────────────────────
    { id: 'ft-07', category: '内装',       task_name: '内装仕様確認（FC規定）',     department: '施工',           phase_group: '内装',           sort_order:  7, is_required: true  },
    { id: 'ft-08', category: '内装',       task_name: '内装工事',                   department: '施工',           phase_group: '内装',           sort_order:  8, is_required: true  },
    { id: 'ft-09', category: '内装',       task_name: '内装完了確認',               department: '施工',           phase_group: '内装',           sort_order:  9, is_required: true  },
    // ── 看板 ──────────────────────────────
    { id: 'ft-10', category: '看板',       task_name: '看板デザイン承認',           department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 10, is_required: true  },
    { id: 'ft-11', category: '看板',       task_name: '看板発注・設置',             department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 11, is_required: true  },
    // ── チラシ ────────────────────────────
    { id: 'ft-12', category: 'チラシ',     task_name: 'チラシ制作依頼',             department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 12, is_required: true  },
    { id: 'ft-13', category: 'チラシ',     task_name: 'チラシ承認（FC本部）',       department: '管理',           phase_group: 'クリエイティブ', sort_order: 13, is_required: true  },
    // ── 名刺・ツール ──────────────────────
    { id: 'ft-14', category: '名刺・ツール', task_name: '名刺制作依頼',             department: 'クリエイティブ', phase_group: 'クリエイティブ', sort_order: 14, is_required: true  },
    // ── Web ───────────────────────────────
    { id: 'ft-15', category: 'Web',        task_name: 'Web掲載情報提供',            department: 'システム',       phase_group: 'システム',       sort_order: 15, is_required: true  },
    { id: 'ft-16', category: 'Web',        task_name: 'Googleビジネス登録',         department: 'システム',       phase_group: 'システム',       sort_order: 16, is_required: true  },
    // ── 採用 ──────────────────────────────
    { id: 'ft-17', category: '採用',       task_name: '求人掲載',                   department: '人事',           phase_group: '採用',           sort_order: 17, is_required: true  },
    { id: 'ft-18', category: '採用',       task_name: 'スタッフ採用完了',           department: '人事',           phase_group: '採用',           sort_order: 18, is_required: true  },
    // ── 研修 ──────────────────────────────
    { id: 'ft-19', category: '研修',       task_name: '研修日程調整',               department: '人事',           phase_group: '採用',           sort_order: 19, is_required: true  },
    { id: 'ft-20', category: '研修',       task_name: 'FC研修受講',                 department: '人事',           phase_group: '採用',           sort_order: 20, is_required: true  },
    { id: 'ft-21', category: '研修',       task_name: '現場研修',                   department: '人事',           phase_group: '採用',           sort_order: 21, is_required: true  },
    // ── システム ──────────────────────────
    { id: 'ft-22', category: 'システム',   task_name: '予約システム設定',           department: 'システム',       phase_group: 'システム',       sort_order: 22, is_required: true  },
    { id: 'ft-23', category: 'システム',   task_name: '決済端末準備',               department: 'システム',       phase_group: 'システム',       sort_order: 23, is_required: true  },
    // ── 備品 ──────────────────────────────
    { id: 'ft-24', category: '備品',       task_name: '備品発注',                   department: '管理',           phase_group: 'オープン準備',   sort_order: 24, is_required: true  },
    // ── 共有 ──────────────────────────────
    { id: 'ft-25', category: '共有',       task_name: 'オープン前最終確認',         department: '管理',           phase_group: 'オープン準備',   sort_order: 25, is_required: true  },
    { id: 'ft-26', category: '共有',       task_name: '進捗報告MTG（月次）',        department: '管理',           phase_group: 'オープン準備',   sort_order: 26, is_required: false },
  ],
};

// ============================================================
// MOCK STORES
// ============================================================
const MOCK_STORES = [
  {
    id: 'store-001',
    store_name: '渋谷ヒカリエ店',
    store_type: '直営',
    area: '東京都渋谷区',
    tel: '03-1234-5678',
    address: '東京都渋谷区渋谷2-21-1',
    owner_name: '田中 太郎',
    owner_company: '株式会社アイケアラボ',
    pre_open_start: '2026-04-01',
    pre_open_end: '2026-04-14',
    open_date: '2026-04-15',
    current_phase: 'オープン準備中',
    lead_person: '山田 花子',
    created_at: '2026-01-15',
    updated_at: '2026-03-10',
  },
  {
    id: 'store-002',
    store_name: '横浜みなとみらい店',
    store_type: 'FC',
    area: '神奈川県横浜市',
    tel: '045-987-6543',
    address: '神奈川県横浜市西区みなとみらい2-2-1',
    owner_name: '鈴木 一郎',
    owner_company: '株式会社横浜ビジョン',
    pre_open_start: '2026-05-10',
    pre_open_end: '2026-05-23',
    open_date: '2026-05-24',
    current_phase: '内装進行中',
    lead_person: '佐藤 健一',
    created_at: '2026-02-01',
    updated_at: '2026-03-12',
  },
  {
    id: 'store-003',
    store_name: '新宿三丁目店',
    store_type: '直営',
    area: '東京都新宿区',
    tel: '03-2345-6789',
    address: '東京都新宿区新宿3-1-1',
    owner_name: '山田 花子',
    owner_company: '株式会社アイケアラボ',
    pre_open_start: '2026-05-20',
    pre_open_end: '2026-06-02',
    open_date: '2026-06-03',
    current_phase: '採用進行中',
    lead_person: '田中 太郎',
    created_at: '2026-02-15',
    updated_at: '2026-03-14',
  },
  {
    id: 'store-004',
    store_name: '梅田茶屋町店',
    store_type: 'FC',
    area: '大阪府大阪市',
    tel: '06-3456-7890',
    address: '大阪府大阪市北区茶屋町1-1',
    owner_name: '中村 誠',
    owner_company: '株式会社大阪ウェルネス',
    pre_open_start: '2026-06-01',
    pre_open_end: '2026-06-14',
    open_date: '2026-06-15',
    current_phase: '契約完了',
    lead_person: '伊藤 美咲',
    created_at: '2026-03-01',
    updated_at: '2026-03-15',
  },
  {
    id: 'store-005',
    store_name: '名古屋栄店',
    store_type: '直営',
    area: '愛知県名古屋市',
    tel: '052-4567-8901',
    address: '愛知県名古屋市中区栄3-1-1',
    owner_name: '高橋 浩二',
    owner_company: '株式会社アイケアラボ',
    pre_open_start: '2026-01-15',
    pre_open_end: '2026-01-28',
    open_date: '2026-02-01',
    current_phase: 'オープン済み',
    lead_person: '山田 花子',
    created_at: '2025-11-01',
    updated_at: '2026-02-01',
  },
];

// ============================================================
// MOCK TASKS (store_id → task[])
// 実際の運用ではテンプレートから自動生成し DB に保存する
// ============================================================
const MOCK_TASKS = {
  'store-001': [
    // 契約
    { id: 'st001-01', store_id: 'store-001', template_id: 'tt-01', category: '契約',       task_name: '契約書確認',           department: '管理',           assignee: '田中 太郎',  status: '完了', due_date: '2026-01-31', completed_at: '2026-01-28', notes: '',                         sort_order:  1, is_required: true  },
    { id: 'st001-02', store_id: 'store-001', template_id: 'tt-02', category: '契約',       task_name: '請求書確認',           department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2026-02-05', completed_at: '2026-02-04', notes: '',                         sort_order:  2, is_required: true  },
    { id: 'st001-03', store_id: 'store-001', template_id: 'tt-03', category: '契約',       task_name: 'キックオフMTG',        department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-02-10', completed_at: '2026-02-10', notes: '全員参加確認済み',         sort_order:  3, is_required: true  },
    // 不動産
    { id: 'st001-04', store_id: 'store-001', template_id: 'tt-04', category: '不動産',     task_name: '物件情報確認',         department: '管理',           assignee: '田中 太郎',  status: '完了', due_date: '2026-01-25', completed_at: '2026-01-24', notes: '',                         sort_order:  4, is_required: true  },
    { id: 'st001-05', store_id: 'store-001', template_id: 'tt-05', category: '不動産',     task_name: '物件契約締結',         department: '管理',           assignee: '田中 太郎',  status: '完了', due_date: '2026-02-15', completed_at: '2026-02-14', notes: '',                         sort_order:  5, is_required: true  },
    // 内装
    { id: 'st001-06', store_id: 'store-001', template_id: 'tt-06', category: '内装',       task_name: '内装打ち合わせ',       department: '施工',           assignee: '施工チーム', status: '完了', due_date: '2026-02-20', completed_at: '2026-02-19', notes: '',                         sort_order:  6, is_required: true  },
    { id: 'st001-07', store_id: 'store-001', template_id: 'tt-07', category: '内装',       task_name: '内装工事開始',         department: '施工',           assignee: '施工チーム', status: '完了', due_date: '2026-02-25', completed_at: '2026-02-25', notes: '',                         sort_order:  7, is_required: true  },
    { id: 'st001-08', store_id: 'store-001', template_id: 'tt-08', category: '内装',       task_name: '内装完了確認',         department: '施工',           assignee: '山田 花子',  status: '完了', due_date: '2026-03-20', completed_at: '2026-03-18', notes: '',                         sort_order:  8, is_required: true  },
    // 看板
    { id: 'st001-09', store_id: 'store-001', template_id: 'tt-09', category: '看板',       task_name: '看板内容確認',         department: 'クリエイティブ', assignee: '田中 太郎',  status: '完了', due_date: '2026-03-01', completed_at: '2026-02-28', notes: '',                         sort_order:  9, is_required: true  },
    { id: 'st001-10', store_id: 'store-001', template_id: 'tt-10', category: '看板',       task_name: '看板発注',             department: 'クリエイティブ', assignee: 'クリエ担当', status: '完了', due_date: '2026-03-05', completed_at: '2026-03-04', notes: '',                         sort_order: 10, is_required: true  },
    { id: 'st001-11', store_id: 'store-001', template_id: 'tt-11', category: '看板',       task_name: '看板設置完了確認',     department: 'クリエイティブ', assignee: '山田 花子',  status: '対応中', due_date: '2026-03-25', completed_at: '',           notes: '',                         sort_order: 11, is_required: true  },
    // チラシ
    { id: 'st001-12', store_id: 'store-001', template_id: 'tt-12', category: 'チラシ',     task_name: 'チラシ制作依頼',       department: 'クリエイティブ', assignee: 'クリエ担当', status: '完了', due_date: '2026-03-01', completed_at: '2026-02-28', notes: '',                         sort_order: 12, is_required: true  },
    { id: 'st001-13', store_id: 'store-001', template_id: 'tt-13', category: 'チラシ',     task_name: 'チラシ内容確認・承認', department: '管理',           assignee: '田中 太郎',  status: '完了', due_date: '2026-03-10', completed_at: '2026-03-08', notes: '',                         sort_order: 13, is_required: true  },
    { id: 'st001-14', store_id: 'store-001', template_id: 'tt-14', category: 'チラシ',     task_name: 'チラシ印刷・配布手配', department: 'クリエイティブ', assignee: 'クリエ担当', status: '対応中', due_date: '2026-03-30', completed_at: '',           notes: '',                         sort_order: 14, is_required: false },
    // 名刺・ツール
    { id: 'st001-15', store_id: 'store-001', template_id: 'tt-15', category: '名刺・ツール', task_name: '名刺制作依頼',       department: 'クリエイティブ', assignee: 'クリエ担当', status: '完了', due_date: '2026-03-05', completed_at: '2026-03-04', notes: '',                         sort_order: 15, is_required: true  },
    { id: 'st001-16', store_id: 'store-001', template_id: 'tt-16', category: '名刺・ツール', task_name: '名刺内容確認・承認', department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-03-10', completed_at: '2026-03-09', notes: '',                         sort_order: 16, is_required: true  },
    // Web
    { id: 'st001-17', store_id: 'store-001', template_id: 'tt-17', category: 'Web',        task_name: 'Web情報確認',          department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2026-02-28', completed_at: '2026-02-26', notes: '',                       sort_order: 17, is_required: true  },
    { id: 'st001-18', store_id: 'store-001', template_id: 'tt-18', category: 'Web',        task_name: 'Web掲載情報更新',      department: 'システム',       assignee: 'システム担当', status: '対応中', due_date: '2026-03-20', completed_at: '',           notes: '',                       sort_order: 18, is_required: true  },
    { id: 'st001-19', store_id: 'store-001', template_id: 'tt-19', category: 'Web',        task_name: 'Googleビジネス登録',   department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-04-01', completed_at: '',           notes: '',                       sort_order: 19, is_required: true  },
    // 採用
    { id: 'st001-20', store_id: 'store-001', template_id: 'tt-20', category: '採用',       task_name: '求人掲載',             department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-02-20', completed_at: '2026-02-18', notes: '',                         sort_order: 20, is_required: true  },
    { id: 'st001-21', store_id: 'store-001', template_id: 'tt-21', category: '採用',       task_name: '採用面接',             department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-03-10', completed_at: '2026-03-07', notes: '5名採用',                  sort_order: 21, is_required: true  },
    { id: 'st001-22', store_id: 'store-001', template_id: 'tt-22', category: '採用',       task_name: 'スタッフ採用完了',     department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-03-15', completed_at: '2026-03-12', notes: '',                         sort_order: 22, is_required: true  },
    // 研修
    { id: 'st001-23', store_id: 'store-001', template_id: 'tt-23', category: '研修',       task_name: '研修日程調整',         department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-03-15', completed_at: '2026-03-14', notes: '',                         sort_order: 23, is_required: true  },
    { id: 'st001-24', store_id: 'store-001', template_id: 'tt-24', category: '研修',       task_name: '研修実施',             department: '人事',           assignee: '人事担当',   status: '対応中', due_date: '2026-04-05', completed_at: '',           notes: '4/3〜4/5の予定',          sort_order: 24, is_required: true  },
    // システム
    { id: 'st001-25', store_id: 'store-001', template_id: 'tt-25', category: 'システム',   task_name: '予約システム設定',     department: 'システム',       assignee: 'システム担当', status: '対応中', due_date: '2026-03-14', completed_at: '',           notes: '',                       sort_order: 25, is_required: true  },
    { id: 'st001-26', store_id: 'store-001', template_id: 'tt-26', category: 'システム',   task_name: '決済端末準備',         department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-04-01', completed_at: '',           notes: '',                       sort_order: 26, is_required: true  },
    { id: 'st001-27', store_id: 'store-001', template_id: 'tt-27', category: 'システム',   task_name: 'POS設定',              department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-04-05', completed_at: '',           notes: '',                       sort_order: 27, is_required: true  },
    // 備品
    { id: 'st001-28', store_id: 'store-001', template_id: 'tt-28', category: '備品',       task_name: '備品発注',             department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-03-10', completed_at: '2026-03-08', notes: '',                         sort_order: 28, is_required: true  },
    { id: 'st001-29', store_id: 'store-001', template_id: 'tt-29', category: '備品',       task_name: '備品納品確認',         department: '管理',           assignee: '山田 花子',  status: '対応中', due_date: '2026-04-01', completed_at: '',           notes: '',                         sort_order: 29, is_required: true  },
    // 共有
    { id: 'st001-30', store_id: 'store-001', template_id: 'tt-30', category: '共有',       task_name: 'オープン前最終確認',   department: '管理',           assignee: '山田 花子',  status: '未着手', due_date: '2026-04-14', completed_at: '',           notes: '',                         sort_order: 30, is_required: true  },
    { id: 'st001-31', store_id: 'store-001', template_id: 'tt-31', category: '共有',       task_name: '進捗報告MTG（月次）',  department: '管理',           assignee: '山田 花子',  status: '対応中', due_date: '2026-03-31', completed_at: '',           notes: '',                         sort_order: 31, is_required: false },
  ],

  'store-002': [
    { id: 'st002-01', store_id: 'store-002', template_id: 'ft-01', category: '契約',       task_name: 'FC契約書確認',               department: '法務',           assignee: '鈴木 一郎',  status: '完了', due_date: '2026-02-20', completed_at: '2026-02-18', notes: '', sort_order:  1, is_required: true  },
    { id: 'st002-02', store_id: 'store-002', template_id: 'ft-02', category: '契約',       task_name: '加盟金・保証金入金確認',     department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2026-02-25', completed_at: '2026-02-24', notes: '', sort_order:  2, is_required: true  },
    { id: 'st002-03', store_id: 'store-002', template_id: 'ft-03', category: '契約',       task_name: '請求書確認',                 department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2026-02-28', completed_at: '2026-02-27', notes: '', sort_order:  3, is_required: true  },
    { id: 'st002-04', store_id: 'store-002', template_id: 'ft-04', category: '契約',       task_name: 'キックオフMTG（FC本部参加）',department: '管理',           assignee: '佐藤 健一',  status: '完了', due_date: '2026-03-01', completed_at: '2026-02-28', notes: '', sort_order:  4, is_required: true  },
    { id: 'st002-05', store_id: 'store-002', template_id: 'ft-05', category: '不動産',     task_name: '物件情報確認',               department: '管理',           assignee: '鈴木 一郎',  status: '完了', due_date: '2026-02-15', completed_at: '2026-02-14', notes: '', sort_order:  5, is_required: true  },
    { id: 'st002-06', store_id: 'store-002', template_id: 'ft-06', category: '不動産',     task_name: '物件契約締結',               department: '管理',           assignee: '鈴木 一郎',  status: '完了', due_date: '2026-03-05', completed_at: '2026-03-03', notes: '', sort_order:  6, is_required: true  },
    { id: 'st002-07', store_id: 'store-002', template_id: 'ft-07', category: '内装',       task_name: '内装仕様確認（FC規定）',     department: '施工',           assignee: '施工チーム', status: '完了', due_date: '2026-03-10', completed_at: '2026-03-08', notes: '', sort_order:  7, is_required: true  },
    { id: 'st002-08', store_id: 'store-002', template_id: 'ft-08', category: '内装',       task_name: '内装工事',                   department: '施工',           assignee: '施工チーム', status: '対応中', due_date: '2026-04-20', completed_at: '',           notes: '進行中', sort_order: 8, is_required: true  },
    { id: 'st002-09', store_id: 'store-002', template_id: 'ft-09', category: '内装',       task_name: '内装完了確認',               department: '施工',           assignee: '佐藤 健一',  status: '未着手', due_date: '2026-04-25', completed_at: '',           notes: '', sort_order:  9, is_required: true  },
    { id: 'st002-10', store_id: 'store-002', template_id: 'ft-10', category: '看板',       task_name: '看板デザイン承認',           department: 'クリエイティブ', assignee: '佐藤 健一',  status: '未着手', due_date: '2026-04-10', completed_at: '',           notes: '', sort_order: 10, is_required: true  },
    { id: 'st002-11', store_id: 'store-002', template_id: 'ft-11', category: '看板',       task_name: '看板発注・設置',             department: 'クリエイティブ', assignee: 'クリエ担当', status: '未着手', due_date: '2026-04-28', completed_at: '',           notes: '', sort_order: 11, is_required: true  },
    { id: 'st002-12', store_id: 'store-002', template_id: 'ft-12', category: 'チラシ',     task_name: 'チラシ制作依頼',             department: 'クリエイティブ', assignee: 'クリエ担当', status: '未着手', due_date: '2026-04-15', completed_at: '',           notes: '', sort_order: 12, is_required: true  },
    { id: 'st002-13', store_id: 'store-002', template_id: 'ft-13', category: 'チラシ',     task_name: 'チラシ承認（FC本部）',       department: '管理',           assignee: '佐藤 健一',  status: '未着手', due_date: '2026-04-25', completed_at: '',           notes: '', sort_order: 13, is_required: true  },
    { id: 'st002-14', store_id: 'store-002', template_id: 'ft-14', category: '名刺・ツール', task_name: '名刺制作依頼',             department: 'クリエイティブ', assignee: 'クリエ担当', status: '未着手', due_date: '2026-04-15', completed_at: '',           notes: '', sort_order: 14, is_required: true  },
    { id: 'st002-15', store_id: 'store-002', template_id: 'ft-15', category: 'Web',        task_name: 'Web掲載情報提供',            department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-04-10', completed_at: '',         notes: '', sort_order: 15, is_required: true  },
    { id: 'st002-16', store_id: 'store-002', template_id: 'ft-16', category: 'Web',        task_name: 'Googleビジネス登録',         department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-05-05', completed_at: '',         notes: '', sort_order: 16, is_required: true  },
    { id: 'st002-17', store_id: 'store-002', template_id: 'ft-17', category: '採用',       task_name: '求人掲載',                   department: '人事',           assignee: '人事担当',   status: '対応中', due_date: '2026-03-14', completed_at: '',           notes: '', sort_order: 17, is_required: true  },
    { id: 'st002-18', store_id: 'store-002', template_id: 'ft-18', category: '採用',       task_name: 'スタッフ採用完了',           department: '人事',           assignee: '人事担当',   status: '未着手', due_date: '2026-04-30', completed_at: '',           notes: '', sort_order: 18, is_required: true  },
    { id: 'st002-19', store_id: 'store-002', template_id: 'ft-19', category: '研修',       task_name: '研修日程調整',               department: '人事',           assignee: '人事担当',   status: '未着手', due_date: '2026-04-15', completed_at: '',           notes: '', sort_order: 19, is_required: true  },
    { id: 'st002-20', store_id: 'store-002', template_id: 'ft-20', category: '研修',       task_name: 'FC研修受講',                 department: '人事',           assignee: '鈴木 一郎',  status: '未着手', due_date: '2026-05-01', completed_at: '',           notes: '', sort_order: 20, is_required: true  },
    { id: 'st002-21', store_id: 'store-002', template_id: 'ft-21', category: '研修',       task_name: '現場研修',                   department: '人事',           assignee: '鈴木 一郎',  status: '未着手', due_date: '2026-05-10', completed_at: '',           notes: '', sort_order: 21, is_required: true  },
    { id: 'st002-22', store_id: 'store-002', template_id: 'ft-22', category: 'システム',   task_name: '予約システム設定',           department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-05-05', completed_at: '',         notes: '', sort_order: 22, is_required: true  },
    { id: 'st002-23', store_id: 'store-002', template_id: 'ft-23', category: 'システム',   task_name: '決済端末準備',               department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-05-10', completed_at: '',         notes: '', sort_order: 23, is_required: true  },
    { id: 'st002-24', store_id: 'store-002', template_id: 'ft-24', category: '備品',       task_name: '備品発注',                   department: '管理',           assignee: '佐藤 健一',  status: '未着手', due_date: '2026-05-01', completed_at: '',           notes: '', sort_order: 24, is_required: true  },
    { id: 'st002-25', store_id: 'store-002', template_id: 'ft-25', category: '共有',       task_name: 'オープン前最終確認',         department: '管理',           assignee: '佐藤 健一',  status: '未着手', due_date: '2026-05-22', completed_at: '',           notes: '', sort_order: 25, is_required: true  },
    { id: 'st002-26', store_id: 'store-002', template_id: 'ft-26', category: '共有',       task_name: '進捗報告MTG（月次）',        department: '管理',           assignee: '佐藤 健一',  status: '対応中', due_date: '2026-03-31', completed_at: '',           notes: '', sort_order: 26, is_required: false },
  ],

  'store-003': [
    { id: 'st003-01', store_id: 'store-003', template_id: 'tt-01', category: '契約',       task_name: '契約書確認',           department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-02-25', completed_at: '2026-02-24', notes: '', sort_order:  1, is_required: true  },
    { id: 'st003-02', store_id: 'store-003', template_id: 'tt-02', category: '契約',       task_name: '請求書確認',           department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2026-03-01', completed_at: '2026-02-28', notes: '', sort_order:  2, is_required: true  },
    { id: 'st003-03', store_id: 'store-003', template_id: 'tt-03', category: '契約',       task_name: 'キックオフMTG',        department: '管理',           assignee: '田中 太郎',  status: '完了', due_date: '2026-03-05', completed_at: '2026-03-04', notes: '', sort_order:  3, is_required: true  },
    { id: 'st003-04', store_id: 'store-003', template_id: 'tt-04', category: '不動産',     task_name: '物件情報確認',         department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-02-20', completed_at: '2026-02-19', notes: '', sort_order:  4, is_required: true  },
    { id: 'st003-05', store_id: 'store-003', template_id: 'tt-05', category: '不動産',     task_name: '物件契約締結',         department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-03-10', completed_at: '2026-03-08', notes: '', sort_order:  5, is_required: true  },
    { id: 'st003-06', store_id: 'store-003', template_id: 'tt-06', category: '内装',       task_name: '内装打ち合わせ',       department: '施工',           assignee: '施工チーム', status: '完了', due_date: '2026-03-15', completed_at: '2026-03-14', notes: '', sort_order:  6, is_required: true  },
    { id: 'st003-07', store_id: 'store-003', template_id: 'tt-07', category: '内装',       task_name: '内装工事開始',         department: '施工',           assignee: '施工チーム', status: '対応中', due_date: '2026-03-25', completed_at: '',           notes: '', sort_order: 7, is_required: true  },
    { id: 'st003-08', store_id: 'store-003', template_id: 'tt-08', category: '内装',       task_name: '内装完了確認',         department: '施工',           assignee: '田中 太郎',  status: '未着手', due_date: '2026-04-30', completed_at: '',           notes: '', sort_order:  8, is_required: true  },
    { id: 'st003-09', store_id: 'store-003', template_id: 'tt-09', category: '看板',       task_name: '看板内容確認',         department: 'クリエイティブ', assignee: '田中 太郎',  status: '未着手', due_date: '2026-04-15', completed_at: '',           notes: '', sort_order:  9, is_required: true  },
    { id: 'st003-10', store_id: 'store-003', template_id: 'tt-10', category: '看板',       task_name: '看板発注',             department: 'クリエイティブ', assignee: 'クリエ担当', status: '未着手', due_date: '2026-04-25', completed_at: '',           notes: '', sort_order: 10, is_required: true  },
    { id: 'st003-11', store_id: 'store-003', template_id: 'tt-11', category: '看板',       task_name: '看板設置完了確認',     department: 'クリエイティブ', assignee: '田中 太郎',  status: '未着手', due_date: '2026-05-10', completed_at: '',           notes: '', sort_order: 11, is_required: true  },
    { id: 'st003-12', store_id: 'store-003', template_id: 'tt-12', category: 'チラシ',     task_name: 'チラシ制作依頼',       department: 'クリエイティブ', assignee: 'クリエ担当', status: '未着手', due_date: '2026-04-20', completed_at: '',           notes: '', sort_order: 12, is_required: true  },
    { id: 'st003-13', store_id: 'store-003', template_id: 'tt-13', category: 'チラシ',     task_name: 'チラシ内容確認・承認', department: '管理',           assignee: '田中 太郎',  status: '未着手', due_date: '2026-05-01', completed_at: '',           notes: '', sort_order: 13, is_required: true  },
    { id: 'st003-14', store_id: 'store-003', template_id: 'tt-15', category: '名刺・ツール', task_name: '名刺制作依頼',       department: 'クリエイティブ', assignee: 'クリエ担当', status: '未着手', due_date: '2026-04-20', completed_at: '',           notes: '', sort_order: 14, is_required: true  },
    { id: 'st003-15', store_id: 'store-003', template_id: 'tt-17', category: 'Web',        task_name: 'Web情報確認',          department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-04-15', completed_at: '',         notes: '', sort_order: 15, is_required: true  },
    { id: 'st003-16', store_id: 'store-003', template_id: 'tt-20', category: '採用',       task_name: '求人掲載',             department: '人事',           assignee: '人事担当',   status: '対応中', due_date: '2026-03-20', completed_at: '',           notes: '', sort_order: 16, is_required: true  },
    { id: 'st003-17', store_id: 'store-003', template_id: 'tt-21', category: '採用',       task_name: '採用面接',             department: '人事',           assignee: '人事担当',   status: '対応中', due_date: '2026-04-10', completed_at: '',           notes: '', sort_order: 17, is_required: true  },
    { id: 'st003-18', store_id: 'store-003', template_id: 'tt-22', category: '採用',       task_name: 'スタッフ採用完了',     department: '人事',           assignee: '人事担当',   status: '未着手', due_date: '2026-04-20', completed_at: '',           notes: '', sort_order: 18, is_required: true  },
    { id: 'st003-19', store_id: 'store-003', template_id: 'tt-23', category: '研修',       task_name: '研修日程調整',         department: '人事',           assignee: '人事担当',   status: '未着手', due_date: '2026-04-15', completed_at: '',           notes: '', sort_order: 19, is_required: true  },
    { id: 'st003-20', store_id: 'store-003', template_id: 'tt-25', category: 'システム',   task_name: '予約システム設定',     department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-05-10', completed_at: '',         notes: '', sort_order: 20, is_required: true  },
    { id: 'st003-21', store_id: 'store-003', template_id: 'tt-28', category: '備品',       task_name: '備品発注',             department: '管理',           assignee: '田中 太郎',  status: '未着手', due_date: '2026-05-15', completed_at: '',           notes: '', sort_order: 21, is_required: true  },
    { id: 'st003-22', store_id: 'store-003', template_id: 'tt-30', category: '共有',       task_name: 'オープン前最終確認',   department: '管理',           assignee: '田中 太郎',  status: '未着手', due_date: '2026-06-01', completed_at: '',           notes: '', sort_order: 22, is_required: true  },
  ],

  'store-004': [
    { id: 'st004-01', store_id: 'store-004', template_id: 'ft-01', category: '契約',       task_name: 'FC契約書確認',               department: '法務',           assignee: '伊藤 美咲',  status: '完了', due_date: '2026-03-10', completed_at: '2026-03-09', notes: '', sort_order:  1, is_required: true  },
    { id: 'st004-02', store_id: 'store-004', template_id: 'ft-02', category: '契約',       task_name: '加盟金・保証金入金確認',     department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2026-03-12', completed_at: '2026-03-11', notes: '', sort_order:  2, is_required: true  },
    { id: 'st004-03', store_id: 'store-004', template_id: 'ft-03', category: '契約',       task_name: '請求書確認',                 department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2026-03-14', completed_at: '2026-03-13', notes: '', sort_order:  3, is_required: true  },
    { id: 'st004-04', store_id: 'store-004', template_id: 'ft-04', category: '契約',       task_name: 'キックオフMTG（FC本部参加）',department: '管理',           assignee: '伊藤 美咲',  status: '完了', due_date: '2026-03-15', completed_at: '2026-03-15', notes: '', sort_order:  4, is_required: true  },
    { id: 'st004-05', store_id: 'store-004', template_id: 'ft-05', category: '不動産',     task_name: '物件情報確認',               department: '管理',           assignee: '中村 誠',    status: '完了', due_date: '2026-03-10', completed_at: '2026-03-08', notes: '', sort_order:  5, is_required: true  },
    { id: 'st004-06', store_id: 'store-004', template_id: 'ft-06', category: '不動産',     task_name: '物件契約締結',               department: '管理',           assignee: '中村 誠',    status: '対応中', due_date: '2026-03-28', completed_at: '',           notes: '交渉中', sort_order: 6, is_required: true },
    { id: 'st004-07', store_id: 'store-004', template_id: 'ft-07', category: '内装',       task_name: '内装仕様確認（FC規定）',     department: '施工',           assignee: '施工チーム', status: '未着手', due_date: '2026-04-10', completed_at: '',           notes: '', sort_order:  7, is_required: true  },
    { id: 'st004-08', store_id: 'store-004', template_id: 'ft-08', category: '内装',       task_name: '内装工事',                   department: '施工',           assignee: '施工チーム', status: '未着手', due_date: '2026-05-15', completed_at: '',           notes: '', sort_order:  8, is_required: true  },
    { id: 'st004-09', store_id: 'store-004', template_id: 'ft-09', category: '内装',       task_name: '内装完了確認',               department: '施工',           assignee: '伊藤 美咲',  status: '未着手', due_date: '2026-05-25', completed_at: '',           notes: '', sort_order:  9, is_required: true  },
    { id: 'st004-10', store_id: 'store-004', template_id: 'ft-10', category: '看板',       task_name: '看板デザイン承認',           department: 'クリエイティブ', assignee: '伊藤 美咲',  status: '未着手', due_date: '2026-05-10', completed_at: '',           notes: '', sort_order: 10, is_required: true  },
    { id: 'st004-11', store_id: 'store-004', template_id: 'ft-17', category: '採用',       task_name: '求人掲載',                   department: '人事',           assignee: '人事担当',   status: '未着手', due_date: '2026-04-15', completed_at: '',           notes: '', sort_order: 11, is_required: true  },
    { id: 'st004-12', store_id: 'store-004', template_id: 'ft-22', category: 'システム',   task_name: '予約システム設定',           department: 'システム',       assignee: 'システム担当', status: '未着手', due_date: '2026-06-01', completed_at: '',         notes: '', sort_order: 12, is_required: true  },
    { id: 'st004-13', store_id: 'store-004', template_id: 'ft-25', category: '共有',       task_name: 'オープン前最終確認',         department: '管理',           assignee: '伊藤 美咲',  status: '未着手', due_date: '2026-06-13', completed_at: '',           notes: '', sort_order: 13, is_required: true  },
  ],

  'store-005': [
    { id: 'st005-01', store_id: 'store-005', template_id: 'tt-01', category: '契約',       task_name: '契約書確認',           department: '管理',           assignee: '高橋 浩二',  status: '完了', due_date: '2025-11-20', completed_at: '2025-11-19', notes: '', sort_order:  1, is_required: true  },
    { id: 'st005-02', store_id: 'store-005', template_id: 'tt-02', category: '契約',       task_name: '請求書確認',           department: '経理',           assignee: '経理担当',   status: '完了', due_date: '2025-11-25', completed_at: '2025-11-24', notes: '', sort_order:  2, is_required: true  },
    { id: 'st005-03', store_id: 'store-005', template_id: 'tt-03', category: '契約',       task_name: 'キックオフMTG',        department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2025-11-28', completed_at: '2025-11-27', notes: '', sort_order:  3, is_required: true  },
    { id: 'st005-04', store_id: 'store-005', template_id: 'tt-04', category: '不動産',     task_name: '物件情報確認',         department: '管理',           assignee: '高橋 浩二',  status: '完了', due_date: '2025-11-15', completed_at: '2025-11-14', notes: '', sort_order:  4, is_required: true  },
    { id: 'st005-05', store_id: 'store-005', template_id: 'tt-05', category: '不動産',     task_name: '物件契約締結',         department: '管理',           assignee: '高橋 浩二',  status: '完了', due_date: '2025-12-01', completed_at: '2025-11-30', notes: '', sort_order:  5, is_required: true  },
    { id: 'st005-06', store_id: 'store-005', template_id: 'tt-06', category: '内装',       task_name: '内装打ち合わせ',       department: '施工',           assignee: '施工チーム', status: '完了', due_date: '2025-12-10', completed_at: '2025-12-09', notes: '', sort_order:  6, is_required: true  },
    { id: 'st005-07', store_id: 'store-005', template_id: 'tt-07', category: '内装',       task_name: '内装工事開始',         department: '施工',           assignee: '施工チーム', status: '完了', due_date: '2025-12-15', completed_at: '2025-12-14', notes: '', sort_order:  7, is_required: true  },
    { id: 'st005-08', store_id: 'store-005', template_id: 'tt-08', category: '内装',       task_name: '内装完了確認',         department: '施工',           assignee: '山田 花子',  status: '完了', due_date: '2026-01-10', completed_at: '2026-01-08', notes: '', sort_order:  8, is_required: true  },
    { id: 'st005-09', store_id: 'store-005', template_id: 'tt-09', category: '看板',       task_name: '看板内容確認',         department: 'クリエイティブ', assignee: '高橋 浩二',  status: '完了', due_date: '2025-12-20', completed_at: '2025-12-19', notes: '', sort_order:  9, is_required: true  },
    { id: 'st005-10', store_id: 'store-005', template_id: 'tt-10', category: '看板',       task_name: '看板発注',             department: 'クリエイティブ', assignee: 'クリエ担当', status: '完了', due_date: '2025-12-25', completed_at: '2025-12-23', notes: '', sort_order: 10, is_required: true  },
    { id: 'st005-11', store_id: 'store-005', template_id: 'tt-11', category: '看板',       task_name: '看板設置完了確認',     department: 'クリエイティブ', assignee: '山田 花子',  status: '完了', due_date: '2026-01-15', completed_at: '2026-01-14', notes: '', sort_order: 11, is_required: true  },
    { id: 'st005-12', store_id: 'store-005', template_id: 'tt-12', category: 'チラシ',     task_name: 'チラシ制作依頼',       department: 'クリエイティブ', assignee: 'クリエ担当', status: '完了', due_date: '2025-12-28', completed_at: '2025-12-26', notes: '', sort_order: 12, is_required: true  },
    { id: 'st005-13', store_id: 'store-005', template_id: 'tt-13', category: 'チラシ',     task_name: 'チラシ内容確認・承認', department: '管理',           assignee: '高橋 浩二',  status: '完了', due_date: '2026-01-05', completed_at: '2026-01-04', notes: '', sort_order: 13, is_required: true  },
    { id: 'st005-14', store_id: 'store-005', template_id: 'tt-15', category: '名刺・ツール', task_name: '名刺制作依頼',       department: 'クリエイティブ', assignee: 'クリエ担当', status: '完了', due_date: '2025-12-28', completed_at: '2025-12-26', notes: '', sort_order: 14, is_required: true  },
    { id: 'st005-15', store_id: 'store-005', template_id: 'tt-16', category: '名刺・ツール', task_name: '名刺内容確認・承認', department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-01-05', completed_at: '2026-01-04', notes: '', sort_order: 15, is_required: true  },
    { id: 'st005-16', store_id: 'store-005', template_id: 'tt-17', category: 'Web',        task_name: 'Web情報確認',          department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2025-12-25', completed_at: '2025-12-24', notes: '', sort_order: 16, is_required: true },
    { id: 'st005-17', store_id: 'store-005', template_id: 'tt-18', category: 'Web',        task_name: 'Web掲載情報更新',      department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2026-01-10', completed_at: '2026-01-09', notes: '', sort_order: 17, is_required: true },
    { id: 'st005-18', store_id: 'store-005', template_id: 'tt-19', category: 'Web',        task_name: 'Googleビジネス登録',   department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2026-01-15', completed_at: '2026-01-14', notes: '', sort_order: 18, is_required: true },
    { id: 'st005-19', store_id: 'store-005', template_id: 'tt-20', category: '採用',       task_name: '求人掲載',             department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2025-12-15', completed_at: '2025-12-14', notes: '', sort_order: 19, is_required: true  },
    { id: 'st005-20', store_id: 'store-005', template_id: 'tt-21', category: '採用',       task_name: '採用面接',             department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-01-05', completed_at: '2026-01-04', notes: '', sort_order: 20, is_required: true  },
    { id: 'st005-21', store_id: 'store-005', template_id: 'tt-22', category: '採用',       task_name: 'スタッフ採用完了',     department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-01-10', completed_at: '2026-01-09', notes: '', sort_order: 21, is_required: true  },
    { id: 'st005-22', store_id: 'store-005', template_id: 'tt-23', category: '研修',       task_name: '研修日程調整',         department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-01-10', completed_at: '2026-01-09', notes: '', sort_order: 22, is_required: true  },
    { id: 'st005-23', store_id: 'store-005', template_id: 'tt-24', category: '研修',       task_name: '研修実施',             department: '人事',           assignee: '人事担当',   status: '完了', due_date: '2026-01-20', completed_at: '2026-01-19', notes: '', sort_order: 23, is_required: true  },
    { id: 'st005-24', store_id: 'store-005', template_id: 'tt-25', category: 'システム',   task_name: '予約システム設定',     department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2026-01-20', completed_at: '2026-01-18', notes: '', sort_order: 24, is_required: true },
    { id: 'st005-25', store_id: 'store-005', template_id: 'tt-26', category: 'システム',   task_name: '決済端末準備',         department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2026-01-22', completed_at: '2026-01-21', notes: '', sort_order: 25, is_required: true },
    { id: 'st005-26', store_id: 'store-005', template_id: 'tt-27', category: 'システム',   task_name: 'POS設定',              department: 'システム',       assignee: 'システム担当', status: '完了', due_date: '2026-01-24', completed_at: '2026-01-23', notes: '', sort_order: 26, is_required: true },
    { id: 'st005-27', store_id: 'store-005', template_id: 'tt-28', category: '備品',       task_name: '備品発注',             department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-01-15', completed_at: '2026-01-14', notes: '', sort_order: 27, is_required: true  },
    { id: 'st005-28', store_id: 'store-005', template_id: 'tt-29', category: '備品',       task_name: '備品納品確認',         department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-01-25', completed_at: '2026-01-24', notes: '', sort_order: 28, is_required: true  },
    { id: 'st005-29', store_id: 'store-005', template_id: 'tt-30', category: '共有',       task_name: 'オープン前最終確認',   department: '管理',           assignee: '山田 花子',  status: '完了', due_date: '2026-01-28', completed_at: '2026-01-28', notes: '', sort_order: 29, is_required: true  },
  ],
};

// ============================================================
// MOCK ACTIVITY LOGS
// ============================================================
const MOCK_LOGS = {
  'store-001': [
    { id: 'log-001-1', store_id: 'store-001', task_id: null,         action_type: 'phase_change',   old_value: '契約完了',     new_value: 'オープン準備中', updated_by: '山田 花子',  updated_at: '2026-03-10T10:00:00' },
    { id: 'log-001-2', store_id: 'store-001', task_id: 'st001-25',   action_type: 'status_change',  old_value: '未着手',       new_value: '対応中',         updated_by: 'システム担当', updated_at: '2026-03-09T14:30:00' },
    { id: 'log-001-3', store_id: 'store-001', task_id: 'st001-22',   action_type: 'status_change',  old_value: '対応中',       new_value: '完了',           updated_by: '人事担当',   updated_at: '2026-03-12T09:15:00' },
    { id: 'log-001-4', store_id: 'store-001', task_id: 'st001-08',   action_type: 'status_change',  old_value: '対応中',       new_value: '完了',           updated_by: '山田 花子',  updated_at: '2026-03-18T16:00:00' },
    { id: 'log-001-5', store_id: 'store-001', task_id: null,         action_type: 'memo',           old_value: '',             new_value: '内装完了。オープンに向けて最終準備を開始。', updated_by: '山田 花子', updated_at: '2026-03-18T16:05:00' },
  ],
  'store-002': [
    { id: 'log-002-1', store_id: 'store-002', task_id: null,         action_type: 'phase_change',   old_value: '契約完了',     new_value: '内装進行中',     updated_by: '佐藤 健一',  updated_at: '2026-03-08T11:00:00' },
    { id: 'log-002-2', store_id: 'store-002', task_id: 'st002-08',   action_type: 'status_change',  old_value: '未着手',       new_value: '対応中',         updated_by: '施工チーム', updated_at: '2026-03-12T09:00:00' },
  ],
  'store-003': [
    { id: 'log-003-1', store_id: 'store-003', task_id: null,         action_type: 'phase_change',   old_value: '内装進行中',   new_value: '採用進行中',     updated_by: '田中 太郎',  updated_at: '2026-03-14T13:00:00' },
    { id: 'log-003-2', store_id: 'store-003', task_id: 'st003-16',   action_type: 'status_change',  old_value: '未着手',       new_value: '対応中',         updated_by: '人事担当',   updated_at: '2026-03-14T14:00:00' },
  ],
  'store-004': [
    { id: 'log-004-1', store_id: 'store-004', task_id: 'st004-04',   action_type: 'status_change',  old_value: '対応中',       new_value: '完了',           updated_by: '伊藤 美咲',  updated_at: '2026-03-15T17:00:00' },
    { id: 'log-004-2', store_id: 'store-004', task_id: null,         action_type: 'phase_change',   old_value: '契約準備',     new_value: '契約完了',       updated_by: '伊藤 美咲',  updated_at: '2026-03-15T17:10:00' },
  ],
  'store-005': [
    { id: 'log-005-1', store_id: 'store-005', task_id: null,         action_type: 'phase_change',   old_value: 'オープン準備中','new_value': 'オープン済み', updated_by: '山田 花子',  updated_at: '2026-02-01T09:00:00' },
    { id: 'log-005-2', store_id: 'store-005', task_id: 'st005-29',   action_type: 'status_change',  old_value: '対応中',       new_value: '完了',           updated_by: '山田 花子',  updated_at: '2026-01-28T18:00:00' },
  ],
};

// ============================================================
// PHASE CHECK TEMPLATES
// フェーズごとの段取り・必要書類・確認事項チェックリスト
//
// item_type:
//   'checklist'    → 段取り（やること）
//   'document'     → 必要書類（用意するもの）
//   'confirmation' → 確認事項（確認すること）
//
// 将来の本番置き換えポイント:
//   /api/phase-check-templates?phase=xxx からフェッチに差し替え可能
// ============================================================
const PHASE_CHECK_TEMPLATES = {

  '物件調整中': [
    { id: 'pct-bk-01', phase_name: '物件調整中', item_name: '物件候補確認',       item_type: 'checklist',    is_required: true,  sort_order: 1 },
    { id: 'pct-bk-02', phase_name: '物件調整中', item_name: '住所確定',           item_type: 'document',     is_required: true,  sort_order: 2 },
    { id: 'pct-bk-03', phase_name: '物件調整中', item_name: 'オーナー情報確認',   item_type: 'confirmation', is_required: true,  sort_order: 3 },
  ],

  '契約準備': [
    { id: 'pct-ct-01', phase_name: '契約準備', item_name: '契約書確認',       item_type: 'document',     is_required: true,  sort_order: 1 },
    { id: 'pct-ct-02', phase_name: '契約準備', item_name: '請求書確認',       item_type: 'document',     is_required: true,  sort_order: 2 },
    { id: 'pct-ct-03', phase_name: '契約準備', item_name: '初期費用確認',     item_type: 'confirmation', is_required: true,  sort_order: 3 },
    { id: 'pct-ct-04', phase_name: '契約準備', item_name: '会社情報確認',     item_type: 'confirmation', is_required: true,  sort_order: 4 },
    { id: 'pct-ct-05', phase_name: '契約準備', item_name: '物件資料回収',     item_type: 'document',     is_required: true,  sort_order: 5 },
  ],

  '内装進行中': [
    { id: 'pct-in-01', phase_name: '内装進行中', item_name: '図面確認',               item_type: 'document',     is_required: true,  sort_order: 1 },
    { id: 'pct-in-02', phase_name: '内装進行中', item_name: '看板位置確認',           item_type: 'confirmation', is_required: true,  sort_order: 2 },
    { id: 'pct-in-03', phase_name: '内装進行中', item_name: '内装スケジュール確認',   item_type: 'confirmation', is_required: true,  sort_order: 3 },
    { id: 'pct-in-04', phase_name: '内装進行中', item_name: '電源確認',               item_type: 'checklist',    is_required: true,  sort_order: 4 },
    { id: 'pct-in-05', phase_name: '内装進行中', item_name: 'ネット回線確認',         item_type: 'checklist',    is_required: true,  sort_order: 5 },
  ],

  'クリエイティブ準備中': [
    { id: 'pct-cr-01', phase_name: 'クリエイティブ準備中', item_name: '店舗情報確認',       item_type: 'confirmation', is_required: true,  sort_order: 1 },
    { id: 'pct-cr-02', phase_name: 'クリエイティブ準備中', item_name: 'チラシ原稿確認',     item_type: 'document',     is_required: true,  sort_order: 2 },
    { id: 'pct-cr-03', phase_name: 'クリエイティブ準備中', item_name: '名刺情報確認',       item_type: 'document',     is_required: true,  sort_order: 3 },
    { id: 'pct-cr-04', phase_name: 'クリエイティブ準備中', item_name: 'Web掲載情報確認',    item_type: 'confirmation', is_required: true,  sort_order: 4 },
    { id: 'pct-cr-05', phase_name: 'クリエイティブ準備中', item_name: '看板掲載内容確認',   item_type: 'document',     is_required: true,  sort_order: 5 },
  ],

  'システム準備中': [
    { id: 'pct-sy-01', phase_name: 'システム準備中', item_name: '予約システム設定', item_type: 'checklist',    is_required: true,  sort_order: 1 },
    { id: 'pct-sy-02', phase_name: 'システム準備中', item_name: '決済端末準備',     item_type: 'checklist',    is_required: true,  sort_order: 2 },
    { id: 'pct-sy-03', phase_name: 'システム準備中', item_name: 'Googleマップ確認', item_type: 'confirmation', is_required: true,  sort_order: 3 },
    { id: 'pct-sy-04', phase_name: 'システム準備中', item_name: '導線確認',         item_type: 'checklist',    is_required: false, sort_order: 4 },
  ],

  'オープン準備中': [
    { id: 'pct-op-01', phase_name: 'オープン準備中', item_name: '備品確認',         item_type: 'document',     is_required: true,  sort_order: 1 },
    { id: 'pct-op-02', phase_name: 'オープン準備中', item_name: 'スタッフ周知',     item_type: 'checklist',    is_required: true,  sort_order: 2 },
    { id: 'pct-op-03', phase_name: 'オープン準備中', item_name: '最終導線確認',     item_type: 'checklist',    is_required: true,  sort_order: 3 },
    { id: 'pct-op-04', phase_name: 'オープン準備中', item_name: '告知確認',         item_type: 'confirmation', is_required: true,  sort_order: 4 },
  ],
};

// ============================================================
// MOCK PHASE CHECKS (初期デモデータ)
// 将来は /api/store-phase-checks?store_id=xxx に差し替え可能
// ============================================================
const MOCK_PHASE_CHECKS = {

  'store-001': [ // オープン準備中: 1/4完了
    { id: 'pc-001-01', store_id: 'store-001', phase_name: 'オープン準備中', template_id: 'pct-op-01', item_name: '備品確認',     item_type: 'document',     is_required: true,  sort_order: 1, status: 'completed', checked_at: '2026-03-08T09:00:00', checked_by: '山田 花子', note: '全品発注済み', created_at: '2026-03-01', updated_at: '2026-03-08' },
    { id: 'pc-001-02', store_id: 'store-001', phase_name: 'オープン準備中', template_id: 'pct-op-02', item_name: 'スタッフ周知', item_type: 'checklist',    is_required: true,  sort_order: 2, status: 'pending',   checked_at: '',                    checked_by: '',          note: '',            created_at: '2026-03-01', updated_at: '2026-03-01' },
    { id: 'pc-001-03', store_id: 'store-001', phase_name: 'オープン準備中', template_id: 'pct-op-03', item_name: '最終導線確認', item_type: 'checklist',    is_required: true,  sort_order: 3, status: 'pending',   checked_at: '',                    checked_by: '',          note: '',            created_at: '2026-03-01', updated_at: '2026-03-01' },
    { id: 'pc-001-04', store_id: 'store-001', phase_name: 'オープン準備中', template_id: 'pct-op-04', item_name: '告知確認',     item_type: 'confirmation', is_required: true,  sort_order: 4, status: 'pending',   checked_at: '',                    checked_by: '',          note: 'チラシ配布未', created_at: '2026-03-01', updated_at: '2026-03-01' },
  ],

  'store-002': [ // 内装進行中: 2/5完了
    { id: 'pc-002-01', store_id: 'store-002', phase_name: '内装進行中', template_id: 'pct-in-01', item_name: '図面確認',             item_type: 'document',     is_required: true,  sort_order: 1, status: 'completed', checked_at: '2026-03-08T10:00:00', checked_by: '佐藤 健一', note: '',            created_at: '2026-03-08', updated_at: '2026-03-08' },
    { id: 'pc-002-02', store_id: 'store-002', phase_name: '内装進行中', template_id: 'pct-in-02', item_name: '看板位置確認',         item_type: 'confirmation', is_required: true,  sort_order: 2, status: 'pending',   checked_at: '',                    checked_by: '',          note: '',            created_at: '2026-03-08', updated_at: '2026-03-08' },
    { id: 'pc-002-03', store_id: 'store-002', phase_name: '内装進行中', template_id: 'pct-in-03', item_name: '内装スケジュール確認', item_type: 'confirmation', is_required: true,  sort_order: 3, status: 'completed', checked_at: '2026-03-10T11:00:00', checked_by: '佐藤 健一', note: '4/20完了予定', created_at: '2026-03-08', updated_at: '2026-03-10' },
    { id: 'pc-002-04', store_id: 'store-002', phase_name: '内装進行中', template_id: 'pct-in-04', item_name: '電源確認',             item_type: 'checklist',    is_required: true,  sort_order: 4, status: 'pending',   checked_at: '',                    checked_by: '',          note: '',            created_at: '2026-03-08', updated_at: '2026-03-08' },
    { id: 'pc-002-05', store_id: 'store-002', phase_name: '内装進行中', template_id: 'pct-in-05', item_name: 'ネット回線確認',       item_type: 'checklist',    is_required: true,  sort_order: 5, status: 'pending',   checked_at: '',                    checked_by: '',          note: '',            created_at: '2026-03-08', updated_at: '2026-03-08' },
    { id: 'pc-002-06', store_id: 'store-002', phase_name: '内装進行中', template_id: 'pct-in-06', item_name: '工事見積書',           item_type: 'document',     is_required: true,  sort_order: 6, status: 'pending',   checked_at: '',                    checked_by: '',          note: 'FC側から未提出', created_at: '2026-03-08', updated_at: '2026-03-08' },
  ],

  'store-003': [], // 採用進行中（テンプレートなし）

  'store-004': [ // 契約完了 → 契約準備フェーズのチェックは全完了
    { id: 'pc-004-01', store_id: 'store-004', phase_name: '契約準備', template_id: 'pct-ct-01', item_name: '契約書確認',   item_type: 'document',     is_required: true,  sort_order: 1, status: 'completed', checked_at: '2026-03-09T14:00:00', checked_by: '伊藤 美咲', note: '', created_at: '2026-03-01', updated_at: '2026-03-09' },
    { id: 'pc-004-02', store_id: 'store-004', phase_name: '契約準備', template_id: 'pct-ct-02', item_name: '請求書確認',   item_type: 'document',     is_required: true,  sort_order: 2, status: 'completed', checked_at: '2026-03-11T09:00:00', checked_by: '伊藤 美咲', note: '', created_at: '2026-03-01', updated_at: '2026-03-11' },
    { id: 'pc-004-03', store_id: 'store-004', phase_name: '契約準備', template_id: 'pct-ct-03', item_name: '初期費用確認', item_type: 'confirmation', is_required: true,  sort_order: 3, status: 'completed', checked_at: '2026-03-11T10:00:00', checked_by: '伊藤 美咲', note: '', created_at: '2026-03-01', updated_at: '2026-03-11' },
    { id: 'pc-004-04', store_id: 'store-004', phase_name: '契約準備', template_id: 'pct-ct-04', item_name: '会社情報確認', item_type: 'confirmation', is_required: true,  sort_order: 4, status: 'completed', checked_at: '2026-03-13T11:00:00', checked_by: '伊藤 美咲', note: '', created_at: '2026-03-01', updated_at: '2026-03-13' },
    { id: 'pc-004-05', store_id: 'store-004', phase_name: '契約準備', template_id: 'pct-ct-05', item_name: '物件資料回収', item_type: 'document',     is_required: true,  sort_order: 5, status: 'completed', checked_at: '2026-03-14T15:00:00', checked_by: '伊藤 美咲', note: '', created_at: '2026-03-01', updated_at: '2026-03-14' },
  ],

  'store-005': [ // オープン済み → オープン準備中フェーズのチェックは全完了
    { id: 'pc-005-01', store_id: 'store-005', phase_name: 'オープン準備中', template_id: 'pct-op-01', item_name: '備品確認',     item_type: 'document',     is_required: true,  sort_order: 1, status: 'completed', checked_at: '2026-01-14T09:00:00', checked_by: '山田 花子', note: '',            created_at: '2026-01-01', updated_at: '2026-01-14' },
    { id: 'pc-005-02', store_id: 'store-005', phase_name: 'オープン準備中', template_id: 'pct-op-02', item_name: 'スタッフ周知', item_type: 'checklist',    is_required: true,  sort_order: 2, status: 'completed', checked_at: '2026-01-20T10:00:00', checked_by: '山田 花子', note: '',            created_at: '2026-01-01', updated_at: '2026-01-20' },
    { id: 'pc-005-03', store_id: 'store-005', phase_name: 'オープン準備中', template_id: 'pct-op-03', item_name: '最終導線確認', item_type: 'checklist',    is_required: true,  sort_order: 3, status: 'completed', checked_at: '2026-01-28T14:00:00', checked_by: '山田 花子', note: '',            created_at: '2026-01-01', updated_at: '2026-01-28' },
    { id: 'pc-005-04', store_id: 'store-005', phase_name: 'オープン準備中', template_id: 'pct-op-04', item_name: '告知確認',     item_type: 'confirmation', is_required: true,  sort_order: 4, status: 'completed', checked_at: '2026-01-28T15:00:00', checked_by: '山田 花子', note: 'チラシ配布完了', created_at: '2026-01-01', updated_at: '2026-01-28' },
  ],
};

// ============================================================
// MOCK COMMENTS (store_id → comment[])
// ============================================================
const MOCK_COMMENTS = {
  'store-001': [
    { id: 'cm-001-01', store_id: 'store-001', author: '山田 花子', body: '看板設置の業者から連絡あり。3/25に完了予定で確定。このまま進める。', created_at: '2026-03-15' },
    { id: 'cm-001-02', store_id: 'store-001', author: '田中 太郎', body: '予約システムの設定が3/14期限を過ぎてしまっている。システム担当に今日中に確認する。', created_at: '2026-03-14' },
    { id: 'cm-001-03', store_id: 'store-001', author: '山田 花子', body: '研修スケジュール確定。4/3〜4/5の3日間で実施。対象スタッフ5名に通知済み。', created_at: '2026-03-12' },
    { id: 'cm-001-04', store_id: 'store-001', author: '田中 太郎', body: 'オープン準備全体の進捗を確認。内装完了・チラシ承認・採用完了が揃ったので順調に進んでいる。', created_at: '2026-03-10' },
  ],
  'store-002': [
    { id: 'cm-002-01', store_id: 'store-002', author: '佐藤 健一', body: '内装工事が3月中旬に着工。スケジュール通り4/20完成を目指している。', created_at: '2026-03-12' },
    { id: 'cm-002-02', store_id: 'store-002', author: '佐藤 健一', body: '求人掲載の期限3/14が迫っているが、まだ掲載先が決まっていない。人事に確認が必要。', created_at: '2026-03-11' },
  ],
  'store-003': [
    { id: 'cm-003-01', store_id: 'store-003', author: '田中 太郎', body: '採用面接を開始した。現在応募5名、4月中に3名採用目標。', created_at: '2026-03-14' },
  ],
  'store-004': [
    { id: 'cm-004-01', store_id: 'store-004', author: '伊藤 美咲', body: '契約フェーズ完了確認。物件契約の交渉が少し長引いているが、3/28には締結できる見込み。', created_at: '2026-03-15' },
  ],
  'store-005': [
    { id: 'cm-005-01', store_id: 'store-005', author: '山田 花子', body: '名古屋栄店、2/1グランドオープン完了。初日来客数は目標の110%。運営移行フェーズに入った。', created_at: '2026-02-01' },
  ],
};
