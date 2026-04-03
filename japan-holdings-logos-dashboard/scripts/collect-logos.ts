import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const dataDir = path.join(process.cwd(), 'data');
const logsDir = path.join(process.cwd(), 'logs');
const companiesLogosDir = path.join(process.cwd(), 'public', 'logos', 'companies');
[logsDir, companiesLogosDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const logPath = path.join(logsDir, 'logo-collection.log');
const companiesPath = path.join(dataDir, 'companies.json');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
  console.log(msg);
}

async function fetchLogoFromSite(websiteUrl: string, slug: string): Promise<string | null> {
  try {
    const res = await axios.get(websiteUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
      maxRedirects: 5,
    });
    const $ = cheerio.load(res.data);

    const candidates: string[] = [];

    // OGP image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) candidates.push(ogImage);

    // link rel=icon SVG/PNG
    $('link[rel*="icon"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.endsWith('.svg') || href.endsWith('.png'))) candidates.push(href);
    });

    // header img / .logo img / #logo img
    $('header img, .logo img, #logo img, .site-logo img, .brand img, [class*="logo"] img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) candidates.push(src);
    });

    if (candidates.length === 0) return null;

    for (const candidate of candidates) {
      let imgUrl = candidate;
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/')) {
        const base = new URL(websiteUrl);
        imgUrl = base.origin + imgUrl;
      } else if (!imgUrl.startsWith('http')) {
        const base = new URL(websiteUrl);
        imgUrl = base.origin + '/' + imgUrl;
      }

      const lower = imgUrl.toLowerCase();
      const isLogoLike = lower.includes('logo') || lower.includes('brand') || lower.includes('corporate') || lower.endsWith('.svg');
      if (!isLogoLike && !lower.includes('og')) continue;

      try {
        const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 8000 });
        const contentType = imgRes.headers['content-type'] || '';
        let ext = '.png';
        if (contentType.includes('svg')) ext = '.svg';
        else if (contentType.includes('webp')) ext = '.webp';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';

        const savePath = path.join(companiesLogosDir, `${slug}${ext}`);
        fs.writeFileSync(savePath, imgRes.data);
        return `logos/companies/${slug}${ext}`;
      } catch {
        continue;
      }
    }
    return null;
  } catch (err: any) {
    log(`  サイトアクセス失敗 ${websiteUrl}: ${err.message}`);
    return null;
  }
}

async function main() {
  const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
  log(`ロゴ収集開始: ${companies.length}社`);

  let success = 0;
  let missing = 0;

  for (const company of companies) {
    log(`  処理中 [${company.ranking_priority}] ${company.display_name}`);

    const existingExts = ['.svg', '.png', '.webp', '.jpg'];
    let alreadyExists = false;
    for (const ext of existingExts) {
      if (fs.existsSync(path.join(companiesLogosDir, `${company.slug}${ext}`))) {
        company.logo_status = 'collected';
        company.logo_path = `logos/companies/${company.slug}${ext}`;
        alreadyExists = true;
        success++;
        log(`  キャッシュ済み: ${company.slug}${ext}`);
        break;
      }
    }

    if (!alreadyExists) {
      const logoPath = await fetchLogoFromSite(company.website_url, company.slug);
      if (logoPath) {
        company.logo_status = 'collected';
        company.logo_path = logoPath;
        success++;
        log(`  取得成功: ${logoPath}`);
      } else {
        company.logo_status = 'missing';
        company.logo_path = '';
        missing++;
        log(`  取得失敗（missing）: ${company.display_name}`);
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync(companiesPath, JSON.stringify(companies, null, 2), 'utf-8');
  log(`\n完了: 成功=${success}, missing=${missing}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
