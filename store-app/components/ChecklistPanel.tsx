'use client';

import { useState, useEffect, useRef } from 'react';

type GuideChecklistItem = { label: string; description: string };

type LatestSubmission = {
  id: string;
  fileUrl: string;
  fileName: string;
  driveFileId: string;
  driveFolderName: string;
  submitFolderUrl?: string; // 04_提出データ フォルダ URL（アップロード後にセット）
  status: string;
};

type RequiredItemRow = {
  id: string;
  category: string;
  label: string;
  description: string;
  requiredPhase: string;
  assigneeType: string;
  ownerResponsibleName: string;
  adminResponsibleName: string;
  whoWaiting: string;
  dueLabel: string;
  reason: string;
  status: string;
  isPhotoRequired: boolean;
  guideTitle: string;
  guideDescription: string;
  guideChecklistJson: string;
  latestSubmission: LatestSubmission | null;
};

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: '未提出',   bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  submitted: { label: '提出済み', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  approved:  { label: '承認済み', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  rejected:  { label: '差し戻し', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
};

const PHASES = ['企画', 'デザイン', '制作', '納品'];

// サーバー側の CATEGORY_TO_SUBFOLDER と同一マッピング
const CATEGORY_TO_FOLDER: Record<string, string> = {
  photo:    '01_店舗画像',
  logo:     '02_ロゴ・素材',
  document: '03_制作資料',
  access:   '03_制作資料',
  sns:      '03_制作資料',
  other:    '99_その他',
};

/**
 * ルーティング境界:
 *   ≤ BUFFER_THRESHOLD  → /upload  (formData + バッファ、高速)
 *   > BUFFER_THRESHOLD  → /drive/stream (req.body を直接 Drive へパイプ、大容量対応)
 *
 * Next.js のデフォルト body サイズ上限は 4MB のため、
 * 4MB 未満のみ formData ルートを使う。それ以外はストリーミング。
 */
const BUFFER_THRESHOLD  = 4   * 1024 * 1024;  // 4MB: formData / ストリーミング 切替閾値
const UPLOAD_MAX_BYTES  = 100 * 1024 * 1024;  // 100MB: アプリ経由アップロード上限
// 100MB 超 → Drive への直接アップロードを案内する（フォルダ URL が未取得の場合は親フォルダ）
const DRIVE_PARENT_FOLDER_URL = 'https://drive.google.com/drive/folders/1ugm5wM_ShOQAN3YJrVsAP7a2LrfhtfHQ';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ─── Google Drive 保存先バナー ──────────────────────────────────────────────

function DriveSaveBanner({ folderName }: { folderName: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 7,
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      marginBottom: 8,
    }}>
      {/* Google Driveアイコン（SVG） */}
      <svg width="14" height="14" viewBox="0 0 87.3 78" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5l5.4 11.35z" fill="#0066DA"/>
        <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5l16.15-26z" fill="#00AC47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#EA4335"/>
        <path d="M43.65 25L57.4 0H13.9c-1.35.8-2.5 1.9-3.3 3.3L1.2 17.3 43.65 25z" fill="#00832D"/>
        <path d="M59.8 51H27.5L13.75 76.8h.1c1.35.8 2.9 1.2 4.45 1.2h50.7c1.55 0 3.1-.4 4.45-1.2L59.8 51z" fill="#2684FC"/>
        <path d="M73.4 26.45l-13.5-23.15c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 51h27.45c0-1.55-.4-3.1-1.2-4.5l-12.65-20.05z" fill="#FFBA00"/>
      </svg>
      <span style={{ fontSize: 11, color: '#047857', fontWeight: 600 }}>
        Google Drive の「<strong>{folderName}</strong>」に自動保存されます
      </span>
    </div>
  );
}

// ─── アップロード済み結果表示 ───────────────────────────────────────────────

