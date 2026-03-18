import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════════════
// 店舗データ
// ════════════════════════════════════════════════════════════

const seedData = [
  {
    name: 'アイケアラボ 駒込店',
    category: '眼科・コンタクト',
    currentPhase: 'デザイン',
    startDate: '2026-03-01',
    deadline: '2026-04-30',
    memo: 'シンプルで清潔感のあるデザインを希望。カラー：白・水色系。',
    whoWaiting: 'owner',
    tasks: [
      { title: 'ヒアリングシート送付', done: true,  phase: '企画',    order: 0, whoWaiting: 'none' },
      { title: '要件定義書作成',       done: true,  phase: '企画',    order: 1, whoWaiting: 'none' },
      { title: 'ワイヤーフレーム作成', done: true,  phase: 'デザイン', order: 2, whoWaiting: 'none' },
      { title: 'デザインカンプ提出',   done: false, phase: 'デザイン', order: 3, whoWaiting: 'admin' },
      { title: 'コーディング',         done: false, phase: '制作',    order: 4, whoWaiting: 'none' },
      { title: '動作確認・修正',       done: false, phase: '制作',    order: 5, whoWaiting: 'none' },
      { title: '本番公開',             done: false, phase: '納品',    order: 6, whoWaiting: 'none' },
    ],
  },
  {
    name: 'アイケアラボ 南浦和店',
    category: '眼科・コンタクト',
    currentPhase: '制作',
    startDate: '2026-02-15',
    deadline: '2026-04-15',
    memo: '店舗写真は3月末に受け取り予定。予約フォームのSNS連携が必要。',
    whoWaiting: 'owner',
    tasks: [
      { title: 'ヒアリング完了',           done: true,  phase: '企画',    order: 0, whoWaiting: 'none' },
      { title: 'サイトマップ作成',         done: true,  phase: '企画',    order: 1, whoWaiting: 'none' },
      { title: 'デザイン確定',             done: true,  phase: 'デザイン', order: 2, whoWaiting: 'none' },
      { title: 'TOPページ制作',            done: true,  phase: '制作',    order: 3, whoWaiting: 'none' },
      { title: 'メニューページ制作',       done: true,  phase: '制作',    order: 4, whoWaiting: 'none' },
      { title: 'アクセスページ制作',       done: false, phase: '制作',    order: 5, whoWaiting: 'owner' },
      { title: 'お問い合わせフォーム設置', done: false, phase: '制作',    order: 6, whoWaiting: 'none' },
      { title: '最終確認・公開',           done: false, phase: '納品',    order: 7, whoWaiting: 'none' },
    ],
  },
  {
    name: 'アイケアラボ 渋谷店',
    category: '眼科・コンタクト',
    currentPhase: '企画',
    startDate: '2026-03-10',
    deadline: '2026-05-31',
    memo: '予約システム導入を検討中。LINE連携希望。',
    whoWaiting: 'none',
    tasks: [
      { title: '初回ヒアリング',       done: true,  phase: '企画',    order: 0, whoWaiting: 'none' },
      { title: '競合サイト調査',       done: false, phase: '企画',    order: 1, whoWaiting: 'admin' },
      { title: '要件定義書作成',       done: false, phase: '企画',    order: 2, whoWaiting: 'none' },
      { title: 'ワイヤーフレーム作成', done: false, phase: 'デザイン', order: 3, whoWaiting: 'none' },
      { title: 'デザインカンプ提出',   done: false, phase: 'デザイン', order: 4, whoWaiting: 'none' },
      { title: 'コーディング',         done: false, phase: '制作',    order: 5, whoWaiting: 'none' },
      { title: '公開・納品',           done: false, phase: '納品',    order: 6, whoWaiting: 'none' },
    ],
  },
  {
    name: 'アイケアラボ 池袋店',
    category: '眼科・コンタクト',
    currentPhase: '納品',
    startDate: '2026-01-10',
    deadline: '2026-03-20',
    memo: '予約フォームの修正のみ残り。来週中に完了予定。',
    whoWaiting: 'none',
    tasks: [
      { title: 'ヒアリング',           done: true,  phase: '企画',    order: 0, whoWaiting: 'none' },
      { title: '要件定義',             done: true,  phase: '企画',    order: 1, whoWaiting: 'none' },
      { title: 'デザイン確定',         done: true,  phase: 'デザイン', order: 2, whoWaiting: 'none' },
      { title: 'コーディング完了',     done: true,  phase: '制作',    order: 3, whoWaiting: 'none' },
      { title: '動作確認',             done: true,  phase: '制作',    order: 4, whoWaiting: 'none' },
      { title: '予約フォーム最終修正', done: false, phase: '納品',    order: 5, whoWaiting: 'owner' },
      { title: '本番公開・完了報告',   done: false, phase: '納品',    order: 6, whoWaiting: 'none' },
    ],
  },
];

