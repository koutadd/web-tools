export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { contents, system_instruction, apiKey: userKey } = req.body || {};
  if (!contents) return res.status(400).json({ error: 'contents required' });

  const apiKey = userKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction, contents, generationConfig: { maxOutputTokens: 1500 } })
      }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
