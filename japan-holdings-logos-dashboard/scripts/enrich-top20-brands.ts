import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const dataDir = path.join(process.cwd(), 'data');
const logsDir = path.join(process.cwd(), 'logs');
const groupBrandsDir = path.join(process.cwd(), 'public', 'logos', 'group_brands');
[logsDir, groupBrandsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const logPath = path.join(logsDir, 'logo-collection.log');
const top20Path = path.join(dataDir, 'top20_group_map.json');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
  console.log(msg);
}

const brandUrlMap: Record<string, string> = {
  'SoftBank Group': 'https://group.softbank/',
  'SoftBank': 'https://www.softbank.jp/corp/',
  'Arm': 'https://www.arm.com/',
  'Vision Fund': 'https://visionfund.com/',
  'Nomura': 'https://www.nomura.co.jp/',
  'Nomura Asset Management': 'https://www.nomura-am.co.jp/',
  'Nomura Securities': 'https://www.nomura.co.jp/',
  '7&i': 'https://www.7andi.com/',
  '7-Eleven': 'https://www.sej.co.jp/',
  'イトーヨーカドー': 'https://www.itoyokado.co.jp/',
  'ヨークベニマル': 'https://yorkbenimaru.com/',
  'デニーズ': 'https://www.dennys.jp/',
  '日本郵政': 'https://www.japanpost.jp/',
  '日本郵便': 'https://www.post.japanpost.jp/',
  'ゆうちょ銀行': 'https://www.jp-bank.japanpost.jp/',
  'かんぽ生命': 'https://www.jp-life.japanpost.jp/',
  '三菱HCキャピタル': 'https://www.mitsubishi-hc-capital.com/',
  "McDonald's": 'https://www.mcdonalds.co.jp/',
  '日本マクドナルド': 'https://www.mcdonalds.co.jp/',
  'NIPPON EXPRESS': 'https://www.nipponexpress.com/',
  'NX': 'https://www.nipponexpress-holdings.com/ja/',
  'NX Logistics': 'https://www.nipponexpress.com/',
  '日本酸素ホールディングス': 'https://www.nipponsanso-hd.co.jp/',
  'Thermos': 'https://www.thermos.jp/',
  'Matheson': 'https://www.mathesongas.com/',
  'Taiyo Nippon Sanso': 'https://www.tn-sanso.co.jp/',
  'SCREEN': 'https://www.screen.co.jp/',
  'SCREEN Semiconductor Solutions': 'https://www.screen.co.jp/spe',
  'SCREEN Graphic Solutions': 'https://www.screen.co.jp/ga',
  'SCREEN PE Solutions': 'https://www.screen.co.jp/pe',
  'DOWA': 'https://www.dowa.co.jp/',
  'DOWAエコシステム': 'https://www.dowa-eco.co.jp/',
  'DOWAメタルマイン': 'https://www.dowa.co.jp/',
  'DOWAエレクトロニクス': 'https://www.dowa.co.jp/',
  'DOWAメタルテック': 'https://www.dowa.co.jp/',
  'DOWAサーモテック': 'https://www.dowa.co.jp/',
  'ゼンショー': 'https://www.zensho.com/jp/',
  'すき家': 'https://www.sukiya.jp/',
  'はま寿司': 'https://www.hamazushi.com/',
  'なか卯': 'https://www.nakau.co.jp/',
  'ココス': 'https://www.cocos-jpn.co.jp/',
  'ジョリーパスタ': 'https://www.jolly-pasta.co.jp/',
  'ビッグボーイ': 'https://www.bigboyjapan.co.jp/',
  'JFE': 'https://www.jfe-holdings.co.jp/',
  'JFEスチール': 'https://www.jfe-steel.co.jp/',
  'JFEエンジニアリング': 'https://www.jfe-eng.co.jp/',
  'JFE商事': 'https://www.jfe-shoji.co.jp/',
  'MS&AD': 'https://www.ms-ad-hd.com/',
  '三井住友海上': 'https://www.ms-ins.com/',
  'あいおいニッセイ同和損保': 'https://www.aioinissaydowa.co.jp/',
  '三井住友海上あいおい生命': 'https://www.msa-life.co.jp/',
  'SOMPO': 'https://www.sompo-hd.com/',
  '損保ジャパン': 'https://www.sompo-japan.co.jp/',
  'SOMPOひまわり生命': 'https://www.himawari-life.co.jp/',
  'SOMPOケア': 'https://www.sompocare.com/',
  'dentsu': 'https://www.dentsu.co.jp/',
  '電通': 'https://www.dentsu.co.jp/',
  '電通総研': 'https://www.dentsusoken.com/',
  'Sony': 'https://www.sony.com/ja/',
  'PlayStation': 'https://www.playstation.com/ja-jp/',
  'Sony Music': 'https://www.sonymusic.co.jp/',
  'Sony Pictures': 'https://www.sonypictures.jp/',
  'Sony Semiconductor': 'https://www.sony-semicon.com/',
  '第一生命': 'https://www.dai-ichi-life.co.jp/',
  'Dai-ichi Life': 'https://www.dai-ichi-life.co.jp/',
  'ネオファースト生命': 'https://neofirst.co.jp/',
  '東京海上': 'https://www.tokiomarinehd.com/',
  '東京海上日動': 'https://www.tokiomarine-nichido.co.jp/',
  '東京海上日動あんしん生命': 'https://www.tmn-anshin.co.jp/',
  'りそな': 'https://www.resona-gr.co.jp/',
  'りそな銀行': 'https://www.resonabank.co.jp/',
  '埼玉りそな銀行': 'https://www.saitamaresona.co.jp/',
  '関西みらい銀行': 'https://www.kansaimiraibank.co.jp/',
  'みなと銀行': 'https://www.minatobk.co.jp/',
};