// ════════════════════════════════════════════════════════════
// 必要項目（スプレッドシート差分補完後の完全版）
// ════════════════════════════════════════════════════════════
// [差分補完] 以下の項目を追加（スプレッドシートは参照不可のため眼科クリニックWebプロジェクト標準フロー基準）:
// - 院長・スタッフプロフィール文
// - キャッチコピー・コンセプト文
// - 診療内容・料金表
// - コンタクトレンズ取扱いブランド一覧
// - ドメイン名の希望・取得状況
// - SNS・口コミサイトURL
// - お問い合わせ先（電話・メール）確認
// - 予約システム情報
// - プライバシーポリシー文面
// - Googleマイビジネス掲載URL
// - 既存サイトURL（リニューアル有無）
// - 院内写真（待合室・診察室）

function requiredItems(storeId: string) {
  return [
    // ── 企画フェーズ ─────────────────────────────────────────
    {
      storeId,
      category: 'document',
      label: '既存サイトURL・リニューアル有無の確認',
      description: '現在Webサイトをお持ちの場合はURLをお知らせください。リニューアルか新規作成かで設計が変わります。',
      requiredPhase: '企画',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: '企画担当',
      whoWaiting: 'none',
      dueLabel: '企画開始時',
      reason: 'リニューアルの場合はドメイン・SEO引き継ぎの設計が必要です。',
      status: 'approved',
      sortOrder: 0,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'document',
      label: 'ドメイン名の希望・取得状況',
      description: '希望するドメイン名（例: aicare-komagome.com）と、既に取得済みかどうかをお知らせください。',
      requiredPhase: '企画',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: '企画担当',
      whoWaiting: 'owner',
      dueLabel: '企画フェーズ中',
      reason: 'ドメインが未取得の場合、制作完了後すぐに公開できるよう早めに確保する必要があります。',
      status: 'pending',
      sortOrder: 1,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'document',
      label: 'お問い合わせ先（電話番号・メールアドレス）',
      description: 'サイトに掲載する代表電話番号・メールアドレスをご確認ください。予約受付・一般問い合わせの区分も合わせて教えてください。',
      requiredPhase: '企画',
      assigneeType: 'owner',
      ownerResponsibleName: '受付担当',
      adminResponsibleName: '企画担当',
      whoWaiting: 'none',
      dueLabel: '企画フェーズ中',
      reason: '掲載情報に誤りがあると患者様への信頼を損ないます。必ず正式な連絡先をご確認ください。',
      status: 'approved',
      sortOrder: 2,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'sns',
      label: 'SNS・口コミサイトのURL一覧',
      description: 'Instagram / Googleマイビジネス / Epark / じゃらん等、運用中のアカウントURLをすべてお知らせください。',
      requiredPhase: '企画',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: '企画担当',
      whoWaiting: 'owner',
      dueLabel: '企画フェーズ中',
      reason: 'サイトからSNSへの導線を設計するため、どのアカウントを運用しているか把握が必要です。',
      status: 'pending',
      sortOrder: 3,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    // ── デザインフェーズ ─────────────────────────────────────
    {
      storeId,
      category: 'document',
      label: 'キャッチコピー・コンセプト文',
      description: 'サイトのファーストビューに掲載するキャッチコピーと、「どんな患者様に来てほしいか」を表す2〜3文のコンセプトをお願いします。',
      requiredPhase: 'デザイン',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'コピーライティング担当',
      whoWaiting: 'owner',
      dueLabel: 'デザインカンプ作成前',
      reason: 'キャッチコピーはサイトの第一印象を決める最重要テキストです。担当者と一緒に作成することを推奨します。',
      status: 'pending',
      sortOrder: 4,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'photo',
      label: '店舗外観写真',
      description: 'Webサイトのファーストビューやアクセスページで使用するメイン外観写真です。',
      requiredPhase: 'デザイン',
      assigneeType: 'owner',
      ownerResponsibleName: '店長',
      adminResponsibleName: 'Webデザイン担当',
      whoWaiting: 'owner',
      dueLabel: 'デザイン開始前（3月末まで）',
      reason: 'デザインカンプ制作の前に実素材が必要なため、早めに準備をお願いします。',
      status: 'pending',
      sortOrder: 5,
      isPhotoRequired: true,
      guideTitle: '外観写真の撮影ガイド',
      guideDescription: '以下の5パターンを撮影してください。晴れた日の午前中（10:00〜12:00）がおすすめです。',
      guideChecklistJson: JSON.stringify([
        { label: '正面から1枚', description: '入口が中央に来るよう真っすぐ撮影してください。' },
        { label: '左斜め（45度）から1枚', description: '建物の奥行きが分かるよう斜めから撮影。' },
        { label: '右斜め（45度）から1枚', description: '同様に反対側からも撮影してください。' },
        { label: '周辺道路が分かる引き1枚', description: '交差点や目印が分かるよう引いた構図で。' },
        { label: '看板設置想定箇所の寄り1枚', description: '看板を取り付ける予定箇所をアップで撮影。' },
      ]),
    },
    {
      storeId,
      category: 'logo',
      label: 'ロゴデータ（SVGまたは高解像度PNG）',
      description: 'ヘッダーやファビコンに使用するロゴファイルです。',
      requiredPhase: 'デザイン',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'デザイン担当',
      whoWaiting: 'owner',
      dueLabel: 'デザイン開始前',
      reason: 'ロゴがないとデザイン作業が進められません。',
      status: 'pending',
      sortOrder: 6,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    // ── 制作フェーズ ─────────────────────────────────────────
    {
      storeId,
      category: 'document',
      label: '院長・スタッフプロフィール文',
      description: 'スタッフ紹介ページに掲載する院長・スタッフの略歴・ひとこと・資格等をご提供ください。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'owner',
      dueLabel: '制作フェーズ開始前',
      reason: '信頼感を高めるためプロフィール情報は必須です。後回しにすると公開遅延の原因になります。',
      status: 'pending',
      sortOrder: 7,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'photo',
      label: 'スタッフ写真（院長・スタッフ）',
      description: 'スタッフ紹介ページに掲載する写真です。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'Webデザイン担当',
      whoWaiting: 'owner',
      dueLabel: '制作フェーズ開始前',
      reason: '信頼感を高めるためスタッフ顔写真は必須です。',
      status: 'pending',
      sortOrder: 8,
      isPhotoRequired: true,
      guideTitle: 'スタッフ写真の撮影ガイド',
      guideDescription: '白または薄いグレーの背景で撮影すると統一感が出ます。',
      guideChecklistJson: JSON.stringify([
        { label: '院長の正面バストアップ', description: '白衣着用、正面向き、背景は白または薄グレー。' },
        { label: 'スタッフ全員の集合写真', description: '受付カウンター前で横一列に並んで撮影。' },
        { label: '診療中のシーン写真（任意）', description: '患者対応中の自然な表情を撮影（患者が映らないよう注意）。' },
      ]),
    },
    {
      storeId,
      category: 'photo',
      label: '院内写真（待合室・診察室・受付）',
      description: '院内の雰囲気を伝える写真です。待合室・診察室・受付カウンターの3箇所が理想です。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'Webデザイン担当',
      whoWaiting: 'owner',
      dueLabel: '制作フェーズ中',
      reason: '院内の雰囲気が分かると「安心して行けそう」という印象を与えられます。初診患者の来院率に影響します。',
      status: 'pending',
      sortOrder: 9,
      isPhotoRequired: true,
      guideTitle: '院内写真の撮影ガイド',
      guideDescription: '患者様がいない時間帯（開院前・休診日）に撮影してください。',
      guideChecklistJson: JSON.stringify([
        { label: '待合室の全体写真', description: '椅子・照明・内装が分かる広角ショット。清潔感が伝わるよう整頓してから撮影。' },
        { label: '診察室の写真', description: '検査機器が見える構図で。プライバシーに配慮した角度で。' },
        { label: '受付カウンターの写真', description: 'スタッフが立つ位置から見た構図で撮影。' },
      ]),
    },
    {
      storeId,
      category: 'document',
      label: '診療内容・料金表',
      description: '提供する診療メニューと費用（保険・自費別）をまとめたテキストをご提供ください。コンタクトレンズの処方流れも含めてください。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '受付担当',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'owner',
      dueLabel: 'コーディング開始前',
      reason: '料金・メニューは患者様が最も確認したい情報です。掲載漏れがあると問い合わせ増加の原因になります。',
      status: 'pending',
      sortOrder: 10,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'document',
      label: 'コンタクトレンズ取扱いブランド一覧',
      description: '取り扱い中のコンタクトレンズメーカー・ブランド名の一覧をご提供ください。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '受付担当',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'owner',
      dueLabel: 'コーディング開始前',
      reason: '「取扱いブランド名で検索して来院する患者様」を取りこぼさないために必要なコンテンツです。',
      status: 'pending',
      sortOrder: 11,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'document',
      label: '診療時間・休診日の情報',
      description: '診療時間表ページ・フッターに掲載する最新の情報です。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '受付担当',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'none',
      dueLabel: 'コーディング開始前',
      reason: '間違いがあると医院の信頼性に関わります。最新情報を必ずご確認ください。',
      status: 'approved',
      sortOrder: 12,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'access',
      label: 'アクセス情報（住所・最寄り駅・駐車場）',
      description: 'アクセスページに掲載する情報です。Google マップの埋め込みURLも合わせてご提供ください。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'admin',
      dueLabel: 'コーディング開始前',
      reason: '患者さんが迷わないよう正確なアクセス情報が必要です。',
      status: 'submitted',
      sortOrder: 13,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'document',
      label: '予約システムの情報（LINE・電話・外部サービス）',
      description: '患者様の予約方法を教えてください。電話のみ / LINE予約 / ホットペッパー / 自社フォーム等。導入済みの場合はURLや管理情報もお知らせください。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'owner',
      dueLabel: 'コーディング開始前',
      reason: '予約フローによってCTA（ボタン）の設計が変わります。早めの確定が必要です。',
      status: 'pending',
      sortOrder: 14,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    {
      storeId,
      category: 'document',
      label: 'プライバシーポリシー文面の確認',
      description: '患者様の個人情報取り扱いに関するプライバシーポリシーです。既存の文面があればご提供ください。ない場合はテンプレートを作成します。',
      requiredPhase: '制作',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'コーディング担当',
      whoWaiting: 'owner',
      dueLabel: '公開前',
      reason: '医療機関のサイトにはプライバシーポリシーの掲載が必須です（個人情報保護法対応）。',
      status: 'pending',
      sortOrder: 15,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
    // ── 納品フェーズ ─────────────────────────────────────────
    {
      storeId,
      category: 'sns',
      label: 'Googleマイビジネス（GBP）の登録・URL確認',
      description: 'Googleマップ・ローカル検索への掲載のため、Googleビジネスプロフィールの登録URLと管理権限の確認が必要です。',
      requiredPhase: '納品',
      assigneeType: 'owner',
      ownerResponsibleName: '院長',
      adminResponsibleName: 'SEO担当',
      whoWaiting: 'owner',
      dueLabel: '公開前',
      reason: 'ローカルSEO（「近くのコンタクト眼科」等）で上位表示されるために必須の設定です。',
      status: 'pending',
      sortOrder: 16,
      isPhotoRequired: false,
      guideTitle: '',
      guideDescription: '',
      guideChecklistJson: '[]',
    },
  ];
}

// ════════════════════════════════════════════════════════════
// 購入備品（新規追加）
function purchaseItems(storeId: string) {
  return [
    // ── 必須品（must）──
    {
      storeId,
      category: 'equipment',
      name: '商用Webフォントライセンス（モリサワ TypeSquare）',
      brand: 'モリサワ',
      price: '¥5,500〜/年',
      url: 'https://typesquare.com',
      emoji: '🔤',
      tag: '必須',
      tagColor: '#dc2626',
      desc: 'Webサイトに日本語フォントを使用する場合、商用ライセンスが必要です。無断使用は著作権侵害になります。',
      notes: '「TypeSquare」はWebフォント専用ライセンスです。書体によって価格が異なりますので、担当者が選定した書体名を確認の上で購入してください。',
      necessity: 'must',
      phase: 'デザイン',
      status: 'pending',
      sortOrder: 0,
    },
    {
      storeId,
      category: 'service',
      name: 'レンタルサーバー契約（Xserver ビジネス）',
      brand: 'Xserver',
      price: '¥1,100/月〜',
      url: 'https://www.xserver.ne.jp',
      emoji: '🖥️',
      tag: '必須',
      tagColor: '#dc2626',
      desc: 'サイト公開に必要なサーバーです。自動バックアップ・SSL無料付き。制作完了前に契約しておくことを推奨します。',
      notes: '契約後、DNS（ネームサーバー）の切り替えに最大24〜72時間かかります。公開日から逆算して余裕を持って契約してください。契約者名・ログイン情報は必ず担当者と共有してください。',
      necessity: 'must',
      phase: '制作',
      status: 'pending',
      sortOrder: 1,
    },
    {
      storeId,
      category: 'service',
      name: 'Googleアナリティクス4 設定',
      brand: 'Google',
      price: '無料',
      url: 'https://analytics.google.com',
      emoji: '📊',
      tag: '必須',
      tagColor: '#dc2626',
      desc: '公開と同時にアクセス計測を開始しないと初動データが取れません。設定後クライアントに権限を引き渡してください。',
      notes: '設定には医院のGoogleアカウント（Gmail）が必要です。担当者に「管理者権限」を付与する作業が発生しますので、Googleアカウントのメールアドレスを事前に担当者へお伝えください。',
      necessity: 'must',
      phase: '納品',
      status: 'pending',
      sortOrder: 2,
    },
    // ── 推奨品（recommend）──
    {
      storeId,
      category: 'service',
      name: '写真素材サービス（Adobe Stock）',
      brand: 'Adobe',
      price: '¥3,828/月〜',
      url: 'https://stock.adobe.com/jp',
      emoji: '🖼️',
      tag: '推奨',
      tagColor: '#2563eb',
      desc: 'デザインカンプに実素材を使うとクライアント承認が早くなります。ダミー画像では承認率が下がります。',
      notes: 'Adobe CCのサブスクリプションと共用できます。月額プランは初月無料キャンペーンがある場合があります。素材の商用利用範囲を確認してください。',
      necessity: 'recommend',
      phase: 'デザイン',
      status: 'pending',
      sortOrder: 3,
    },
    {
      storeId,
      category: 'service',
      name: '電子契約サービス（freeeサイン）',
      brand: 'freee',
      price: '¥1,078/月〜',
      url: 'https://sign.freee.co.jp',
      emoji: '✍️',
      tag: '推奨',
      tagColor: '#2563eb',
      desc: '制作契約書・要件定義書をオンラインで締結できます。紙の往復コストと認識齟齬を同時に解消できます。',
      notes: '相手方（オーナー様）はアカウント不要でサインできます。署名後のPDFは自動保存されます。',
      necessity: 'recommend',
      phase: '企画',
      status: 'pending',
      sortOrder: 4,
    },
    // ── オーナー向け推奨購入品（recommend_product）──
    {
      storeId,
      category: 'recommend_product',
      name: 'コンタクトレンズ洗浄液（3本セット）',
      brand: 'ReNu マルチプラス',
      price: '¥1,680',
      url: 'https://www.amazon.co.jp/s?k=コンタクトレンズ+洗浄液+3本セット',
      emoji: '🧴',
      tag: 'よく売れています',
      tagColor: '#f59e0b',
      desc: '敏感な目にも使いやすい定番洗浄液。まとめ買いでコスパ◎',
      notes: 'コンタクトの種類（ソフト/ハード）に対応した洗浄液かご確認ください。使用期限はご注意ください。',
      necessity: 'recommend',
      phase: '',
      status: 'pending',
      sortOrder: 10,
    },
    {
      storeId,
      category: 'recommend_product',
      name: 'コンタクトレンズケース（ペア）',
      brand: 'メニコン',
      price: '¥480',
      url: 'https://www.amazon.co.jp/s?k=コンタクトレンズ+ケース',
      emoji: '📦',
      tag: 'アイケアの必需品',
      tagColor: '#8b5cf6',
      desc: 'スリムで持ち運びやすい。外出先での取り外しに便利。',
      notes: '定期的な交換をおすすめします。使用し続けると雑菌が繁殖する可能性があります。目安は1〜3ヶ月ごとの交換です。',
      necessity: 'recommend',
      phase: '',
      status: 'pending',
      sortOrder: 11,
    },
    {
      storeId,
      category: 'recommend_product',
      name: '人工涙液タイプ目薬',
      brand: 'ロート CLクール',
      price: '¥780',
      url: 'https://www.amazon.co.jp/s?k=目薬+コンタクト+人工涙液',
      emoji: '💧',
      tag: '医師推奨タイプ',
      tagColor: '#10b981',
      desc: 'コンタクト装着中でも使用可能。目の乾燥・疲れに効果的。',
      notes: '「コンタクト装着中使用可」と記載があるものをお選びください。清涼感の強いタイプはコンタクトを傷める場合があります。',
      necessity: 'recommend',
      phase: '',
      status: 'pending',
      sortOrder: 12,
    },
    {
      storeId,
      category: 'recommend_product',
      name: 'ブルーライトカットメガネ',
      brand: 'JINS SCREEN',
      price: '¥5,900',
      url: 'https://www.amazon.co.jp/s?k=ブルーライトカット+メガネ',
      emoji: '👓',
      tag: 'デジタル疲れに',
      tagColor: '#3b82f6',
      desc: 'PC・スマホの長時間使用による目の疲れを軽減。度なし・度付き対応。',
      notes: 'ブルーライトカット率が高いほどレンズが黄色みがかります。仕事・デザイン用途の場合は色再現性に影響する場合があります。',
      necessity: 'recommend',
      phase: '',
      status: 'pending',
      sortOrder: 13,
    },
  ];
}

// ════════════════════════════════════════════════════════════
// 候補（看板業者・印刷業者を追加）
// ════════════════════════════════════════════════════════════
// [差分補完] signage（看板業者）と printer（印刷業者）が存在しなかったため追加

function candidates(storeId: string) {
  return [
    // vendor
    {
      storeId,
      category: 'vendor',
      name: '株式会社クリエイトデザイン',
      summary: 'Webデザイン・コーディング専門。医療・クリニック系の実績多数。',
      pros: '医療系実績豊富\nアフターサポート3ヶ月付き\n制作期間が明確',
      cons: '価格帯が高め\n修正対応に時間がかかる場合あり',
      price: '¥500,000〜¥800,000',
      contact: '担当: 田中 / contact@create-design.example',
      url: 'https://create-design.example',
      score: 85,
      status: 'pending',
    },
    {
      storeId,
      category: 'vendor',
      name: 'フリーランス: 山田 Web制作',
      summary: 'Next.js/Tailwind専門。レスポンシブ・SEO対応得意。',
      pros: '修正対応が速い\n窓口が一本化で連絡しやすい\nコスパが良い',
      cons: '個人のため長期サポートにリスク\n大規模案件は難しい',
      price: '¥280,000〜¥400,000',
      contact: 'yamada@freelance.example',
      url: '',
      score: 72,
      status: 'pending',
    },
    // studio
    {
      storeId,
      category: 'studio',
      name: '写真スタジオ アイリス',
      summary: '店舗・スタッフ写真撮影専門。医療系クリニック撮影実績あり。',
      pros: '医療系撮影に慣れている\n当日編集・納品が可能\nロケ撮影対応',
      cons: '半日プランのみのため短時間では難しい\n土日は予約が取りにくい',
      price: '¥80,000〜¥150,000（半日プラン）',
      contact: '03-xxxx-xxxx / iris-studio@example.com',
      url: 'https://iris-studio.example',
      score: 90,
      status: 'selected',
    },
    // property
    {
      storeId,
      category: 'property',
      name: 'Xserver ビジネスプラン',
      summary: '高速SSD・自動バックアップ・独自SSL無料。PHP8対応。',
      pros: '高速・安定\n自動バックアップ\n移行サポート付き',
      cons: '競合と比較すると若干高め\nコントロールパネルがやや複雑',
      price: '¥1,100/月（年払い）',
      contact: 'support@xserver.ne.jp',
      url: 'https://www.xserver.ne.jp',
      score: 88,
      status: 'pending',
    },
    {
      storeId,
      category: 'property',
      name: 'Vercel + Supabase（Jamstack構成）',
      summary: 'Next.jsと相性最高。CDN配信で高速。',
      pros: 'CDN配信で高速\n無料枠が広い\n開発効率が高い',
      cons: 'WordPressを使いたい場合は不向き\nコンテンツ管理にCMS連携が別途必要',
      price: '¥0〜¥2,000/月（規模次第）',
      contact: 'https://vercel.com/support',
      url: 'https://vercel.com',
      score: 75,
      status: 'pending',
    },
    // signage ← 新規追加
    {
      storeId,
      category: 'signage',
      name: '株式会社サインマート',
      summary: '医療・クリニック向け看板制作専門。LEDサイン・壁面サイン・窓ガラスシート対応。',
      pros: '医療系クリニックへの納品実績が豊富\n現地調査から設置まで一貫対応\nデザインデータ入稿可',
      cons: '繁忙期は納期が伸びやすい（要余裕を持ったスケジューリング）\nエリアによっては現地調査費が別途発生',
      price: '¥50,000〜¥300,000（サイズ・仕様による）',
      contact: '0120-xxx-xxxx / info@signmart.example',
      url: 'https://signmart.example',
      score: 80,
      status: 'pending',
    },
    {
      storeId,
      category: 'signage',
      name: 'ローカルサイン工房',
      summary: '地域密着の看板業者。小ロット・短納期対応。',
      pros: '地域密着で現地対応が速い\n小ロットでも柔軟に対応\n価格がリーズナブル',
      cons: 'デザイン提案力はやや限定的\nWebサイトとの連動デザインは要調整',
      price: '¥30,000〜¥150,000',
      contact: '担当: 佐藤 / local-sign@example.com',
      url: '',
      score: 65,
      status: 'pending',
    },
    // printer ← 新規追加
    {
      storeId,
      category: 'printer',
      name: 'ラクスル（印刷通販）',
      summary: 'ネット印刷大手。名刺・チラシ・パンフレット・診察券を低コストで発注可能。',
      pros: '価格が業界最安水準\nWebで完結し納期が明確\n医療系テンプレートあり',
      cons: '修正対応は基本なし（データ入稿前の確認が重要）\n特殊加工は他社比較が必要',
      price: '名刺100枚¥950〜／A4チラシ100枚¥1,800〜',
      contact: 'https://raksul.com/support',
      url: 'https://raksul.com',
      score: 85,
      status: 'pending',
    },
  ];
}

// ════════════════════════════════════════════════════════════
// 相談
// ════════════════════════════════════════════════════════════

function consultations(storeId: string) {
  return [
    {
      storeId,
      title: 'デザイン修正回数の上限について',
      message: 'デザインカンプの修正回数に上限はありますか？何回まで無料ですか？',
      answer: '基本2回まで無料で対応しています。3回目以降は1回あたり¥15,000で承ります。',
      status: 'answered',
      targetType: 'general',
      targetId: '',
      createdBy: 'owner',
      consultationCategory: 'cost',
    },
    {
      storeId,
      title: '公開後のスタッフ写真追加について',
      message: '公開後にスタッフ写真を追加したい場合、どのくらいの費用がかかりますか？',
      answer: '',
      status: 'open',
      targetType: 'general',
      targetId: '',
      createdBy: 'owner',
      consultationCategory: 'cost',
    },
    {
      storeId,
      title: '外観写真の撮影タイミングについて',
      message: '外観写真はデザイン開始前に必ず必要ですか？制作フェーズに入ってからでも大丈夫ですか？',
      answer: '',
      status: 'open',
      targetType: 'required_item',
      targetId: '',
      createdBy: 'owner',
      consultationCategory: 'photo',
    },
    {
      storeId,
      title: 'コンタクトレンズブランド掲載の著作権について',
      message: 'メーカーのロゴや写真をサイトに掲載してもいいですか？許可が必要ですか？',
      answer: '',
      status: 'open',
      targetType: 'general',
      targetId: '',
      createdBy: 'owner',
      consultationCategory: 'design',
    },
  ];
}

// ════════════════════════════════════════════════════════════
// メイン
// ════════════════════════════════════════════════════════════

async function main() {
  console.log('シードデータを投入します...');

  // 既存データを全削除（依存関係順）
  await prisma.dailyMetrics.deleteMany();
  await prisma.eventLog.deleteMany();
  await prisma.notificationEvent.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.requiredItem.deleteMany();
  await prisma.uploadDestination.deleteMany();
  await prisma.flowSnapshot.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.store.deleteMany();

  for (const data of seedData) {
    const { tasks, whoWaiting, ...storeData } = data;
    const store = await prisma.store.create({
      data: {
        ...storeData,
        whoWaiting,
        tasks: { create: tasks },
      },
    });

    await prisma.requiredItem.createMany({ data: requiredItems(store.id) });
    await prisma.purchaseItem.createMany({ data: purchaseItems(store.id) });
    await prisma.candidate.createMany({ data: candidates(store.id) });
    await prisma.consultation.createMany({ data: consultations(store.id) });

    // UploadDestination（駒込店のみ設定済み）
    if (store.name === 'アイケアラボ 駒込店') {
      await prisma.uploadDestination.create({
        data: {
          storeId:           store.id,
          provider:          'google_drive',
          rootFolderName:    'アイケアラボ 駒込店 Webサイト制作',
          rootFolderUrl:     'https://drive.google.com/drive/folders/DUMMY_KOMAGOME',
          photoFolderUrl:    'https://drive.google.com/drive/folders/DUMMY_KOMAGOME_PHOTO',
          assetFolderUrl:    'https://drive.google.com/drive/folders/DUMMY_KOMAGOME_ASSET',
          documentFolderUrl: 'https://drive.google.com/drive/folders/DUMMY_KOMAGOME_DOC',
          isConfigured:      true,
        },
      });
    } else {
      await prisma.uploadDestination.create({ data: { storeId: store.id } });
    }

    // EventLog サンプル
    await prisma.eventLog.createMany({
      data: [
        {
          storeId:    store.id,
          actorType:  'admin',
          eventType:  'screen_viewed',
          targetType: 'store',
          targetId:   store.id,
          phase:      store.currentPhase,
          metaJson:   '{}',
        },
        {
          storeId:    store.id,
          actorType:  'owner',
          eventType:  'required_item_opened',
          targetType: 'required_item',
          targetId:   '',
          phase:      store.currentPhase,
          metaJson:   JSON.stringify({ label: '店舗外観写真' }),
        },
      ],
    });

    console.log(`  ✔ 作成: ${store.name} (${store.id})`);
  }

  console.log('シード完了');
}

main()
  .catch((e) => {
    console.error('シード失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
