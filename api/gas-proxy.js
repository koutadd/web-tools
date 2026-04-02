// api/gas-proxy.js — GAS API proxy (CORS回避)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxUCriKCKqi1WWbzdWS4ZXpq5TWGQOLPGQ0oURFyjIg-DnHrSNylrOn6PE3Aq92jbPBrA/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const qs = new URLSearchParams(req.query).toString();
    const url = qs ? `${GAS_URL}?${qs}` : GAS_URL;

    if (req.method === 'GET') {
      const r = await fetch(url, { redirect: 'follow' });
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(r.status).send(text);
    }

    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString('utf-8');

      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        redirect: 'follow',
      });
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(r.status).send(text);
    }

    return res.status(405).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
