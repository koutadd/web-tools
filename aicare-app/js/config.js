// ============================================================
// config.js — アイケアラボ アプリ 定数・権限設計
// ============================================================

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HQ_ADMIN:    'hq_admin',
  HQ_STAFF:    'hq_staff',
  FC_OWNER:    'fc_owner',
  VIEWER:      'viewer',
};

const ROLE_LABELS = {
  super_admin: 'スーパー管理者',
  hq_admin:    '本部管理者',
  hq_staff:    '本部スタッフ',
  fc_owner:    'FCオーナー',
  viewer:      '閲覧者',
};

const STORE_TYPES = { DIRECT: '直営', FC: 'FC' };

const PHASES = [
  '物件選定',
  '契約準備',
  '設計・工事',
  '内装・設備',
  '採用・研修',
  'クリエイティブ',
  'プレオープン',
  'グランドオープン',
  '運営移行',
];

const TASK_STATUSES = {
  PENDING:     '未着手',
  IN_PROGRESS: '対応中',
  DONE:        '完了',
  HOLD:        '保留',
};

const CHECK_TYPES = {
  CHECKLIST:    'checklist',
  DOCUMENT:     'document',
  CONFIRMATION: 'confirmation',
};

const CHECK_TYPE_LABELS = {
  checklist:    '段取り',
  document:     '必要書類',
  confirmation: '確認事項',
};

const STORE_STATUSES = {
  ON_TRACK: '順調',
  CAUTION:  '注意',
  DELAYED:  '遅延',
};

const GALLERY_CATEGORIES = [
  '外観', '内観', '看板', '施工中', 'オープン前', 'オープン後', '備品', 'その他',
];

const LOG_SOURCES = { APP: 'app', SHEET: 'sheet', SLACK: 'slack' };

const ACTION_TYPES = {
  STORE_CREATED:     'store_created',
  PHASE_CHANGED:     'phase_changed',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_ASSIGNEE_CHANGED: 'task_assignee_changed',
  TASK_CREATED:      'task_created',
  TASK_DELETED:      'task_deleted',
  CHECK_TOGGLED:     'check_toggled',
  COMMENT_ADDED:     'comment_added',
  GALLERY_UPLOADED:  'gallery_uploaded',
  GALLERY_DELETED:   'gallery_deleted',
  STORE_EDITED:      'store_edited',
};

// ============================================================
// 権限マトリクス
// ============================================================
const PERMISSIONS = {
  VIEW_ALL_STORES:         ['super_admin', 'hq_admin', 'hq_staff'],
  VIEW_OWN_STORE:          ['fc_owner', 'viewer'],
  EDIT_STORE_INFO:         ['super_admin', 'hq_admin', 'hq_staff'],
  UPDATE_PHASE:            ['super_admin', 'hq_admin'],
  MANAGE_TEMPLATES:        ['super_admin', 'hq_admin'],
  MANAGE_CONDITIONAL_RULES:['super_admin'],
  POST_COMMENT:            ['super_admin', 'hq_admin', 'hq_staff', 'fc_owner'],
  UPDATE_TASKS:            ['super_admin', 'hq_admin', 'hq_staff'],
  UPDATE_OWN_STORE_CHECKS: ['super_admin', 'hq_admin', 'hq_staff', 'fc_owner'],
  UPLOAD_GALLERY:          ['super_admin', 'hq_admin', 'hq_staff', 'fc_owner'],
  VIEW_LOGS:               ['super_admin', 'hq_admin', 'hq_staff'],
  MANAGE_USERS:            ['super_admin'],
  DELETE_STORE:            ['super_admin'],
};

// OP日起点の期限ルール種別
const DUE_RULE_TYPES = {
  FIXED_DATE:               'fixed_date',
  RELATIVE_TO_OPEN_DATE:    'relative_to_open_date',
  RELATIVE_TO_PREOPN_START: 'relative_to_pre_open_start',
  MANUAL:                   'manual',
};

// 条件分岐演算子
const CONDITION_OPS = {
  EQUALS:     'eq',
  NOT_EQUALS: 'neq',
  EXISTS:     'exists',
  IS_TRUE:    'is_true',
};

// Slack通知対象イベント
const SLACK_EVENTS = [
  'store_created',
  'phase_changed',
  'task_done',
  'task_overdue',
  'comment_added',
];

const LS_KEYS = {
  USERS:         'ac_users_v1',
  STORES:        'ac_stores_v1',
  TASKS:         'ac_tasks_v1',
  CHECKS:        'ac_checks_v1',
  COMMENTS:      'ac_comments_v1',
  LOGS:          'ac_logs_v1',
  GALLERY:       'ac_gallery_v1',
  MEMBERS:       'ac_members_v1',
  TASK_TEMPLATES:'ac_task_templates_v1',
  CHECK_TEMPLATES:'ac_check_templates_v1',
  AUTH:          'ac_auth_v1',
};
