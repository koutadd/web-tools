// 一時的な診断エンドポイント（デプロイ確認後に削除）
import { getDriveClient } from '@/lib/drive';

const PARENT = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ?? '';

export async function GET() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '';

  const info: Record<string, unknown> = {
    jsonLength: json.length,
    jsonFirst50: json.slice(0, 50),
    parentFolderId: PARENT,
  };

  if (!json) return Response.json({ error: 'SA JSON missing', info });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json);
    info.type          = parsed.type;
    info.client_email  = parsed.client_email;
    info.hasPrivateKey = typeof parsed.private_key === 'string' && (parsed.private_key as string).length > 100;
  } catch (e) {
    return Response.json({ error: 'JSON.parse failed: ' + String(e), info });
  }

  let drive;
  try {
    drive = getDriveClient();
  } catch (e) {
    return Response.json({ error: 'getDriveClient failed: ' + String(e), info });
  }

  try {
    const listRes = await drive.files.list({
      q: `'${PARENT}' in parents and trashed = false`,
      pageSize: 1,
      fields: 'files(id, name)',
    });
    info.listOk    = true;
    info.fileCount = listRes.data.files?.length ?? 0;
  } catch (e: unknown) {
    const err = e as { message?: string; response?: { status: number; data: unknown } };
    info.listError        = err.message;
    info.listErrorStatus  = err.response?.status;
    info.listErrorData    = err.response?.data;
  }

  return Response.json(info);
}
