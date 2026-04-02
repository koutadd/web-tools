// api/data.js — project data persistence via GitHub repo file
const OWNER = 'koutadd';
const REPO  = 'web-tools';
const FILE  = '_data/projects.json';
const BRANCH = 'main';

function token() { return process.env.GITHUB_PAT; }

async function ghGet() {
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${BRANCH}`,
    { headers: { Authorization: `token ${token()}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (r.status === 404) return { content: null, sha: null };
  if (!r.ok) throw new Error('GH read failed: ' + r.status);
  const d = await r.json();
  const raw = Buffer.from(d.content, 'base64').toString('utf-8').trim();
  return { content: raw === 'null' ? null : JSON.parse(raw), sha: d.sha };
}

async function ghPut(body, sha) {
  const payload = { message: 'update project data', content: Buffer.from(body).toString('base64'), branch: BRANCH };
  if (sha) payload.sha = sha;
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
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

  try {
    if (req.method === 'GET') {
      const { content } = await ghGet();
      return res.json(content);
    }

    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString('utf-8');

      // Get current SHA for update
      const { sha } = await ghGet();
      await ghPut(body, sha);
      return res.json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
