import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logPath = path.join(logsDir, 'logo-collection.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
  console.log(msg);
}

const companies = JSON.parse(fs.readFileSync(path.join(dataDir, 'companies.json'), 'utf-8'));
const top20 = JSON.parse(fs.readFileSync(path.join(dataDir, 'top20_group_map.json'), 'utf-8'));

log('アセット検証開始');

let collectCount = 0, missingCount = 0;

for (const c of companies) {
  if (c.logo_path && fs.existsSync(path.join(process.cwd(), 'public', c.logo_path))) {
    collectCount++;
  } else {
    c.logo_status = 'missing';
    c.logo_path = '';
    missingCount++;
    log(`  missing: ${c.display_name}`);
  }
}

log(`\n親会社ロゴ: 取得済み=${collectCount}, missing=${missingCount}`);

let brandCollected = 0, brandMissing = 0;
for (const entry of top20) {
  const valid: any[] = [];
  for (const brand of (entry.collected_brand_logos || [])) {
    if (brand.logo_path && fs.existsSync(path.join(process.cwd(), 'public', brand.logo_path))) {
      valid.push(brand);
      brandCollected++;
    } else {
      if (!entry.missing_brand_logos.includes(brand.name)) {
        entry.missing_brand_logos.push(brand.name);
      }
      brandMissing++;
    }
  }
  entry.collected_brand_logos = valid;
}

log(`ブランドロゴ: 取得済み=${brandCollected}, missing=${brandMissing}`);

fs.writeFileSync(path.join(dataDir, 'companies.json'), JSON.stringify(companies, null, 2), 'utf-8');
fs.writeFileSync(path.join(dataDir, 'top20_group_map.json'), JSON.stringify(top20, null, 2), 'utf-8');
log('検証完了・JSON更新済み');