async function fetchAndSaveLogo(url: string, savePath: string): Promise<boolean> {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      maxRedirects: 5,
    });
    const $ = cheerio.load(res.data);

    const candidates: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) candidates.push(ogImage);

    $('link[rel*="icon"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.endsWith('.svg') || href.endsWith('.png'))) candidates.push(href);
    });

    $('header img, .logo img, #logo img, [class*="logo"] img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) candidates.push(src);
    });

    for (const candidate of candidates) {
      let imgUrl = candidate;
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/')) {
        const base = new URL(url);
        imgUrl = base.origin + imgUrl;
      } else if (!imgUrl.startsWith('http')) {
        const base = new URL(url);
        imgUrl = base.origin + '/' + imgUrl;
      }

      const lower = imgUrl.toLowerCase();
      if (!lower.includes('logo') && !lower.includes('brand') && !lower.includes('og') && !lower.endsWith('.svg')) continue;

      try {
        const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 8000 });
        const contentType = imgRes.headers['content-type'] || '';
        let ext = '.png';
        if (contentType.includes('svg')) ext = '.svg';
        else if (contentType.includes('webp')) ext = '.webp';
        else if (contentType.includes('jpeg')) ext = '.jpg';

        const finalPath = savePath + ext;
        fs.writeFileSync(finalPath, imgRes.data);
        return true;
      } catch { continue; }
    }
    return false;
  } catch { return false; }
}

async function main() {
  const top20 = JSON.parse(fs.readFileSync(top20Path, 'utf-8'));
  log('TOP20ブランドロゴ収集開始');

  for (const entry of top20) {
    const brandDir = path.join(groupBrandsDir, entry.slug);
    if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

    log(`  [${entry.rank}] ${entry.company_name}`);

    entry.collected_brand_logos = [];
    entry.missing_brand_logos = [];

    for (const hint of entry.logo_targets_hint) {
      const brandUrl = brandUrlMap[hint];
      if (!brandUrl) {
        entry.missing_brand_logos.push(hint);
        log(`    URL不明（missing）: ${hint}`);
        continue;
      }

      const brandSlug = hint.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || hint;
      const saveBase = path.join(brandDir, brandSlug);

      const exts = ['.svg', '.png', '.webp', '.jpg'];
      let existing = '';
      for (const ext of exts) {
        if (fs.existsSync(saveBase + ext)) { existing = saveBase + ext; break; }
      }

      if (existing) {
        const relPath = `logos/group_brands/${entry.slug}/${brandSlug}${path.extname(existing)}`;
        entry.collected_brand_logos.push({
          name: hint,
          type: 'brand',
          logo_path: relPath,
          source_url: brandUrl,
          verified: true,
        });
        log(`    キャッシュ済み: ${hint}`);
      } else {
        const ok = await fetchAndSaveLogo(brandUrl, saveBase);
        if (ok) {
          let foundExt = '';
          for (const ext of exts) { if (fs.existsSync(saveBase + ext)) { foundExt = ext; break; } }
          const relPath = `logos/group_brands/${entry.slug}/${brandSlug}${foundExt}`;
          entry.collected_brand_logos.push({
            name: hint,
            type: 'brand',
            logo_path: relPath,
            source_url: brandUrl,
            verified: true,
          });
          log(`    取得成功: ${hint}`);
        } else {
          entry.missing_brand_logos.push(hint);
          log(`    取得失敗（missing）: ${hint}`);
        }
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }

  fs.writeFileSync(top20Path, JSON.stringify(top20, null, 2), 'utf-8');
  log('TOP20ブランドロゴ収集完了');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
