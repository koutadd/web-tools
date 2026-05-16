#!/usr/bin/env node
const http  = require('http')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const { spawn } = require('child_process')
const { URL }   = require('url')

const PORT = 4999
const CONTENT_FILE = path.join(__dirname, 'content.json')

const DEFAULT_CONTENT = {
  projectPath: '/Users/koutayamakawa/clones/resilire-careers',
  previewUrl:  'https://resilire-careers.vercel.app',
  deployCmd:   'vercel --prod --yes',
  openaiKey:   '',
  photos: [
    { filename: 'hero-1.png', x: 50, y: 25, scale: 1.00, bg: 'transparent' },
    { filename: 'hero-2.png', x: 15, y: 20, scale: 0.78, bg: '#1b2a3c' },
    { filename: 'hero-3.png', x: 55, y: 15, scale: 1.00, bg: 'transparent' },
    { filename: 'hero-4.png', x: 45, y: 20, scale: 1.00, bg: 'transparent' },
  ],
  headline:    ['採用で、', '未来を', '取りにいく。'],
  description: '人で、会社は変わる。TORINAは採用を「待ち」から「戦略」へ変える、採用戦略パートナーです。',
  services: [
    { category: 'AGENT',      title: '人材紹介',              description: '事業スピードに合わせた人材紹介。カルチャーフィットと候補者の成功を重視し、採用の質を最大化します。' },
    { category: 'CONSULTING', title: '採用戦略コンサルティング', description: '感覚に頼らない採用を設計。必要な人材像と自社の勝ち筋を定義し、採用基準を構築します。' },
    { category: 'RPO',        title: '採用業務代行',           description: 'ソーシング・候補者対応・プロセス管理まで採用業務を一括代行。採用チームのリソースを解放します。' },
    { category: 'GROWTH',     title: '定着・オンボーディング',  description: '採用した人材が活躍できるオンボーディング・定着支援。採用後の成功確率を高めます。' },
  ],
  hiring: {
    recruitSubtitle: '採用で、未来を取りにいく',
    recruitBody:     '私たちと一緒に、すべての企業の採用を変えるメンバーを募集しています。採用の専門家として、企業の未来をつくるチームに加わりませんか。',
    recruitCta:      '採用情報を見る',
    contactDesc:     '採用に関するご相談・ご依頼など、こちらからお気軽にご連絡ください。',
    contactCta:      'フォームでのお問い合わせ',
  },
  slideshow: {
    headline:    ['採用で、', '未来を', '取りにいく。'],
    tagline:     '採用を「待ち」から「戦略」へ変える',
    subheadline: '人で、会社は変わる。',
    body:        '変わり続ける採用市場の中で、立ち止まらずに進み続ける。\n私たちは、採用で勝ち続ける意志を持つすべての企業とともに、\n未来をつくります。',
    ctaText:             '会社情報を見る',
    ctaUrl:              '/about',
    headlineSize:        108,
    taglineSize:         13,
    subheadlineSize:     28,
    bodySize:            15,
    headlineLeading:     1.05,
    subheadlineLeading:  1.4,
    bodyLeading:         1.85,
    paddingTop:          120,
    paddingBottom:       120,
    paddingLeft:         40,
    paddingRight:        40,
  },
}

let content = { ...DEFAULT_CONTENT }
if (fs.existsSync(CONTENT_FILE)) {
  try { content = { ...DEFAULT_CONTENT, ...JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')) } } catch (_) {}
}
function saveContent() { fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2)) }

