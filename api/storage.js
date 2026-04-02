// api/storage.js — generic key-value cloud storage via GitHub repo
const OWNER  = 'koutadd';
const REPO   = 'web-tools';
const BRANCH = 'main';

// Allowed keys to prevent path traversal
const ALLOWED_KEYS = ['sitemap', 'projects', 'schedule', 'dashboard', 'portfolio', 'lab365', 'stores'];

function token() { return process.env.GITHUB_PAT; }

function filePath(key) { return `_data/${key}.json`; }

async function ghGet(key) {
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath(key)}?ref=${BRANCH}`,
    { headers: { Authorization: `token ${token()}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (r.status === 404) return { content: null, sha: null };
  if (!r.ok) throw new Error('GH read failed: ' + r.status);
  const d = await r.json();
  const raw = Buffer.from(d.content, 'base64').toString('utf-8').trim();
  return { content: raw === 'null' ? null : JSON.parse(raw), sha: d.sha };
}

async function ghPut(key, body, sha) {
  const payload = {
    message: `update ${key} data`,
    content: Buffer.from(body).toString('base64'),
    branch: BRANCH
  };
  if (sha) payload.sha = sha;
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath(key)}`,
    {
      method: 'PUT',
      headers: { Authorization: `token ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );
  if (!r.ok) {
    const err = await r.text();
    throw new Error('GH write failed: ' + r.status + ' ' + err);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = (req.query.key || '').replace(/[^a-z0-9_-]/g, '');
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return res.status(400).json({ error: 'invalid key' });
  }

  try {
    if (req.method === 'GET') {
      const { content } = await ghGet(key);
      return res.json(content);
    }

    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString('utf-8');
      const { sha } = await ghGet(key);
      await ghPut(key, body, sha);
      return res.json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
