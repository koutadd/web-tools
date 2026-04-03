const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_DIR = path.join(process.cwd(), 'logs');
const BRAND_LOGOS_DIR = path.join(process.cwd(), 'public', 'logos', 'group_brands');

[LOGS_DIR, BRAND_LOGOS_DIR].forEach((d: string) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const LOG_PATH = path.join(LOGS_DIR, 'logo-collection.log');
const MAP_PATH = path.join(DATA_DIR, 'top50_group_map.json');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(msg);
}

async function fetchLogoFromUrl(url: string, savePath: string): Promise<string | null> {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
      maxRedirects: 5,
    });
    const $ = cheerio.load(res.data);
    const candidates: Array<{ type: string; content?: string; url?: string }> = [];

    // SVG inline logo
    $('header svg, .logo svg, #logo svg, [class*="logo"] svg').each((_: number, el: any) => {
      const outerHtml = $.html(el);
      if (outerHtml && outerHtml.length > 100) {
        candidates.unshift({ type: 'svg_inline', content: outerHtml });
      }
    });

    const og = $('meta[property="og:image"]').attr('content');
    if (og) candidates.push({ type: 'url', url: og });

    $('link[rel*="icon"][href$=".svg"], link[rel*="icon"][href$=".png"]').each((_: number, el: any) => {
      const href = $(el).attr('href');
      if (href) candidates.push({ type: 'url', url: href });
    });

    $('header img, .logo img, #logo img, [class*="logo"] img, [id*="logo"] img, .header-logo img, .site-logo img, .global-header img, .nav-logo img').each((_: number, el: any) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) candidates.push({ type: 'url', url: src });
    });

    const base = new URL(url);

    for (const cand of candidates) {
      if (cand.type === 'svg_inline') {
        fs.writeFileSync(savePath + '.svg', cand.content, 'utf-8');
        return savePath + '.svg';
      }

      let imgUrl = cand.url;
      if (!imgUrl) continue;
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/')) imgUrl = base.origin + imgUrl;
      else if (!imgUrl.startsWith('http')) imgUrl = base.origin + '/' + imgUrl;

      const lower = imgUrl.toLowerCase();
      const isLogoLike = lower.includes('logo') || lower.includes('brand') || lower.includes('corporate') || lower.endsWith('.svg') || lower.includes('header');
      const isOg = lower.includes('og') || lower.includes('ogp') || lower.includes('thumbnail');
      if (!isLogoLike && !isOg) continue;

      try {
        const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const ct = imgRes.headers['content-type'] || '';
        let ext = '.png';
        if (ct.includes('svg') || imgUrl.endsWith('.svg')) ext = '.svg';
        else if (ct.includes('webp')) ext = '.webp';
        else if (ct.includes('jpeg') || imgUrl.endsWith('.jpg')) ext = '.jpg';

        fs.writeFileSync(savePath + ext, imgRes.data);
        return savePath + ext;
      } catch { continue; }
    }
    return null;
  } catch (e: any) {
    log(`    WARNING access failed ${url}: ${e.message}`);
    return null;
  }
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'));
  log(`TOP50 brand logo collection started: ${map.length} companies`);

  let totalSuccess = 0, totalMissing = 0;

  for (const entry of map) {
    const brandDir = path.join(BRAND_LOGOS_DIR, entry.slug);
    if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

    log(`\n[${entry.rank}] ${entry.company_name}`);

    for (const brand of entry.brand_targets) {
      if (!brand.website_url) {
        brand.logo_status = 'missing';
        totalMissing++;
        log(`  SKIP no URL: ${brand.name}`);
        continue;
      }

      const brandSlug = brand.name
        .toLowerCase()
        .replace(/[^\w\u3040-\u30FF\u4E00-\u9FFF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
      const saveBase = path.join(brandDir, brandSlug);

      // cache check
      const exts = ['.svg', '.png', '.webp', '.jpg'];
      let cached = '';
      for (const ext of exts) {
        if (fs.existsSync(saveBase + ext)) { cached = saveBase + ext; break; }
      }

      if (cached) {
        brand.logo_path = `logos/group_brands/${entry.slug}/${brandSlug}${path.extname(cached)}`;
        brand.logo_status = 'collected';
        totalSuccess++;
        log(`  CACHED: ${brand.name}`);
        continue;
      }

      process.stdout.write(`  Processing: ${brand.name}... `);
      const result = await fetchLogoFromUrl(brand.website_url, saveBase);

      if (result) {
        const ext = path.extname(result);
        brand.logo_path = `logos/group_brands/${entry.slug}/${brandSlug}${ext}`;
        brand.logo_status = 'collected';
        brand.source_url = brand.website_url;
        totalSuccess++;
        console.log('OK');
      } else {
        brand.logo_status = 'missing';
        brand.logo_path = '';
        totalMissing++;
        console.log('MISSING');
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }

  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2), 'utf-8');
  log(`\nDone: success=${totalSuccess}, missing=${totalMissing}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