// ─── アップロード完了結果（「入稿データはこちら」1本リンクのみ表示）──────────
function DriveUploadResult({
  submitFolderUrl,
  onReUpload,
}: {
  submission: LatestSubmission; // 後方互換のため残す（未使用）
  submitFolderUrl: string;
  onReUpload: () => void;
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: '#f0fdf4', border: '1px solid #86efac',
      marginTop: 6,
    }}>
      {/* 完了メッセージ */}
      <p style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
        ✅ アップロードが完了しました
      </p>

      {/* 入稿データフォルダへのリンク（1本のみ）*/}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        {submitFolderUrl ? (
          <a
            href={submitFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 7,
              background: '#1967D2', color: 'white',
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <svg width="11" height="10" viewBox="0 0 87.3 78" fill="none">
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="rgba(255,255,255,0.8)"/>
              <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5z" fill="white"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8z" fill="rgba(255,255,255,0.7)"/>
            </svg>
            📁 入稿データはこちら
          </a>
        ) : (
          <span style={{ fontSize: 11, color: '#047857' }}>
            Google Drive に保存されました
          </span>
        )}

        {/* 再アップロードボタン（サブ） */}
        <button
          onClick={onReUpload}
          style={{
            fontSize: 10, padding: '4px 10px', borderRadius: 5, flexShrink: 0,
            background: 'white', border: '1px solid #a7f3d0',
            color: '#065f46', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          再アップロード
        </button>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────

/** @deprecated 後方互換のためエクスポートを維持（内部では使用しない） */
export type DriveFolderUrls = Record<string, string | undefined>;

export default function ChecklistPanel({
  storeId,
  currentPhase,
}: {
  storeId: string;
  currentPhase: string;
  /** @deprecated 無視される。コンポーネントが /drive/info から取得する */
  driveFolderUrls?: DriveFolderUrls;
}) {
  const [items, setItems] = useState<RequiredItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState<string>(currentPhase);
  const [guideModal, setGuideModal] = useState<RequiredItemRow | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  // 100MB 超ファイルの情報: itemId → { fileSizeMB, driveUrl }
  const [overSizeErrors, setOverSizeErrors] = useState<Record<string, { fileSizeMB: number; driveUrl: string }>>({});
  // 提出完了アニメーション: itemId → true（1500ms 後に解除）
  const [justSubmitted, setJustSubmitted] = useState<Record<string, boolean>>({});
  // カテゴリ別フォルダ URL（/drive/info から取得）
  const [driveFolderUrls, setDriveFolderUrls] = useState<{
    photo: string; asset: string; document: string; submit: string; root: string;
  }>({ photo: '', asset: '', document: '', submit: '', root: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // カテゴリ別フォルダ URL を取得
  useEffect(() => {
    fetch(`/api/stores/${storeId}/drive/info`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: {
        driveUploadUrl?: string;
        photoFolderUrl?: string;
        assetFolderUrl?: string;
        documentFolderUrl?: string;
        rootFolderUrl?: string;
      } | null) => {
        if (!d) return;
        setDriveFolderUrls({
          photo:    d.photoFolderUrl    ?? '',
          asset:    d.assetFolderUrl    ?? '',
          document: d.documentFolderUrl ?? '',
          submit:   d.driveUploadUrl    ?? '',
          root:     d.rootFolderUrl     ?? '',
        });
      })
      .catch(() => {/* fallback to DRIVE_PARENT_FOLDER_URL */});
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stores/${storeId}/required-items`)
      .then((r) => {
        if (!r.ok) return Promise.reject();
        return r.json();
      })
      .then((data) => {
        const normalized = (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => {
          const sub = item.latestSubmission as Record<string, unknown> | null | undefined;
          return {
            id:                   String(item.id ?? ''),
            category:             String(item.category ?? ''),
            label:                String(item.label ?? ''),
            description:          String(item.description ?? ''),
            requiredPhase:        String(item.requiredPhase ?? ''),
            assigneeType:         String(item.assigneeType ?? 'owner'),
            ownerResponsibleName: String(item.ownerResponsibleName ?? ''),
            adminResponsibleName: String(item.adminResponsibleName ?? ''),
            whoWaiting:           String(item.whoWaiting ?? 'none'),
            dueLabel:             String(item.dueLabel ?? ''),
            reason:               String(item.reason ?? ''),
            status:               String(item.status ?? 'pending'),
            isPhotoRequired:      Boolean(item.isPhotoRequired),
            guideTitle:           item.guide && typeof item.guide === 'object' ? String((item.guide as Record<string, unknown>).title ?? '') : '',
            guideDescription:     item.guide && typeof item.guide === 'object' ? String((item.guide as Record<string, unknown>).description ?? '') : '',
            guideChecklistJson:   item.guide && typeof item.guide === 'object'
              ? JSON.stringify((item.guide as Record<string, unknown>).checklist ?? [])
              : '[]',
            latestSubmission: sub
              ? {
                  id:              String(sub.id ?? ''),
                  fileUrl:         String(sub.fileUrl ?? ''),
                  fileName:        String(sub.fileName ?? ''),
                  driveFileId:     String(sub.driveFileId ?? ''),
                  driveFolderName: String(sub.driveFolderName ?? ''),
                  status:          String(sub.status ?? 'pending'),
                }
              : null,
          };
        });
        setItems(normalized);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  // ─── テキスト提出 ─────────────────────────────────────────────────────────
  const handleSubmit = async (itemId: string) => {
    if (submitting) return;
    setSubmitting(itemId);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'submitted' } : i))
    );
    try {
      const res = await fetch(`/api/stores/${storeId}/required-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      });
      if (!res.ok) throw new Error();
      // 完了アニメーション
      setJustSubmitted((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => setJustSubmitted((prev) => { const next = { ...prev }; delete next[itemId]; return next; }), 1800);
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'pending' } : i))
      );
    } finally {
      setSubmitting(null);
    }
  };

  // カテゴリ → 対応フォルダ URL（未取得の場合は親フォルダにフォールバック）
  const getCategoryFolderUrl = (category: string): string => {
    switch (category) {
      case 'photo':    return driveFolderUrls.photo    || driveFolderUrls.root || DRIVE_PARENT_FOLDER_URL;
      case 'logo':     return driveFolderUrls.asset    || driveFolderUrls.root || DRIVE_PARENT_FOLDER_URL;
      case 'document':
      case 'access':
      case 'sns':      return driveFolderUrls.document || driveFolderUrls.root || DRIVE_PARENT_FOLDER_URL;
      default:         return driveFolderUrls.root     || DRIVE_PARENT_FOLDER_URL;
    }
  };

  // ─── ファイルアップロード ─────────────────────────────────────────────────
  const triggerUpload = (itemId: string) => {
    setUploadTargetId(itemId);
    setUploadErrors((prev)    => { const next = { ...prev }; delete next[itemId]; return next; });
    setOverSizeErrors((prev)  => { const next = { ...prev }; delete next[itemId]; return next; });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;

    const itemId = uploadTargetId;
    setUploadTargetId(null);
    setUploadingItemId(itemId);

    const targetItem = items.find((i) => i.id === itemId);
    const category   = targetItem?.category ?? 'photo';
    const folderName = CATEGORY_TO_FOLDER[category] ?? '01_店舗画像';

    // ─── 100MB 上限チェック → Drive 直接アップロード案内 ──────────────────
    if (file.size > UPLOAD_MAX_BYTES) {
      setOverSizeErrors((prev) => ({
        ...prev,
        [itemId]: { fileSizeMB: Math.ceil(file.size / 1024 / 1024), driveUrl: getCategoryFolderUrl(category) },
      }));
      setUploadingItemId(null);
      return;
    }

    // 楽観的更新
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'submitted' } : i))
    );

    try {
      // ─── ルーティング ──────────────────────────────────────────────────
      // ≤ 4MB → formData (高速・シンプル)
      // > 4MB → raw body ストリーミング（.ai / .psd など大容量対応）
      const useStreaming = file.size > BUFFER_THRESHOLD;

      let res: Response;
      if (useStreaming) {
        // メタデータをクエリパラメータで渡し、body に生バイト列を乗せる
        const qs = new URLSearchParams({
          fileName:       file.name,
          mimeType:       file.type || 'application/octet-stream',
          category,
          requiredItemId: itemId,
        });
        res = await fetch(`/api/stores/${storeId}/drive/stream?${qs.toString()}`, {
          method:  'POST',
          body:    file,            // File を直接 body に渡すと生バイト列として送信される
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('requiredItemId', itemId);
        formData.append('category', category);
        res = await fetch(`/api/stores/${storeId}/upload`, {
          method: 'POST',
          body:   formData,
        });
      }

      if (!res.ok) {
        let msg = `アップロードに失敗しました（HTTP ${res.status}）。時間をおいて再度お試しください。`;
        try {
          const errData = (await res.json()) as { error?: string };
          if (errData.error) msg = errData.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        uploadSuccess: boolean;
        driveUploadUrl: string;
        submission?: { id: string };
      };

      // アップロード成功後に submit フォルダ URL を反映（oversize エラー案内を最新 URL に更新）
      if (data.driveUploadUrl) setDriveFolderUrls((prev) => ({ ...prev, submit: data.driveUploadUrl }));

      // 完了アニメーション
      setJustSubmitted((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => setJustSubmitted((prev) => { const next = { ...prev }; delete next[itemId]; return next; }), 1800);

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'submitted',
                latestSubmission: {
                  id:              data.submission?.id ?? '',
                  fileUrl:         data.driveUploadUrl,
                  fileName:        file.name,
                  driveFileId:     '',
                  driveFolderName: folderName,
                  submitFolderUrl: data.driveUploadUrl, // 「入稿データはこちら」リンク用
                  status:          'pending',
                },
              }
            : i
        )
      );
    } catch (err) {
      // ロールバック
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'pending' } : i))
      );

      let msg: string;
      // Failed to fetch = ネットワーク切断 or サーバー応答なし
      const isNetworkErr =
        err instanceof TypeError ||
        (err instanceof Error && err.message === 'Failed to fetch');

      if (isNetworkErr) {
        msg =
          `通信エラーが発生しました（${formatBytes(file.size)}）。` +
          `インターネット接続をご確認のうえ、再度お試しください。` +
          (file.size > BUFFER_THRESHOLD
            ? `\nファイルが大きい場合、転送に時間がかかることがあります（${formatBytes(file.size)}）。`
            : '');
      } else {
        msg = err instanceof Error ? err.message : 'アップロードに失敗しました。再度お試しください。';
      }
      setUploadErrors((prev) => ({ ...prev, [itemId]: msg }));
    } finally {
      setUploadingItemId(null);
    }
  };

  const filteredItems = items.filter((i) => i.requiredPhase === phaseFilter);
  const pendingCount = filteredItems.filter((i) => i.status === 'pending' && i.assigneeType === 'owner').length;

  // ─── ローディング ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '18px 20px',
        marginBottom: 16, boxShadow: 'var(--shadow)',
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: 14 }}>
          📎 必要情報チェックリスト
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              height: 70, borderRadius: 8,
              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            }} />
          ))}
        </div>
      </section>
    );
  }

  // ─── レンダリング ─────────────────────────────────────────────────────────
  return (
    <section style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, padding: '18px 20px',
      marginBottom: 16, boxShadow: 'var(--shadow)',
    }}>

      {/* 非表示ファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ─── ヘッダー ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', letterSpacing: 0.5 }}>
          📎 必要情報チェックリスト
        </p>
        {pendingCount > 0 ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
          }}>
            {pendingCount}件 対応待ち
          </span>
        ) : filteredItems.length > 0 ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
            background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0',
          }}>
            ✓ すべて提出済み
          </span>
        ) : null}
      </div>

      {/* ─── フェーズフィルタ ─── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' as const }}>
        {PHASES.map((phase) => {
          const isActive = phaseFilter === phase;
          const isCurrent = phase === currentPhase;
          return (
            <button
              key={phase}
              onClick={() => setPhaseFilter(phase)}
              style={{
                padding: '3px 12px', borderRadius: 99,
                border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--color-text-sub)',
                fontSize: 12, fontWeight: isActive ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {phase}{isCurrent && ' 📍'}
            </button>
          );
        })}
      </div>

      {/* ─── 項目一覧 ─── */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {filteredItems.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-sub)', textAlign: 'center' as const, padding: '12px 0' }}>
            このフェーズの必要情報はありません
          </p>
        )}

        {filteredItems.map((item) => {
          const statusMeta = STATUS_META[item.status] ?? STATUS_META['pending'];
          const isPhotoCategory = item.category === 'photo' || item.isPhotoRequired;
          const isUploading  = uploadingItemId === item.id;
          const uploadError  = uploadErrors[item.id];
          const overSizeErr  = overSizeErrors[item.id];
          const folderName   = CATEGORY_TO_FOLDER[item.category] ?? '01_店舗画像';

          const isJustSubmitted = justSubmitted[item.id] ?? false;

          return (
            <div
              key={item.id}
              style={{
                border: `1px solid ${item.status === 'pending' && item.assigneeType === 'owner' ? '#fecaca' : 'var(--color-border)'}`,
                borderRadius: 10,
                background: item.status === 'approved' ? '#fafafa' : 'white',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* 完了アニメーションオーバーレイ */}
              {isJustSubmitted && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: '#ecfdf5',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8,
                  animation: 'fadeInOut 1.8s ease forwards',
                  pointerEvents: 'none',
                }}>
                  <style>{`
                    @keyframes fadeInOut {
                      0%   { opacity: 0; transform: scale(0.95); }
                      15%  { opacity: 1; transform: scale(1.02); }
                      70%  { opacity: 1; transform: scale(1); }
                      100% { opacity: 0; transform: scale(1); }
                    }
                  `}</style>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#065f46' }}>提出しました！</span>
                </div>
              )}
              <div style={{ padding: '12px 14px' }}>
                {/* 上段: ステータスバッジ + 撮影ガイドボタン */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    display: 'inline-block', flexShrink: 0,
                    padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: statusMeta.bg, color: statusMeta.text,
                    border: `1px solid ${statusMeta.border}`,
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {statusMeta.label}
                  </span>
                  {item.isPhotoRequired && item.status === 'pending' && (
                    <button
                      onClick={() => setGuideModal(item)}
                      style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        border: '1px solid #bae6fd', background: '#f0f9ff',
                        color: '#0369a1', cursor: 'pointer', whiteSpace: 'nowrap' as const,
                        flexShrink: 0,
                      }}
                    >
                      📸 撮影ガイド
                    </button>
                  )}
                </div>

                {/* タイトル + 期限ラベル（全幅） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: item.status === 'approved' ? '#9ca3af' : 'var(--color-text)',
                  }}>
                    {item.label}
                  </span>
                  {item.dueLabel && item.status === 'pending' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                      background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {item.dueLabel}
                    </span>
                  )}
                </div>

                {/* 理由 */}
                {item.reason && item.status !== 'approved' && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-sub)', lineHeight: 1.6, marginBottom: 5 }}>
                    {item.reason}
                  </p>
                )}

                {/* アップロード済みの場合: 入稿データフォルダへの1本リンクのみ表示 */}
                {item.latestSubmission ? (
                  <DriveUploadResult
                    submission={item.latestSubmission}
                    submitFolderUrl={item.latestSubmission.submitFolderUrl || getCategoryFolderUrl(item.category)}
                    onReUpload={() => triggerUpload(item.id)}
                  />
                ) : null}

                {/* 担当 */}
                <div style={{ marginTop: item.latestSubmission ? 6 : 2 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    担当：{item.assigneeType === 'owner' ? 'オーナー' : '管理側'}
                  </span>
                </div>
              </div>

              {/* ─── アクションバー（オーナー・未提出のみ）─── */}
              {item.assigneeType === 'owner' && item.status === 'pending' && (
                <div style={{
                  borderTop: '1px solid #f3f4f6',
                  padding: '10px 14px',
                  background: '#fafafa',
                }}>
                  {/* Drive保存先案内（写真カテゴリのみ） */}
                  {isPhotoCategory && (
                    <DriveSaveBanner folderName={folderName} />
                  )}

                  {/* 100MB 超: Drive 直接アップロード案内 */}
                  {overSizeErr && (
                    <div style={{
                      padding: '12px 14px', borderRadius: 8, marginBottom: 10,
                      background: '#fffbeb', border: '2px solid #fde68a',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
                        ⚠️ ファイルが大きすぎます（{overSizeErr.fileSizeMB}MB / 上限 100MB）
                      </p>
                      <p style={{ fontSize: 11, color: '#78350f', lineHeight: 1.6, marginBottom: 10 }}>
                        .ai・.psd・.zip などの大きなファイルは Google Drive へ直接アップロードしてください。
                        アップロード後、下の「手動で提出済みにする」を押してください。
                      </p>
                      <a
                        href={overSizeErr.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 7,
                          background: '#1967D2', color: 'white',
                          fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        }}
                      >
                        <svg width="12" height="11" viewBox="0 0 87.3 78" fill="none">
                          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="rgba(255,255,255,0.8)"/>
                          <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5z" fill="white"/>
                          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8z" fill="rgba(255,255,255,0.7)"/>
                        </svg>
                        Google Drive フォルダを開く →
                      </a>
                    </div>
                  )}

                  {/* ─── フォルダ導線（通常: 小さく / エラー時: 強調）─── */}
                  {!overSizeErr && (
                    uploadError ? (
                      /* エラー時: 強調表示 + フォルダボタン */
                      <div style={{
                        padding: '12px 14px', borderRadius: 8, marginBottom: 10,
                        background: '#fef2f2', border: '2px solid #fca5a5',
                      }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', marginBottom: 3 }}>
                          ⚠️ アップロードできませんでした
                        </p>
                        <p style={{ fontSize: 11, color: '#991b1b', lineHeight: 1.6, marginBottom: 10 }}>
                          通信環境やファイルサイズの影響で失敗した可能性があります。<br />
                          下のボタンから対象フォルダを開き、直接ファイルを入れてください。
                        </p>
                        {/* 優先①: フォルダを開く */}
                        <a
                          href={getCategoryFolderUrl(item.category)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 14px', borderRadius: 7, marginBottom: 8,
                            background: '#1967D2', color: 'white',
                            fontSize: 13, fontWeight: 700, textDecoration: 'none',
                          }}
                        >
                          <svg width="12" height="11" viewBox="0 0 87.3 78" fill="none">
                            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="rgba(255,255,255,0.8)"/>
                            <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5z" fill="white"/>
                            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8z" fill="rgba(255,255,255,0.7)"/>
                          </svg>
                          📁 {CATEGORY_TO_FOLDER[item.category] ?? '対象フォルダ'}を開く
                        </a>
                        {/* 優先②: もう一度試す */}
                        <button
                          onClick={() => {
                            setUploadErrors((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
                            triggerUpload(item.id);
                          }}
                          style={{
                            width: '100%', padding: '8px', borderRadius: 7,
                            border: '1px solid #fecaca', background: 'transparent',
                            color: '#b91c1c', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          もう一度試す
                        </button>
                      </div>
                    ) : (
                      /* 通常時: 小さくフォルダリンクを表示（⑦） */
                      <div style={{ textAlign: 'right' as const, marginBottom: 6 }}>
                        <a
                          href={getCategoryFolderUrl(item.category)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 10, color: '#9ca3af',
                            textDecoration: 'underline', fontWeight: 500,
                          }}
                        >
                          📁 直接フォルダを開く
                        </a>
                      </div>
                    )
                  )}

                  {/* ボタン行 */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                    {isPhotoCategory && (
                      <button
                        onClick={() => triggerUpload(item.id)}
                        disabled={isUploading}
                        style={{
                          flex: 1,
                          fontSize: 12, fontWeight: 700, padding: '9px 12px', borderRadius: 7,
                          border: 'none',
                          background: isUploading ? '#93c5fd' : '#2563eb',
                          color: 'white',
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          minWidth: 0,
                        }}
                      >
                        {isUploading ? (
                          <>⏳ Drive に保存中...</>
                        ) : (
                          <>
                            {/* Drive mini icon */}
                            <svg width="12" height="11" viewBox="0 0 87.3 78" fill="none">
                              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="rgba(255,255,255,0.8)"/>
                              <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5z" fill="white"/>
                              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8z" fill="rgba(255,255,255,0.7)"/>
                            </svg>
                            📤 写真をアップロード
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleSubmit(item.id)}
                      disabled={submitting === item.id}
                      style={{
                        fontSize: 12, fontWeight: 700,
                        padding: isPhotoCategory ? '9px 10px' : '9px 14px',
                        borderRadius: 7,
                        border: '1px solid #a7f3d0',
                        background: '#ecfdf5',
                        color: '#065f46',
                        cursor: submitting === item.id ? 'not-allowed' : 'pointer',
                        opacity: submitting === item.id ? 0.6 : 1,
                        whiteSpace: 'nowrap' as const,
                        flexShrink: 0,
                      }}
                    >
                      {submitting === item.id ? '送信中...' : (isPhotoCategory ? '手動で提出済みにする' : '✓ 提出済みにする')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── 撮影ガイドモーダル ─── */}
      {guideModal && (
        <div onClick={() => setGuideModal(null)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 50,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '20px 20px 0 0',
            padding: '24px 24px 36px',
            width: '100%', maxWidth: 500,
            maxHeight: '88vh', overflowY: 'auto',
          }}>
            {/* ドラッグハンドル */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>📸 {guideModal.guideTitle}</h2>
              <button
                onClick={() => setGuideModal(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {guideModal.guideDescription && (
              <p style={{ fontSize: 13, color: 'var(--color-text-sub)', lineHeight: 1.7, marginBottom: 16 }}>
                {guideModal.guideDescription}
              </p>
            )}

            {/* 撮影チェックリスト */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 20 }}>
              {(JSON.parse(guideModal.guideChecklistJson || '[]') as GuideChecklistItem[]).map((g, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '10px 12px',
                  background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#2563eb',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{g.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-sub)', lineHeight: 1.6 }}>{g.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Drive保存先案内 */}
            {guideModal.assigneeType === 'owner' && guideModal.status === 'pending' && (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8,
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  marginBottom: 12,
                }}>
                  <svg width="15" height="14" viewBox="0 0 87.3 78" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
                    <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5l16.15-26z" fill="#00AC47"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#EA4335"/>
                    <path d="M43.65 25L57.4 0H13.9c-1.35.8-2.5 1.9-3.3 3.3L1.2 17.3 43.65 25z" fill="#00832D"/>
                    <path d="M59.8 51H27.5L13.75 76.8h.1c1.35.8 2.9 1.2 4.45 1.2h50.7c1.55 0 3.1-.4 4.45-1.2L59.8 51z" fill="#2684FC"/>
                    <path d="M73.4 26.45l-13.5-23.15c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 51h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>
                      アップロード後、Google Drive に自動保存されます
                    </p>
                    <p style={{ fontSize: 11, color: '#065f46', marginTop: 1 }}>
                      保存先：店舗フォルダ → 「{CATEGORY_TO_FOLDER[guideModal.category] ?? '01_店舗画像'}」
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setGuideModal(null); triggerUpload(guideModal.id); }}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: 12, border: 'none',
                    background: '#2563eb', color: 'white',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <svg width="14" height="13" viewBox="0 0 87.3 78" fill="none">
                    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="rgba(255,255,255,0.8)"/>
                    <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5A9.06 9.06 0 000 51h27.5z" fill="white"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8z" fill="rgba(255,255,255,0.7)"/>
                  </svg>
                  📤 写真をアップロードして Drive に保存する
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
