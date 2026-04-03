const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOGO_DIR = path.join(process.cwd(), 'public', 'logos', 'companies');
[LOGS_DIR, LOGO_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const LOG_PATH = path.join(LOGS_DIR, 'logo-collection.log');
const COMPANIES_PATH = path.join(DATA_DIR, 'companies.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(msg);
}

async function fetchLogo(websiteUrl, slug) {
  // すでにあればスキップ
  for (const ext of ['.svg', '.png', '.webp', '.jpg']) {
    if (fs.existsSync(path.join(LOGO_DIR, `${slug}${ext}`))) {
      return `logos/companies/${slug}${ext}`;
    }
  }

  try {
    const res = await axios.get(websiteUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(res.data);
    const candidates = [];

    // OGP image
    const og = $('meta[property="og:image"]').attr('content');
    if (og) candidates.push(og);

    // Favicon SVG
    $('link[rel*="icon"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) candidates.push(href);
    });

    // Header/Logo img
    $('header img, .logo img, #logo img, [class*="logo"] img, [id*="logo"] img, .site-header img, .global-header img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) candidates.push(src);
    });

    const base = new URL(websiteUrl);

    for (const cand of candidates) {
      let imgUrl = cand;
      if (!imgUrl) continue;
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/')) imgUrl = base.origin + imgUrl;
      else if (!imgUrl.startsWith('http')) imgUrl = base.origin + '/' + imgUrl;

      // ロゴらしいURLのみ取得
      const lower = imgUrl.toLowerCase();
      const isLogo = lower.includes('logo') || lower.includes('brand') || lower.includes('corporate') || lower.endsWith('.svg') || lower.includes('/img/');
      const isOg = lower.includes('og') || lower.includes('ogp');
      if (!isLogo && !isOg) continue;

      try {
        const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const ct = imgRes.headers['content-type'] || '';
        let ext = '.png';
        if (ct.includes('svg') || imgUrl.endsWith('.svg')) ext = '.svg';
        else if (ct.includes('webp')) ext = '.webp';
        else if (ct.includes('jpeg') || ct.includes('jpg')) ext = '.jpg';

        const savePath = path.join(LOGO_DIR, `${slug}${ext}`);
        fs.writeFileSync(savePath, imgRes.data);
        return `logos/companies/${slug}${ext}`;
      } catch { continue; }
    }
    return null;
  } catch (e) {
    log(`  アクセス失敗 ${websiteUrl}: ${e.message}`);
    return null;
  }
}

async function main() {
  const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf-8'));
  log(`ロゴ収集開始: ${companies.length}社`);

  let success = 0, missing = 0;

  for (const c of companies) {
    process.stdout.write(`[${c.ranking_priority}/${companies.length}] ${c.display_name}... `);
    const result = await fetchLogo(c.website_url, c.slug);
    if (result) {
      c.logo_status = 'collected';
      c.logo_path = result;
      success++;
      console.log('OK');
    } else {
      c.logo_status = 'missing';
      c.logo_path = '';
      missing++;
      console.log('MISSING');
    }
    await new Promise(r => setTimeout(r, 400));
  }

  fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2), 'utf-8');
  log(`\n完了: 成功=${success}, missing=${missing}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
