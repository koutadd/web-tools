// api/streetview.js — Vercel serverless function
// Proxies Google Street View Static API to keep the API key server-side.
//
// Required env var: GOOGLE_MAPS_API_KEY
// Query params: lat, lng, heading, pitch, fov, size, source

export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not set' });
    return;
  }

  const { lat, lng, heading = '0', pitch = '10', fov = '90', size = '600x400', source = 'outdoor' } = req.query;
  if (!lat || !lng) {
    res.status(400).send('lat and lng are required');
    return;
  }

  const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&source=${source}&key=${apiKey}`;

  try {
    const imgRes = await fetch(svUrl);
    const buf = await imgRes.arrayBuffer();
    res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(imgRes.status).send(Buffer.from(buf));
  } catch (e) {
    res.status(502).send('Failed to fetch Street View');
  }
}
