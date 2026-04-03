const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_PATH = path.join(process.cwd(), 'logs', 'logo-collection.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(msg);
}

const companies = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf-8'));
log('アセット検証開始');

let ok = 0, ng = 0;
for (const c of companies) {
  if (c.logo_path && fs.existsSync(path.join(process.cwd(), 'public', c.logo_path))) {
    ok++;
  } else {
    c.logo_status = 'missing';
    c.logo_path = '';
    ng++;
    log(`  missing: [${c.ranking_priority}] ${c.display_name}`);
  }
}

fs.writeFileSync(path.join(DATA_DIR, 'companies.json'), JSON.stringify(companies, null, 2), 'utf-8');
log(`検証完了: 取得済み=${ok}, missing=${ng}`);