function readBody(req) {
  return new Promise(resolve => {
    let b = ''
    req.on('data', d => b += d)
    req.on('end', () => { try { resolve(JSON.parse(b)) } catch (_) { resolve({}) } })
  })
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
function json(res, data, status = 200) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ─── Write HeroSection.tsx ───────────────────────────────────────────────────
function writeHeroSection() {
  const fp = path.join(content.projectPath, 'src/components/home/HeroSection.tsx')
  let src = fs.readFileSync(fp, 'utf8')

  // HERO_PHOTOS array
  const rows = content.photos.map(p =>
    `  { src: '/images/${p.filename}', alt: 'TORINAメンバー', facePos: '${p.x}% ${p.y}%', scale: ${Math.max(+p.scale, 1).toFixed(2)}, bg: '${p.bg}' },`
  ).join('\n')
  src = src.replace(/const HERO_PHOTOS = \[[\s\S]*?\n\]/, `const HERO_PHOTOS = [\n${rows}\n]`)

  // headline lines
  const hl = content.headline.map(l => `'${l}'`).join(', ')
  src = src.replace(/\(\[(?:'[^']*'(?:,\s*)?)+\] as const\)/, `([${hl}] as const)`)

  // description
  src = src.replace(/(>)[^<]+(<\/p>)/, `$1${content.description}$2`)

  fs.writeFileSync(fp, src, 'utf8')
}

// ─── Write MissionSection.tsx (services) ────────────────────────────────────
function writeMissionSection() {
  const fp = path.join(content.projectPath, 'src/components/home/MissionSection.tsx')
  let src = fs.readFileSync(fp, 'utf8')
  const rows = content.services.map(s =>
    `  {\n    category: '${s.category}',\n    title: '${s.title}',\n    description: '${s.description}',\n    image: '/images/slide-${content.services.indexOf(s) === 0 ? 1 : content.services.indexOf(s) === 1 ? 7 : content.services.indexOf(s) === 2 ? 5 : 8}.jpg',\n  },`
  ).join('\n')
  src = src.replace(/const services = \[[\s\S]*?\n\]/, `const services = [\n${rows}\n]`)
  fs.writeFileSync(fp, src, 'utf8')
}

// ─── Write SlideshowSection.tsx ──────────────────────────────────────────────
function writeSlideshowSection() {
  const fp = path.join(content.projectPath, 'src/components/home/SlideshowSection.tsx')
  let src = fs.readFileSync(fp, 'utf8')
  const s = content.slideshow
  const hl = s.headline.map(l => `'${l}'`).join(', ')
  const escapedBody = s.body.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
  const newConst = `const slideshowData = {\n  headline: [${hl}],\n  tagline: '${s.tagline}',\n  subheadline: '${s.subheadline}',\n  body: '${escapedBody}',\n  ctaText: '${s.ctaText}',\n  ctaUrl: '${s.ctaUrl}',\n  headlineSize: ${+s.headlineSize || 108},\n  taglineSize: ${+s.taglineSize || 13},\n  subheadlineSize: ${+s.subheadlineSize || 28},\n  bodySize: ${+s.bodySize || 15},\n  headlineLeading: ${+s.headlineLeading || 1.05},\n  subheadlineLeading: ${+s.subheadlineLeading || 1.4},\n  bodyLeading: ${+s.bodyLeading || 1.85},\n  paddingTop: ${+s.paddingTop ?? 120},\n  paddingBottom: ${+s.paddingBottom ?? 120},\n  paddingLeft: ${+s.paddingLeft ?? 40},\n  paddingRight: ${+s.paddingRight ?? 40},\n}`
  src = src.replace(/const slideshowData = \{[\s\S]*?\n\}/, newConst)
  fs.writeFileSync(fp, src, 'utf8')
}

// ─── Write HiringSection.tsx ─────────────────────────────────────────────────
function writeHiringSection() {
  const fp = path.join(content.projectPath, 'src/components/home/HiringSection.tsx')
  let src = fs.readFileSync(fp, 'utf8')
  const h = content.hiring
  src = src.replace(/採用で、未来を取りにいく/, h.recruitSubtitle)
  src = src.replace(/私たちと一緒に[^<]+採用の専門家として[^<]+加わりませんか。/, h.recruitBody)
  src = src.replace(/採用情報を見る/, h.recruitCta)
  src = src.replace(/採用に関するご相談[^<]+ご連絡ください。/, h.contactDesc)
  src = src.replace(/フォームでのお問い合わせ/, h.contactCta)
  fs.writeFileSync(fp, src, 'utf8')
}

// ─── Gemini image generation (uses GEMINI_API_KEY from env) ─────────────────
function callGeminiOutpaint(base64, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64 } },
          { text: 'This is a business portrait photo placed on a transparent/empty background. Fill all the empty/transparent areas with a natural continuation of the photo background. Match the lighting, color tone, and style of the visible background. Keep the person exactly as they appear. Return the complete image with all areas filled seamlessly.' }
        ]
      }],
      generationConfig: { responseModalities: ['IMAGE'] }
    })
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try {
          const j = JSON.parse(data)
          if (j.error) return reject(new Error(j.error.message))
          const imgPart = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
          if (!imgPart) return reject(new Error('Gemini returned no image: ' + JSON.stringify(j).slice(0, 200)))
          resolve(imgPart.inlineData.data)
        } catch(e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── OpenAI DALL-E 2 outpaint ────────────────────────────────────────────────
function callOpenAIEdit(imageBuffer, prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const boundary = '----Boundary' + Date.now().toString(36)
    const part = (name, value) =>
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`)
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n`),
      imageBuffer,
      Buffer.from('\r\n'),
      part('prompt', prompt),
      part('n', '1'),
      part('size', '1024x1024'),
      part('response_format', 'b64_json'),
      Buffer.from(`--${boundary}--\r\n`),
    ])
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/edits',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      }
    }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try {
          const j = JSON.parse(data)
          if (j.error) return reject(new Error(j.error.message))
          resolve(j.data[0].b64_json)
        } catch(e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Deploy SSE ──────────────────────────────────────────────────────────────
let deployProc = null
function handleDeploy(req, res) {
  cors(res)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':   'keep-alive',
  })
  if (deployProc) { res.write('data: [ALREADY_RUNNING]\n\n'); return }

  const [cmd, ...args] = content.deployCmd.split(' ')
  deployProc = spawn(cmd, args, { cwd: content.projectPath, env: { ...process.env } })

  const emit = txt => txt.split('\n').forEach(l => { if (l) res.write(`data: ${l}\n\n`) })
  deployProc.stdout.on('data', d => emit(d.toString()))
  deployProc.stderr.on('data', d => emit(d.toString()))
  deployProc.on('close', code => {
    res.write(`data: [DONE:${code}]\n\n`)
    deployProc = null
    res.end()
  })
  req.on('close', () => { if (deployProc) { deployProc.kill(); deployProc = null } })
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`)
  const p = u.pathname

  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return }

  // ── GET /api/status
  if (p === '/api/status') return json(res, { ok: true, projectPath: content.projectPath, previewUrl: content.previewUrl })

  // ── GET /api/content
  if (p === '/api/content' && req.method === 'GET') return json(res, content)

  // ── POST /api/save
  if (p === '/api/save' && req.method === 'POST') {
    const body = await readBody(req)
    if (body.photos)      content.photos      = body.photos
    if (body.headline)    content.headline    = body.headline
    if (body.description) content.description = body.description
    if (body.services)    content.services    = body.services
    if (body.hiring)      content.hiring      = body.hiring
    if (body.slideshow)   content.slideshow   = body.slideshow
    saveContent()
    const errors = []
    try { writeHeroSection() } catch(e) { errors.push('Hero: ' + e.message) }
    if (body.services)  { try { writeMissionSection()  } catch(e) { errors.push('Mission: '  + e.message) } }
    if (body.hiring)    { try { writeHiringSection()   } catch(e) { errors.push('Hiring: '   + e.message) } }
    if (body.slideshow) { try { writeSlideshowSection() } catch(e) { errors.push('Slideshow: ' + e.message) } }
    if (errors.length) json(res, { ok: false, error: errors.join(' / ') }, 500)
    else               json(res, { ok: true })
    return
  }

  // ── POST /api/settings
  if (p === '/api/settings' && req.method === 'POST') {
    const body = await readBody(req)
    if (body.projectPath !== undefined) content.projectPath = body.projectPath
    if (body.previewUrl  !== undefined) content.previewUrl  = body.previewUrl
    if (body.deployCmd   !== undefined) content.deployCmd   = body.deployCmd
    if (body.openaiKey   !== undefined) content.openaiKey   = body.openaiKey
    saveContent()
    return json(res, { ok: true })
  }

  // ── POST /api/outpaint/:slot  (AI background generation — Gemini env key or OpenAI user key)
  if (p.startsWith('/api/outpaint/') && req.method === 'POST') {
    const slot = parseInt(p.split('/')[3])
    const body = await readBody(req)
    const { dataUrl, prompt } = body
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const geminiKey = process.env.GEMINI_API_KEY
    const openaiKey = content.openaiKey
    if (!geminiKey && !openaiKey) return json(res, { ok: false, error: 'AIキー未設定' }, 400)
    try {
      const resultB64 = geminiKey
        ? await callGeminiOutpaint(base64, geminiKey)
        : await callOpenAIEdit(Buffer.from(base64, 'base64'), prompt || 'Professional business portrait, natural background extension, high quality', openaiKey)
      const newName = `hero-${slot + 1}.png`
      fs.writeFileSync(path.join(content.projectPath, 'public/images', newName), Buffer.from(resultB64, 'base64'))
      content.photos[slot].filename = newName
      saveContent()
      return json(res, { ok: true, filename: newName })
    } catch(e) { return json(res, { ok: false, error: e.message }, 500) }
  }

  // ── POST /api/upload/:slot  (base64 JSON)
  if (p.startsWith('/api/upload/') && req.method === 'POST') {
    const slot = parseInt(p.split('/')[3])
    const body = await readBody(req)
    const { dataUrl, ext } = body
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buf    = Buffer.from(base64, 'base64')

    // remove old file if ext changed
    const old = content.photos[slot].filename
    if (path.extname(old).slice(1) !== ext) {
      const op = path.join(content.projectPath, 'public/images', old)
      if (fs.existsSync(op)) fs.unlinkSync(op)
    }

    const newName = `hero-${slot + 1}.${ext}`
    fs.writeFileSync(path.join(content.projectPath, 'public/images', newName), buf)
    content.photos[slot].filename = newName
    saveContent()
    return json(res, { ok: true, filename: newName })
  }

  // ── GET /api/image/:slot  → serve local project image
  if (p.startsWith('/api/image/') && req.method === 'GET') {
    const slot = parseInt(p.split('/')[3])
    const fn   = content.photos[slot]?.filename
    if (!fn) { res.writeHead(404); res.end(); return }
    const fp = path.join(content.projectPath, 'public/images', fn)
    if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return }
    const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }
    cors(res)
    res.writeHead(200, { 'Content-Type': mime[path.extname(fn).slice(1)] || 'image/png' })
    fs.createReadStream(fp).pipe(res)
    return
  }

  // ── GET /api/deploy → SSE
  if (p === '/api/deploy') return handleDeploy(req, res)

  // ── GET /api/dev-status → check if Next.js dev server is running on port 3000
  if (p === '/api/dev-status') {
    const net = require('net')
    const sock = new net.Socket()
    let alive = false
    sock.setTimeout(600)
    sock.on('connect', () => { alive = true; sock.destroy() })
    sock.on('timeout', () => sock.destroy())
    sock.on('error', () => {})
    sock.on('close', () => json(res, { running: alive }))
    sock.connect(3000, '127.0.0.1')
    return
  }

  // ── POST /api/start-dev → launch next dev in background
  if (p === '/api/start-dev' && req.method === 'POST') {
    spawn('npm', ['run', 'dev'], { cwd: content.projectPath, detached: true, stdio: 'ignore' }).unref()
    return json(res, { ok: true })
  }

  // ── Serve site-editor.html at root
  if (p === '/' || p === '/index.html') {
    const htmlPath = path.join(__dirname, '..', 'site-editor.html')
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      fs.createReadStream(htmlPath).pipe(res)
    } else {
      res.writeHead(404); res.end('site-editor.html not found')
    }
    return
  }

  res.writeHead(404); res.end('Not found')

}).listen(PORT, () => {
  console.log(`\n  ✅ サイトエディター起動完了`)
  console.log(`  👉 http://localhost:${PORT} をブラウザで開いてください\n`)
  console.log(`  Project: ${content.projectPath}`)
  console.log(`  Preview: ${content.previewUrl}\n`)

  // macOSなら自動でブラウザを開く
  const { exec } = require('child_process')
  exec(`open http://localhost:${PORT}`)
})
