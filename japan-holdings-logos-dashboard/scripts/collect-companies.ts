import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const logsDir = path.join(process.cwd(), 'logs');
[dataDir, logsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const companiesPath = path.join(dataDir, 'companies.json');
const logPath = path.join(logsDir, 'company-collection.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
  console.log(msg);
}

if (!fs.existsSync(companiesPath)) {
  log('ERROR: data/companies.json が見つかりません');
  process.exit(1);
}

const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
log(`companies.json 確認: ${companies.length}件`);

// 重複チェック
const slugs = companies.map((c: any) => c.slug);
const dupes = slugs.filter((s: string, i: number) => slugs.indexOf(s) !== i);
if (dupes.length > 0) {
  log(`重複slug検出: ${dupes.join(', ')}`);
} else {
  log('重複なし');
}

// 日本企業チェック
const nonJapan = companies.filter((c: any) => !c.is_japan_company);
if (nonJapan.length > 0) {
  log(`日本企業でないデータ: ${nonJapan.map((c: any) => c.company_name).join(', ')}`);
} else {
  log('全て日本企業');
}

log(`総数: ${companies.length}社`);
log(`holding: ${companies.filter((c: any) => c.category === 'holding').length}社`);
log(`group: ${companies.filter((c: any) => c.category === 'group').length}社`);
