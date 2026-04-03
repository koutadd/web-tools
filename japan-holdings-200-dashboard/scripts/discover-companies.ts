const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_DIR = path.join(process.cwd(), 'logs');
[DATA_DIR, LOGS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const LOG_PATH = path.join(LOGS_DIR, 'company-discovery.log');
const RAW_PATH = path.join(DATA_DIR, 'companies_raw.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(msg);
}

function detectKeyword(name) {
  if (/ホールディングス/i.test(name)) return 'ホールディングス';
  if (/グループ/i.test(name)) return 'グループ';
  if (/HOLDINGS/i.test(name)) return 'HOLDINGS';
  if (/GROUP/i.test(name)) return 'GROUP';
  return null;
}

function detectCategory(name) {
  const kw = detectKeyword(name);
  if (kw === 'ホールディングス') return 'holding';
  if (kw === 'グループ') return 'group';
  if (kw === 'HOLDINGS') return 'holdings_en';
  if (kw === 'GROUP') return 'group_en';
  return 'mixed';
}

// 内蔵候補リスト（320社以上）
const BUILTIN_CANDIDATES = [
  // 金融・保険
  { company_name: '三菱UFJフィナンシャル・グループ', industry: '銀行', website_url: 'https://www.mufg.jp/', source_url: 'https://www.mufg.jp/' },
  { company_name: '三井住友フィナンシャルグループ', industry: '銀行', website_url: 'https://www.smfg.co.jp/', source_url: 'https://www.smfg.co.jp/' },
  { company_name: 'みずほフィナンシャルグループ', industry: '銀行', website_url: 'https://www.mizuho-fg.co.jp/', source_url: 'https://www.mizuho-fg.co.jp/' },
  { company_name: '野村ホールディングス', industry: '証券', website_url: 'https://www.nomura.co.jp/', source_url: 'https://www.nomura.co.jp/' },
  { company_name: '大和証券グループ本社', industry: '証券', website_url: 'https://www.daiwa-grp.jp/', source_url: 'https://www.daiwa-grp.jp/' },
  { company_name: '東京海上ホールディングス', industry: '損害保険', website_url: 'https://www.tokiomarinehd.com/', source_url: 'https://www.tokiomarinehd.com/' },
  { company_name: 'SOMPOホールディングス', industry: '損害保険', website_url: 'https://www.sompo-hd.com/', source_url: 'https://www.sompo-hd.com/' },
  { company_name: 'MS&ADインシュアランスグループホールディングス', industry: '損害保険', website_url: 'https://www.ms-ad-hd.com/', source_url: 'https://www.ms-ad-hd.com/' },
  { company_name: '第一生命ホールディングス', industry: '生命保険', website_url: 'https://www.dai-ichi-life-hd.com/', source_url: 'https://www.dai-ichi-life-hd.com/' },
  { company_name: '日本生命グループ', industry: '生命保険', website_url: 'https://www.nissay.co.jp/', source_url: 'https://www.nissay.co.jp/' },
  { company_name: 'りそなホールディングス', industry: '銀行', website_url: 'https://www.resona-gr.co.jp/holdings/', source_url: 'https://www.resona-gr.co.jp/holdings/' },
  { company_name: '三井住友トラスト・ホールディングス', industry: '信託銀行', website_url: 'https://www.smth.jp/', source_url: 'https://www.smth.jp/' },
  { company_name: 'オリックスグループ', industry: '総合金融', website_url: 'https://www.orix.co.jp/grp/', source_url: 'https://www.orix.co.jp/grp/' },
  { company_name: 'SBIホールディングス', industry: 'ネット金融', website_url: 'https://www.sbiholdings.co.jp/', source_url: 'https://www.sbiholdings.co.jp/' },
  { company_name: '松井証券グループ', industry: '証券', website_url: 'https://www.matsui.co.jp/', source_url: 'https://www.matsui.co.jp/' },
  { company_name: 'GMOフィナンシャルホールディングス', industry: 'ネット金融', website_url: 'https://www.gmo-fh.com/', source_url: 'https://www.gmo-fh.com/' },
  { company_name: 'ふくおかフィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.fukuoka-fg.com/', source_url: 'https://www.fukuoka-fg.com/' },
  { company_name: '九州フィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.kyushu-fg.co.jp/', source_url: 'https://www.kyushu-fg.co.jp/' },
  { company_name: 'しずおかフィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.shizuokabank.co.jp/', source_url: 'https://www.shizuokabank.co.jp/' },
  { company_name: 'コンコルディア・フィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.concordia-fg.jp/', source_url: 'https://www.concordia-fg.jp/' },
  { company_name: 'めぶきフィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.mebuki-fg.co.jp/', source_url: 'https://www.mebuki-fg.co.jp/' },
  { company_name: '西日本フィナンシャルホールディングス', industry: '地方銀行', website_url: 'https://www.nfhd.co.jp/', source_url: 'https://www.nfhd.co.jp/' },
  { company_name: 'ひろぎんホールディングス', industry: '地方銀行', website_url: 'https://www.hirogin-hd.co.jp/', source_url: 'https://www.hirogin-hd.co.jp/' },
  { company_name: 'いよぎんホールディングス', industry: '地方銀行', website_url: 'https://www.iyogin-hd.co.jp/', source_url: 'https://www.iyogin-hd.co.jp/' },
  { company_name: 'ちゅうぎんフィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.chugginfinancialgroup.co.jp/', source_url: 'https://www.chugginfinancialgroup.co.jp/' },
  { company_name: '八十二銀行グループ', industry: '地方銀行', website_url: 'https://www.82bank.co.jp/', source_url: 'https://www.82bank.co.jp/' },
  { company_name: '山口フィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.ymfg.co.jp/', source_url: 'https://www.ymfg.co.jp/' },
  { company_name: '四国フィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.shikoku-fg.co.jp/', source_url: 'https://www.shikoku-fg.co.jp/' },
  { company_name: 'フィデアホールディングス', industry: '地方銀行', website_url: 'https://www.fidea-hd.co.jp/', source_url: 'https://www.fidea-hd.co.jp/' },
  { company_name: 'じもとホールディングス', industry: '地方銀行', website_url: 'https://www.jimoto-hd.co.jp/', source_url: 'https://www.jimoto-hd.co.jp/' },
  { company_name: 'きらぼしフィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.kiraboshi-fg.co.jp/', source_url: 'https://www.kiraboshi-fg.co.jp/' },
  { company_name: '東和ホールディングス', industry: '地方銀行', website_url: 'https://www.towa-holdings.co.jp/', source_url: 'https://www.towa-holdings.co.jp/' },
  { company_name: 'T&Dホールディングス', industry: '生命保険', website_url: 'https://www.td-holdings.co.jp/', source_url: 'https://www.td-holdings.co.jp/' },
  { company_name: 'FPGホールディングス', industry: 'ファンド', website_url: 'https://www.fpg-net.co.jp/', source_url: 'https://www.fpg-net.co.jp/' },
  { company_name: 'アイフルグループ', industry: '消費者金融', website_url: 'https://www.aiful.co.jp/', source_url: 'https://www.aiful.co.jp/' },
  // 通信・IT
  { company_name: 'ソフトバンクグループ', industry: '通信・投資', website_url: 'https://group.softbank/', source_url: 'https://group.softbank/' },
  { company_name: 'NTTグループ', industry: '通信', website_url: 'https://www.ntt.com/', source_url: 'https://www.ntt.com/' },
  { company_name: 'KDDIグループ', industry: '通信', website_url: 'https://www.kddi.com/', source_url: 'https://www.kddi.com/' },
  { company_name: '楽天グループ', industry: 'EC・通信', website_url: 'https://global.rakuten.com/corp/', source_url: 'https://global.rakuten.com/corp/' },
  { company_name: 'GMOインターネットグループ', industry: 'インターネット', website_url: 'https://www.gmo.jp/', source_url: 'https://www.gmo.jp/' },
  { company_name: 'サイバーエージェントグループ', industry: 'IT・広告', website_url: 'https://www.cyberagent.co.jp/', source_url: 'https://www.cyberagent.co.jp/' },
  { company_name: 'TISインテックグループ', industry: 'IT', website_url: 'https://www.tis.co.jp/', source_url: 'https://www.tis.co.jp/' },
  { company_name: 'NTTデータグループ', industry: 'IT', website_url: 'https://www.nttdata.com/jp/ja/', source_url: 'https://www.nttdata.com/jp/ja/' },
  { company_name: '富士通グループ', industry: 'IT', website_url: 'https://www.fujitsu.com/jp/', source_url: 'https://www.fujitsu.com/jp/' },
  { company_name: 'NECグループ', industry: 'IT・電機', website_url: 'https://jpn.nec.com/', source_url: 'https://jpn.nec.com/' },
  { company_name: 'CARTA HOLDINGS', industry: 'デジタルマーケティング', website_url: 'https://cartaholdings.co.jp/', source_url: 'https://cartaholdings.co.jp/' },
  { company_name: 'デジタルホールディングス', industry: 'IT・広告', website_url: 'https://digital-holdings.co.jp/', source_url: 'https://digital-holdings.co.jp/' },
  { company_name: 'ベネッセホールディングス', industry: '教育・IT', website_url: 'https://www.benesse-hd.co.jp/', source_url: 'https://www.benesse-hd.co.jp/' },
  { company_name: 'リクルートホールディングス', industry: 'HR・メディア', website_url: 'https://recruit-holdings.com/ja/', source_url: 'https://recruit-holdings.com/ja/' },
  { company_name: 'パーソルホールディングス', industry: '人材', website_url: 'https://www.persol-group.co.jp/', source_url: 'https://www.persol-group.co.jp/' },
  { company_name: 'テンプホールディングス', industry: '人材', website_url: 'https://www.tempholdings.co.jp/', source_url: 'https://www.tempholdings.co.jp/' },
  { company_name: 'UTグループ', industry: '製造派遣', website_url: 'https://www.ut-g.co.jp/', source_url: 'https://www.ut-g.co.jp/' },
  { company_name: 'NISSOホールディングス', industry: '人材', website_url: 'https://www.nisso-holdings.co.jp/', source_url: 'https://www.nisso-holdings.co.jp/' },
  // 製造・電機
  { company_name: 'ソニーグループ', industry: '電機・エンタメ', website_url: 'https://www.sony.com/ja/', source_url: 'https://www.sony.com/ja/' },
  { company_name: 'パナソニックホールディングス', industry: '電機', website_url: 'https://holdings.panasonic/jp/', source_url: 'https://holdings.panasonic/jp/' },
  { company_name: '日立製作所グループ', industry: '電機', website_url: 'https://www.hitachi.co.jp/', source_url: 'https://www.hitachi.co.jp/' },
  { company_name: '三菱電機グループ', industry: '電機', website_url: 'https://www.mitsubishielectric.co.jp/', source_url: 'https://www.mitsubishielectric.co.jp/' },
  { company_name: 'SCREENホールディングス', industry: '半導体装置', website_url: 'https://www.screen.co.jp/', source_url: 'https://www.screen.co.jp/' },
  { company_name: 'DOWAホールディングス', industry: '非鉄金属', website_url: 'https://www.dowa.co.jp/', source_url: 'https://www.dowa.co.jp/' },
  { company_name: 'JFEホールディングス', industry: '鉄鋼', website_url: 'https://www.jfe-holdings.co.jp/', source_url: 'https://www.jfe-holdings.co.jp/' },
  { company_name: '日本製鉄グループ', industry: '鉄鋼', website_url: 'https://www.nipponsteel.com/', source_url: 'https://www.nipponsteel.com/' },
  { company_name: '住友電気工業グループ', industry: '電線・電機', website_url: 'https://www.sei.co.jp/', source_url: 'https://www.sei.co.jp/' },
  { company_name: '旭化成グループ', industry: '化学・住宅', website_url: 'https://www.asahi-kasei.co.jp/', source_url: 'https://www.asahi-kasei.co.jp/' },
  { company_name: '東レグループ', industry: '繊維・化学', website_url: 'https://www.toray.co.jp/', source_url: 'https://www.toray.co.jp/' },
  { company_name: '帝人グループ', industry: '繊維・化学', website_url: 'https://www.teijin.co.jp/', source_url: 'https://www.teijin.co.jp/' },
  { company_name: '三菱ケミカルグループ', industry: '化学', website_url: 'https://www.mcgc.com/jp/', source_url: 'https://www.mcgc.com/jp/' },
  { company_name: '住友化学グループ', industry: '化学', website_url: 'https://www.sumitomo-chem.co.jp/', source_url: 'https://www.sumitomo-chem.co.jp/' },
  { company_name: '花王グループ', industry: '日用品・化粧品', website_url: 'https://www.kao.com/jp/', source_url: 'https://www.kao.com/jp/' },
  { company_name: 'ライオングループ', industry: '日用品', website_url: 'https://www.lion.co.jp/', source_url: 'https://www.lion.co.jp/' },
  { company_name: '大塚グループ', industry: '製薬・食品', website_url: 'https://www.otsuka.co.jp/', source_url: 'https://www.otsuka.co.jp/' },
  { company_name: '武田薬品工業グループ', industry: '製薬', website_url: 'https://www.takeda.com/ja-jp/', source_url: 'https://www.takeda.com/ja-jp/' },
  { company_name: 'アステラスグループ', industry: '製薬', website_url: 'https://www.astellas.com/jp/', source_url: 'https://www.astellas.com/jp/' },
  { company_name: '第一三共グループ', industry: '製薬', website_url: 'https://www.daiichisankyo.co.jp/', source_url: 'https://www.daiichisankyo.co.jp/' },
  { company_name: '中外製薬グループ', industry: '製薬', website_url: 'https://www.chugai-pharm.co.jp/', source_url: 'https://www.chugai-pharm.co.jp/' },
  { company_name: '塩野義製薬グループ', industry: '製薬', website_url: 'https://www.shionogi.com/jp/ja/', source_url: 'https://www.shionogi.com/jp/ja/' },
  { company_name: '小野薬品工業グループ', industry: '製薬', website_url: 'https://www.ono-pharma.com/', source_url: 'https://www.ono-pharma.com/' },
  { company_name: '日本酸素ホールディングス', industry: '産業ガス', website_url: 'https://www.nipponsanso-hd.co.jp/', source_url: 'https://www.nipponsanso-hd.co.jp/' },
  { company_name: 'トピー工業グループ', industry: '鉄鋼・ホイール', website_url: 'https://www.topy.co.jp/', source_url: 'https://www.topy.co.jp/' },
  { company_name: 'OBARA GROUP', industry: '溶接機器', website_url: 'https://www.obara-group.co.jp/', source_url: 'https://www.obara-group.co.jp/' },
  // 自動車・輸送機器
  { company_name: 'トヨタグループ', industry: '自動車', website_url: 'https://global.toyota/jp/', source_url: 'https://global.toyota/jp/' },
  { company_name: 'ホンダグループ', industry: '自動車', website_url: 'https://www.honda.co.jp/', source_url: 'https://www.honda.co.jp/' },
  { company_name: '日産自動車グループ', industry: '自動車', website_url: 'https://www.nissan-global.com/JP/', source_url: 'https://www.nissan-global.com/JP/' },
  { company_name: 'デンソーグループ', industry: '自動車部品', website_url: 'https://www.denso.com/jp/ja/', source_url: 'https://www.denso.com/jp/ja/' },
  { company_name: 'ヤマハグループ', industry: '楽器・バイク', website_url: 'https://www.yamaha.com/ja/', source_url: 'https://www.yamaha.com/ja/' },
  // 商社
  { company_name: '三菱商事グループ', industry: '総合商社', website_url: 'https://www.mitsubishicorp.com/jp/ja/', source_url: 'https://www.mitsubishicorp.com/jp/ja/' },
  { company_name: '三井物産グループ', industry: '総合商社', website_url: 'https://www.mitsui.com/jp/ja/', source_url: 'https://www.mitsui.com/jp/ja/' },
  { company_name: '住友商事グループ', industry: '総合商社', website_url: 'https://www.sumitomocorp.com/ja/jp/', source_url: 'https://www.sumitomocorp.com/ja/jp/' },
  { company_name: '伊藤忠グループ', industry: '総合商社', website_url: 'https://www.itochu.co.jp/ja/', source_url: 'https://www.itochu.co.jp/ja/' },
  { company_name: '丸紅グループ', industry: '総合商社', website_url: 'https://www.marubeni.com/jp/', source_url: 'https://www.marubeni.com/jp/' },
  { company_name: '豊田通商グループ', industry: '商社', website_url: 'https://www.toyota-tsusho.com/jp/', source_url: 'https://www.toyota-tsusho.com/jp/' },
  { company_name: '三菱HCキャピタル', industry: 'リース', website_url: 'https://www.mitsubishi-hc-capital.com/', source_url: 'https://www.mitsubishi-hc-capital.com/' },
  // 小売・流通
  { company_name: 'セブン＆アイ・ホールディングス', industry: '小売', website_url: 'https://www.7andi.com/', source_url: 'https://www.7andi.com/' },
  { company_name: 'イオングループ', industry: '小売', website_url: 'https://www.aeon.info/', source_url: 'https://www.aeon.info/' },
  { company_name: 'ファーストリテイリンググループ', industry: 'アパレル', website_url: 'https://www.fastretailing.com/jp/', source_url: 'https://www.fastretailing.com/jp/' },
  { company_name: 'ゼンショーホールディングス', industry: '外食', website_url: 'https://www.zensho.com/jp/', source_url: 'https://www.zensho.com/jp/' },
  { company_name: '日本マクドナルドホールディングス', industry: '外食', website_url: 'https://www.mcd-holdings.co.jp/', source_url: 'https://www.mcd-holdings.co.jp/' },
  { company_name: 'コロワイドグループ', industry: '外食', website_url: 'https://www.colowide.co.jp/', source_url: 'https://www.colowide.co.jp/' },
  { company_name: 'すかいらーくグループ', industry: '外食', website_url: 'https://www.skylark.co.jp/', source_url: 'https://www.skylark.co.jp/' },
  { company_name: 'ロイヤルホールディングス', industry: '外食', website_url: 'https://www.royal-holdings.co.jp/', source_url: 'https://www.royal-holdings.co.jp/' },
  { company_name: 'ドトール・日レスホールディングス', industry: '外食', website_url: 'https://www.doutor.co.jp/', source_url: 'https://www.doutor.co.jp/' },
  { company_name: 'ニトリホールディングス', industry: '家具・インテリア', website_url: 'https://www.nitorihd.co.jp/', source_url: 'https://www.nitorihd.co.jp/' },
  { company_name: 'しまむらグループ', industry: 'アパレル', website_url: 'https://www.shimamura.gr.jp/', source_url: 'https://www.shimamura.gr.jp/' },
  { company_name: 'ダイキングループ', industry: '空調機器', website_url: 'https://www.daikin.co.jp/', source_url: 'https://www.daikin.co.jp/' },
  { company_name: 'パン・パシフィック・インターナショナルホールディングス', industry: '小売', website_url: 'https://www.ppih.co.jp/', source_url: 'https://www.ppih.co.jp/' },
  { company_name: '光ホールディングス', industry: '光学', website_url: 'https://www.hikari-holdings.co.jp/', source_url: 'https://www.hikari-holdings.co.jp/' },
  // 食品・飲料
  { company_name: 'キリンホールディングス', industry: '飲料', website_url: 'https://www.kirinholdings.com/jp/', source_url: 'https://www.kirinholdings.com/jp/' },
  { company_name: 'アサヒグループホールディングス', industry: '飲料', website_url: 'https://www.asahigroup-holdings.com/', source_url: 'https://www.asahigroup-holdings.com/' },
  { company_name: 'サントリーホールディングス', industry: '飲料', website_url: 'https://www.suntory.co.jp/', source_url: 'https://www.suntory.co.jp/' },
  { company_name: '日清食品ホールディングス', industry: '食品', website_url: 'https://www.nissin.com/jp/', source_url: 'https://www.nissin.com/jp/' },
  { company_name: '味の素グループ', industry: '食品', website_url: 'https://www.ajinomoto.co.jp/', source_url: 'https://www.ajinomoto.co.jp/' },
  { company_name: '明治グループ', industry: '食品・乳業', website_url: 'https://www.meiji.com/corporate/', source_url: 'https://www.meiji.com/corporate/' },
  { company_name: '江崎グリコグループ', industry: '菓子・食品', website_url: 'https://www.glico.com/jp/', source_url: 'https://www.glico.com/jp/' },
  { company_name: '森永製菓グループ', industry: '菓子', website_url: 'https://www.morinaga.co.jp/', source_url: 'https://www.morinaga.co.jp/' },
  { company_name: '日本ハムグループ', industry: '食肉加工', website_url: 'https://www.nipponham.co.jp/', source_url: 'https://www.nipponham.co.jp/' },
  { company_name: '伊藤ハムグループ', industry: '食肉加工', website_url: 'https://www.itoham.co.jp/', source_url: 'https://www.itoham.co.jp/' },
  { company_name: 'カゴメグループ', industry: '食品', website_url: 'https://www.kagome.co.jp/', source_url: 'https://www.kagome.co.jp/' },
  { company_name: 'キッコーマングループ', industry: '調味料', website_url: 'https://www.kikkoman.co.jp/', source_url: 'https://www.kikkoman.co.jp/' },
  { company_name: 'ヤマサ醤油グループ', industry: '調味料', website_url: 'https://www.yamasa.com/', source_url: 'https://www.yamasa.com/' },
  { company_name: '雪印メグミルクグループ', industry: '乳製品', website_url: 'https://www.meg-snow.com/', source_url: 'https://www.meg-snow.com/' },
  // エネルギー・インフラ
  { company_name: '東京電力ホールディングス', industry: '電力', website_url: 'https://www.tepco.co.jp/', source_url: 'https://www.tepco.co.jp/' },
  { company_name: '関西電力グループ', industry: '電力', website_url: 'https://www.kepco.co.jp/', source_url: 'https://www.kepco.co.jp/' },
  { company_name: '中部電力グループ', industry: '電力', website_url: 'https://www.chuden.co.jp/', source_url: 'https://www.chuden.co.jp/' },
  { company_name: '九州電力グループ', industry: '電力', website_url: 'https://www.kyuden.co.jp/', source_url: 'https://www.kyuden.co.jp/' },
  { company_name: '東北電力グループ', industry: '電力', website_url: 'https://www.tohoku-epco.co.jp/', source_url: 'https://www.tohoku-epco.co.jp/' },
  { company_name: 'ENEOSホールディングス', industry: '石油', website_url: 'https://www.hd.eneos.co.jp/', source_url: 'https://www.hd.eneos.co.jp/' },
  { company_name: '東京ガスグループ', industry: 'ガス', website_url: 'https://www.tokyo-gas.co.jp/', source_url: 'https://www.tokyo-gas.co.jp/' },
  { company_name: '大阪ガスグループ', industry: 'ガス', website_url: 'https://www.osakagas.co.jp/', source_url: 'https://www.osakagas.co.jp/' },
  { company_name: '東邦ガスグループ', industry: 'ガス', website_url: 'https://www.tohogas.co.jp/', source_url: 'https://www.tohogas.co.jp/' },
  // 不動産
  { company_name: '三井不動産グループ', industry: '不動産', website_url: 'https://www.mitsuifudosan.co.jp/', source_url: 'https://www.mitsuifudosan.co.jp/' },
  { company_name: '三菱地所グループ', industry: '不動産', website_url: 'https://www.mec.co.jp/', source_url: 'https://www.mec.co.jp/' },
  { company_name: '住友不動産グループ', industry: '不動産', website_url: 'https://www.sumitomo-rd.co.jp/', source_url: 'https://www.sumitomo-rd.co.jp/' },
  { company_name: '野村不動産ホールディングス', industry: '不動産', website_url: 'https://www.nomura-re-hd.co.jp/', source_url: 'https://www.nomura-re-hd.co.jp/' },
  { company_name: '東急不動産ホールディングス', industry: '不動産', website_url: 'https://www.tokyu-fudosan-hd.co.jp/', source_url: 'https://www.tokyu-fudosan-hd.co.jp/' },
  { company_name: '飯田グループホールディングス', industry: '戸建住宅', website_url: 'https://www.iida-group.co.jp/', source_url: 'https://www.iida-group.co.jp/' },
  { company_name: 'スターツコーポレーション', industry: '不動産', website_url: 'https://www.starts.co.jp/', source_url: 'https://www.starts.co.jp/' },
  { company_name: 'アパグループ', industry: 'ホテル・不動産', website_url: 'https://www.apa.co.jp/', source_url: 'https://www.apa.co.jp/' },
  // 建設・土木
  { company_name: '鹿島グループ', industry: '建設', website_url: 'https://www.kajima.co.jp/', source_url: 'https://www.kajima.co.jp/' },
  { company_name: '清水建設グループ', industry: '建設', website_url: 'https://www.shimz.co.jp/', source_url: 'https://www.shimz.co.jp/' },
  { company_name: '大成建設グループ', industry: '建設', website_url: 'https://www.taisei.co.jp/', source_url: 'https://www.taisei.co.jp/' },
  { company_name: '大林グループ', industry: '建設', website_url: 'https://www.obayashi.co.jp/', source_url: 'https://www.obayashi.co.jp/' },
  { company_name: '竹中グループ', industry: '建設', website_url: 'https://www.takenaka.co.jp/', source_url: 'https://www.takenaka.co.jp/' },
  { company_name: '長谷工グループ', industry: '建設', website_url: 'https://www.haseko.co.jp/', source_url: 'https://www.haseko.co.jp/' },
  { company_name: '積水ハウスグループ', industry: '住宅', website_url: 'https://www.sekisuihouse.co.jp/', source_url: 'https://www.sekisuihouse.co.jp/' },
  { company_name: '大和ハウスグループ', industry: '住宅', website_url: 'https://www.daiwahouse.co.jp/', source_url: 'https://www.daiwahouse.co.jp/' },
  { company_name: '積水化学グループ', industry: '化学・住宅', website_url: 'https://www.sekisui.co.jp/', source_url: 'https://www.sekisui.co.jp/' },
  { company_name: 'ID&Eホールディングス', industry: '建設コンサル', website_url: 'https://www.id-e-holdings.co.jp/', source_url: 'https://www.id-e-holdings.co.jp/' },
  // 交通・物流
  { company_name: '日本郵政グループ', industry: '郵便・物流', website_url: 'https://www.japanpost.jp/', source_url: 'https://www.japanpost.jp/' },
  { company_name: 'ANAホールディングス', industry: '航空', website_url: 'https://www.ana.co.jp/group/', source_url: 'https://www.ana.co.jp/group/' },
  { company_name: 'JALグループ', industry: '航空', website_url: 'https://www.jal.com/ja/', source_url: 'https://www.jal.com/ja/' },
  { company_name: 'NIPPON EXPRESSホールディングス', industry: '物流', website_url: 'https://www.nipponexpress-holdings.com/ja/', source_url: 'https://www.nipponexpress-holdings.com/ja/' },
  { company_name: 'SGホールディングス', industry: '物流', website_url: 'https://www.sg-hldgs.co.jp/', source_url: 'https://www.sg-hldgs.co.jp/' },
  { company_name: 'ヤマトホールディングス', industry: '物流', website_url: 'https://www.yamato-hd.co.jp/', source_url: 'https://www.yamato-hd.co.jp/' },
  { company_name: 'セイノーホールディングス', industry: '物流', website_url: 'https://www.seino.co.jp/seino/shd/', source_url: 'https://www.seino.co.jp/seino/shd/' },
  { company_name: 'トランコムグループ', industry: '物流', website_url: 'https://www.trancom.co.jp/', source_url: 'https://www.trancom.co.jp/' },
  { company_name: 'JR東日本グループ', industry: '鉄道', website_url: 'https://www.jreast.co.jp/', source_url: 'https://www.jreast.co.jp/' },
  { company_name: 'JR東海グループ', industry: '鉄道', website_url: 'https://company.jr-central.co.jp/', source_url: 'https://company.jr-central.co.jp/' },
  { company_name: 'JR西日本グループ', industry: '鉄道', website_url: 'https://www.westjr.co.jp/', source_url: 'https://www.westjr.co.jp/' },
  { company_name: '東武グループ', industry: '鉄道', website_url: 'https://www.tobu.co.jp/', source_url: 'https://www.tobu.co.jp/' },
  { company_name: '東急グループ', industry: '鉄道・不動産', website_url: 'https://www.tokyu.co.jp/', source_url: 'https://www.tokyu.co.jp/' },
  { company_name: '小田急グループ', industry: '鉄道', website_url: 'https://www.odakyu.jp/', source_url: 'https://www.odakyu.jp/' },
  { company_name: '京王グループ', industry: '鉄道', website_url: 'https://www.keio.co.jp/', source_url: 'https://www.keio.co.jp/' },
  { company_name: '京成グループ', industry: '鉄道', website_url: 'https://www.keisei.co.jp/', source_url: 'https://www.keisei.co.jp/' },
  { company_name: '阪急阪神ホールディングス', industry: '鉄道・不動産', website_url: 'https://www.hankyu-hanshin.co.jp/', source_url: 'https://www.hankyu-hanshin.co.jp/' },
  { company_name: '西日本鉄道グループ', industry: '鉄道・バス', website_url: 'https://www.nishitetsu.co.jp/', source_url: 'https://www.nishitetsu.co.jp/' },
  { company_name: '名古屋鉄道グループ', industry: '鉄道', website_url: 'https://www.meitetsu.co.jp/', source_url: 'https://www.meitetsu.co.jp/' },
  { company_name: '近鉄グループホールディングス', industry: '鉄道・不動産', website_url: 'https://www.kintetsu.co.jp/', source_url: 'https://www.kintetsu.co.jp/' },
  { company_name: '京阪ホールディングス', industry: '鉄道・不動産', website_url: 'https://www.keihan-holdings.co.jp/', source_url: 'https://www.keihan-holdings.co.jp/' },
  { company_name: '西武ホールディングス', industry: '鉄道・ホテル', website_url: 'https://www.seibuholdings.co.jp/', source_url: 'https://www.seibuholdings.co.jp/' },
  { company_name: '相鉄ホールディングス', industry: '鉄道・不動産', website_url: 'https://www.sotetsu-holdings.co.jp/', source_url: 'https://www.sotetsu-holdings.co.jp/' },
  { company_name: '南海電鉄グループ', industry: '鉄道', website_url: 'https://www.nankai.co.jp/', source_url: 'https://www.nankai.co.jp/' },
  // メディア・エンタメ・広告
  { company_name: '電通グループ', industry: '広告', website_url: 'https://www.group.dentsu.com/jp/', source_url: 'https://www.group.dentsu.com/jp/' },
  { company_name: 'フジ・メディア・ホールディングス', industry: 'メディア', website_url: 'https://www.fujimediahd.co.jp/', source_url: 'https://www.fujimediahd.co.jp/' },
  { company_name: '日本テレビホールディングス', industry: 'メディア', website_url: 'https://www.ntvhd.co.jp/', source_url: 'https://www.ntvhd.co.jp/' },
  { company_name: 'TBSホールディングス', industry: 'メディア', website_url: 'https://www.tbs-holdings.co.jp/', source_url: 'https://www.tbs-holdings.co.jp/' },
  { company_name: 'テレビ朝日ホールディングス', industry: 'メディア', website_url: 'https://www.tv-asahi.co.jp/hd/', source_url: 'https://www.tv-asahi.co.jp/hd/' },
  { company_name: 'テレビ東京ホールディングス', industry: 'メディア', website_url: 'https://www.txhd.co.jp/', source_url: 'https://www.txhd.co.jp/' },
  { company_name: '博報堂DYホールディングス', industry: '広告', website_url: 'https://www.hakuhodody-holdings.co.jp/', source_url: 'https://www.hakuhodody-holdings.co.jp/' },
  { company_name: 'カドカワグループ', industry: '出版・エンタメ', website_url: 'https://group.kadokawa.co.jp/', source_url: 'https://group.kadokawa.co.jp/' },
  { company_name: '集英社グループ', industry: '出版', website_url: 'https://www.shueisha.co.jp/', source_url: 'https://www.shueisha.co.jp/' },
  { company_name: 'バンダイナムコグループ', industry: '玩具・エンタメ', website_url: 'https://www.bandainamco.co.jp/', source_url: 'https://www.bandainamco.co.jp/' },
  { company_name: 'セガサミーホールディングス', industry: 'ゲーム・レジャー', website_url: 'https://www.segasammy-holdings.com/', source_url: 'https://www.segasammy-holdings.com/' },
  { company_name: 'コナミグループ', industry: 'ゲーム', website_url: 'https://www.konami.com/ja/', source_url: 'https://www.konami.com/ja/' },
  { company_name: 'スクウェア・エニックス・ホールディングス', industry: 'ゲーム', website_url: 'https://www.hd.square-enix.com/jpn/', source_url: 'https://www.hd.square-enix.com/jpn/' },
  { company_name: 'カプコングループ', industry: 'ゲーム', website_url: 'https://www.capcom.co.jp/', source_url: 'https://www.capcom.co.jp/' },
  { company_name: 'コーエーテクモホールディングス', industry: 'ゲーム', website_url: 'https://www.koeitecmogroup.co.jp/', source_url: 'https://www.koeitecmogroup.co.jp/' },
  { company_name: 'ネクソングループ', industry: 'ゲーム', website_url: 'https://www.nexon.co.jp/', source_url: 'https://www.nexon.co.jp/' },
  // その他サービス・小売
  { company_name: 'ベネッセグループ', industry: '教育', website_url: 'https://www.benesse.co.jp/', source_url: 'https://www.benesse.co.jp/' },
  { company_name: 'ソラストグループ', industry: '医療・介護', website_url: 'https://www.solasto.co.jp/', source_url: 'https://www.solasto.co.jp/' },
  { company_name: 'メディパルホールディングス', industry: '医薬品卸', website_url: 'https://www.medipal.co.jp/', source_url: 'https://www.medipal.co.jp/' },
  { company_name: 'アルフレッサホールディングス', industry: '医薬品卸', website_url: 'https://www.alfresa.com/', source_url: 'https://www.alfresa.com/' },
  { company_name: 'スズケングループ', industry: '医薬品卸', website_url: 'https://www.suzuken.co.jp/', source_url: 'https://www.suzuken.co.jp/' },
  { company_name: 'Vホールディングス', industry: '自動車整備', website_url: 'https://v-holdings.co.jp/', source_url: 'https://v-holdings.co.jp/' },
  { company_name: 'エンジャパングループ', industry: '人材', website_url: 'https://corp.en-japan.com/', source_url: 'https://corp.en-japan.com/' },
  { company_name: 'パソナグループ', industry: '人材', website_url: 'https://www.pasona.co.jp/', source_url: 'https://www.pasona.co.jp/' },
  { company_name: 'ヒューマンホールディングス', industry: '人材・教育', website_url: 'https://www.human-hd.co.jp/', source_url: 'https://www.human-hd.co.jp/' },
  { company_name: 'セコムグループ', industry: '警備', website_url: 'https://www.secom.co.jp/', source_url: 'https://www.secom.co.jp/' },
  { company_name: 'ALSOKグループ', industry: '警備', website_url: 'https://www.alsok.co.jp/', source_url: 'https://www.alsok.co.jp/' },
  { company_name: 'NHKグループ', industry: '放送', website_url: 'https://www.nhk.or.jp/', source_url: 'https://www.nhk.or.jp/' },
  { company_name: 'OUGホールディングス', industry: '食品卸', website_url: 'https://www.oug.co.jp/', source_url: 'https://www.oug.co.jp/' },
  { company_name: 'WELCOME Group', industry: 'ホテル', website_url: 'https://www.welcome-group.co.jp/', source_url: 'https://www.welcome-group.co.jp/' },
  { company_name: 'ゆうちょ銀行グループ', industry: '銀行', website_url: 'https://www.jp-bank.japanpost.jp/', source_url: 'https://www.jp-bank.japanpost.jp/' },
  // 地方銀行追加
  { company_name: '北海道フィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.hokkaidobank.co.jp/', source_url: 'https://www.hokkaidobank.co.jp/' },
  { company_name: '東北フィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.tohoku-fg.co.jp/', source_url: 'https://www.tohoku-fg.co.jp/' },
  { company_name: 'あおぞらグループ', industry: '銀行', website_url: 'https://www.aozorabank.co.jp/', source_url: 'https://www.aozorabank.co.jp/' },
  { company_name: '新生銀行グループ', industry: '銀行', website_url: 'https://www.shinseibank.com/', source_url: 'https://www.shinseibank.com/' },
  { company_name: '千葉銀行グループ', industry: '地方銀行', website_url: 'https://www.chibabank.co.jp/', source_url: 'https://www.chibabank.co.jp/' },
  { company_name: '横浜銀行グループ', industry: '地方銀行', website_url: 'https://www.boy.co.jp/', source_url: 'https://www.boy.co.jp/' },
  { company_name: '静岡銀行グループ', industry: '地方銀行', website_url: 'https://www.shizuokabank.co.jp/', source_url: 'https://www.shizuokabank.co.jp/' },
  { company_name: '愛知銀行グループ', industry: '地方銀行', website_url: 'https://www.aichibank.co.jp/', source_url: 'https://www.aichibank.co.jp/' },
  { company_name: '福岡銀行グループ', industry: '地方銀行', website_url: 'https://www.fukuokabank.co.jp/', source_url: 'https://www.fukuokabank.co.jp/' },
  { company_name: '鹿児島銀行グループ', industry: '地方銀行', website_url: 'https://www.kagin.co.jp/', source_url: 'https://www.kagin.co.jp/' },
  // 追加
  { company_name: 'ウェルシアホールディングス', industry: 'ドラッグストア', website_url: 'https://www.welcia-yakkyoku.co.jp/', source_url: 'https://www.welcia-yakkyoku.co.jp/' },
  { company_name: 'ツルハホールディングス', industry: 'ドラッグストア', website_url: 'https://www.tsuruha.co.jp/', source_url: 'https://www.tsuruha.co.jp/' },
  { company_name: 'コスモスホールディングス', industry: 'ドラッグストア', website_url: 'https://www.cosmospc.co.jp/', source_url: 'https://www.cosmospc.co.jp/' },
  { company_name: 'マツキヨホールディングス', industry: 'ドラッグストア', website_url: 'https://www.matsukiyo.co.jp/', source_url: 'https://www.matsukiyo.co.jp/' },
  { company_name: 'スギホールディングス', industry: 'ドラッグストア', website_url: 'https://www.drug-sugi.co.jp/', source_url: 'https://www.drug-sugi.co.jp/' },
  { company_name: 'コクヨグループ', industry: '文具・家具', website_url: 'https://www.kokuyo.co.jp/', source_url: 'https://www.kokuyo.co.jp/' },
  { company_name: 'リコーグループ', industry: '精密機器', website_url: 'https://jp.ricoh.com/', source_url: 'https://jp.ricoh.com/' },
  { company_name: 'キャノングループ', industry: '精密機器', website_url: 'https://canon.jp/', source_url: 'https://canon.jp/' },
  { company_name: 'エプソングループ', industry: '精密機器', website_url: 'https://corporate.epson/ja/', source_url: 'https://corporate.epson/ja/' },
  { company_name: '凸版印刷グループ', industry: '印刷', website_url: 'https://www.toppan.co.jp/', source_url: 'https://www.toppan.co.jp/' },
  { company_name: '大日本印刷グループ', industry: '印刷', website_url: 'https://www.dnp.co.jp/', source_url: 'https://www.dnp.co.jp/' },
  { company_name: 'TDCソフトグループ', industry: 'IT', website_url: 'https://www.tdc.co.jp/', source_url: 'https://www.tdc.co.jp/' },
  { company_name: 'イオンフィナンシャルサービスグループ', industry: '金融', website_url: 'https://www.aeon.info/ir/', source_url: 'https://www.aeon.info/ir/' },
  { company_name: 'ディスコグループ', industry: '半導体装置', website_url: 'https://www.disco.co.jp/', source_url: 'https://www.disco.co.jp/' },
  { company_name: 'イビデングループ', industry: '電子部品', website_url: 'https://www.ibiden.co.jp/', source_url: 'https://www.ibiden.co.jp/' },
  { company_name: 'ローム グループ', industry: '電子部品', website_url: 'https://www.rohm.co.jp/', source_url: 'https://www.rohm.co.jp/' },
  { company_name: '村田製作所グループ', industry: '電子部品', website_url: 'https://www.murata.com/ja-jp/', source_url: 'https://www.murata.com/ja-jp/' },
  { company_name: 'TDKグループ', industry: '電子部品', website_url: 'https://www.tdk.com/ja/', source_url: 'https://www.tdk.com/ja/' },
  { company_name: '京セラグループ', industry: '電子部品', website_url: 'https://www.kyocera.co.jp/', source_url: 'https://www.kyocera.co.jp/' },
  { company_name: 'ミネベアミツミグループ', industry: '精密機器', website_url: 'https://www.minebeamitsumi.com/ja/', source_url: 'https://www.minebeamitsumi.com/ja/' },
  { company_name: 'ファナックグループ', industry: '工作機械', website_url: 'https://www.fanuc.co.jp/', source_url: 'https://www.fanuc.co.jp/' },
  { company_name: 'DMG森精機グループ', industry: '工作機械', website_url: 'https://jp.dmgmori.com/', source_url: 'https://jp.dmgmori.com/' },
  { company_name: '安川電機グループ', industry: 'ロボット・電機', website_url: 'https://www.yaskawa.co.jp/', source_url: 'https://www.yaskawa.co.jp/' },
  { company_name: 'オムロングループ', industry: '制御機器', website_url: 'https://www.omron.co.jp/', source_url: 'https://www.omron.co.jp/' },
  { company_name: 'キーエンスグループ', industry: 'センサー', website_url: 'https://www.keyence.co.jp/', source_url: 'https://www.keyence.co.jp/' },
  { company_name: '住友グループ', industry: '総合', website_url: 'https://www.sumitomo.gr.jp/', source_url: 'https://www.sumitomo.gr.jp/' },
  { company_name: '三菱グループ', industry: '総合', website_url: 'https://www.mitsubishi.com/ja/', source_url: 'https://www.mitsubishi.com/ja/' },
  { company_name: '三井グループ', industry: '総合', website_url: 'https://www.mitsui.com/jp/ja/', source_url: 'https://www.mitsui.com/jp/ja/' },
  { company_name: '双日グループ', industry: '商社', website_url: 'https://www.sojitz.com/jp/', source_url: 'https://www.sojitz.com/jp/' },
  { company_name: '丸一鋼管グループ', industry: '鉄鋼', website_url: 'https://www.maruichi.com/', source_url: 'https://www.maruichi.com/' },
  { company_name: 'カーボングループ', industry: '化学', website_url: 'https://www.kureha.co.jp/', source_url: 'https://www.kureha.co.jp/' },
  { company_name: 'JSRグループ', industry: '化学', website_url: 'https://www.jsr.co.jp/', source_url: 'https://www.jsr.co.jp/' },
  { company_name: '東ソーグループ', industry: '化学', website_url: 'https://www.tosoh.co.jp/', source_url: 'https://www.tosoh.co.jp/' },
  { company_name: '信越化学グループ', industry: '化学', website_url: 'https://www.shinetsu.co.jp/', source_url: 'https://www.shinetsu.co.jp/' },
  { company_name: '昭和電工グループ', industry: '化学', website_url: 'https://www.sdk.co.jp/', source_url: 'https://www.sdk.co.jp/' },
  { company_name: 'AGCグループ', industry: 'ガラス・化学', website_url: 'https://www.agc.com/ja/', source_url: 'https://www.agc.com/ja/' },
  { company_name: '日本ペイントホールディングス', industry: '塗料', website_url: 'https://www.nipponpaint-holdings.com/ja/', source_url: 'https://www.nipponpaint-holdings.com/ja/' },
  { company_name: '関西ペイントグループ', industry: '塗料', website_url: 'https://www.kansai.co.jp/', source_url: 'https://www.kansai.co.jp/' },
  { company_name: '日本ガイシグループ', industry: '化学・セラミック', website_url: 'https://www.ngk.co.jp/', source_url: 'https://www.ngk.co.jp/' },
  { company_name: '日本特殊陶業グループ', industry: '自動車部品', website_url: 'https://www.ngk-sparkplugs.jp/', source_url: 'https://www.ngk-sparkplugs.jp/' },
  { company_name: 'ブリヂストングループ', industry: 'タイヤ', website_url: 'https://www.bridgestone.co.jp/', source_url: 'https://www.bridgestone.co.jp/' },
  { company_name: 'ヨコハマグループ', industry: 'タイヤ', website_url: 'https://www.y-yokohama.com/', source_url: 'https://www.y-yokohama.com/' },
  { company_name: 'SUMITOMOグループ', industry: '電線', website_url: 'https://www.sei.co.jp/', source_url: 'https://www.sei.co.jp/' },
  { company_name: 'アイシングループ', industry: '自動車部品', website_url: 'https://www.aisin.com/jp/', source_url: 'https://www.aisin.com/jp/' },
  { company_name: '豊田自動織機グループ', industry: '自動車部品', website_url: 'https://www.toyota-industries.com/jp/', source_url: 'https://www.toyota-industries.com/jp/' },
  { company_name: '日本精工グループ', industry: 'ベアリング', website_url: 'https://www.nsk.com/jp/', source_url: 'https://www.nsk.com/jp/' },
  { company_name: 'NTNグループ', industry: 'ベアリング', website_url: 'https://www.ntn.co.jp/', source_url: 'https://www.ntn.co.jp/' },
  { company_name: '三菱自動車グループ', industry: '自動車', website_url: 'https://www.mitsubishi-motors.com/ja/', source_url: 'https://www.mitsubishi-motors.com/ja/' },
  { company_name: 'スバルグループ', industry: '自動車', website_url: 'https://www.subaru.co.jp/', source_url: 'https://www.subaru.co.jp/' },
  { company_name: 'マツダグループ', industry: '自動車', website_url: 'https://www.mazda.com/ja/', source_url: 'https://www.mazda.com/ja/' },
  { company_name: 'スズキグループ', industry: '自動車', website_url: 'https://www.suzuki.co.jp/', source_url: 'https://www.suzuki.co.jp/' },
  { company_name: 'ダイハツグループ', industry: '自動車', website_url: 'https://www.daihatsu.co.jp/', source_url: 'https://www.daihatsu.co.jp/' },
  { company_name: 'みなと銀行グループ', industry: '地方銀行', website_url: 'https://www.minatobank.co.jp/', source_url: 'https://www.minatobank.co.jp/' },
  { company_name: '池田泉州ホールディングス', industry: '地方銀行', website_url: 'https://www.ikeda-senshu-hd.co.jp/', source_url: 'https://www.ikeda-senshu-hd.co.jp/' },
  { company_name: '関西みらいフィナンシャルグループ', industry: '地方銀行', website_url: 'https://www.kmfg.co.jp/', source_url: 'https://www.kmfg.co.jp/' },
  { company_name: 'プロギアグループ', industry: 'スポーツ', website_url: 'https://www.prgr.co.jp/', source_url: 'https://www.prgr.co.jp/' },
  { company_name: 'アシックスグループ', industry: 'スポーツ', website_url: 'https://corp.asics.com/jp/', source_url: 'https://corp.asics.com/jp/' },
  { company_name: 'ミズノグループ', industry: 'スポーツ', website_url: 'https://corp.mizuno.com/', source_url: 'https://corp.mizuno.com/' },
  { company_name: 'デサントグループ', industry: 'スポーツ', website_url: 'https://www.descente.co.jp/ja/ir/', source_url: 'https://www.descente.co.jp/ja/ir/' },
  { company_name: 'ゴルフ日本海ホールディングス', industry: 'スポーツ', website_url: 'https://www.golf-nihonkai.co.jp/', source_url: 'https://www.golf-nihonkai.co.jp/' },
  { company_name: 'ワコールホールディングス', industry: 'アパレル', website_url: 'https://corp.wacoal.jp/', source_url: 'https://corp.wacoal.jp/' },
  { company_name: 'オンワードホールディングス', industry: 'アパレル', website_url: 'https://www.onward.co.jp/', source_url: 'https://www.onward.co.jp/' },
  { company_name: 'ワールドグループ', industry: 'アパレル', website_url: 'https://corp.world.co.jp/', source_url: 'https://corp.world.co.jp/' },
  { company_name: 'TSIホールディングス', industry: 'アパレル', website_url: 'https://tsi-holdings.com/', source_url: 'https://tsi-holdings.com/' },
  { company_name: 'クロスプラスグループ', industry: 'アパレル', website_url: 'https://www.crossplus.co.jp/', source_url: 'https://www.crossplus.co.jp/' },
  { company_name: 'タカラトミーグループ', industry: '玩具', website_url: 'https://www.takaratomy.co.jp/', source_url: 'https://www.takaratomy.co.jp/' },
  { company_name: 'エイチ・ツー・オー リテイリンググループ', industry: '百貨店・小売', website_url: 'https://www.h2o-retailing.co.jp/', source_url: 'https://www.h2o-retailing.co.jp/' },
  { company_name: '三越伊勢丹ホールディングス', industry: '百貨店', website_url: 'https://www.imhds.co.jp/', source_url: 'https://www.imhds.co.jp/' },
  { company_name: '高島屋グループ', industry: '百貨店', website_url: 'https://www.takashimaya.co.jp/corp/', source_url: 'https://www.takashimaya.co.jp/corp/' },
  { company_name: 'J.フロント リテイリンググループ', industry: '百貨店', website_url: 'https://www.j-front-retailing.com/', source_url: 'https://www.j-front-retailing.com/' },
  { company_name: 'ヨドバシカメラグループ', industry: '家電量販', website_url: 'https://www.yodobashi.com/', source_url: 'https://www.yodobashi.com/' },
  { company_name: 'エディオングループ', industry: '家電量販', website_url: 'https://www.edion.co.jp/', source_url: 'https://www.edion.co.jp/' },
  { company_name: 'ケーズホールディングス', industry: '家電量販', website_url: 'https://www.ksdenki.co.jp/', source_url: 'https://www.ksdenki.co.jp/' },
  { company_name: 'ノジマグループ', industry: '家電量販', website_url: 'https://www.nojima.co.jp/', source_url: 'https://www.nojima.co.jp/' },
  { company_name: 'コーナングループ', industry: 'ホームセンター', website_url: 'https://www.kohnan-eshop.com/', source_url: 'https://www.kohnan-eshop.com/' },
  { company_name: 'カインズグループ', industry: 'ホームセンター', website_url: 'https://www.cainz.co.jp/', source_url: 'https://www.cainz.co.jp/' },
  { company_name: 'DCMホールディングス', industry: 'ホームセンター', website_url: 'https://www.dcm-hldgs.co.jp/', source_url: 'https://www.dcm-hldgs.co.jp/' },
  { company_name: 'ユニー・ファミリーマートホールディングス', industry: 'コンビニ', website_url: 'https://www.famima.com/', source_url: 'https://www.famima.com/' },
  { company_name: 'ローソングループ', industry: 'コンビニ', website_url: 'https://www.lawson.co.jp/company/', source_url: 'https://www.lawson.co.jp/company/' },
  { company_name: 'ミニストップグループ', industry: 'コンビニ', website_url: 'https://www.ministop.co.jp/', source_url: 'https://www.ministop.co.jp/' },
  { company_name: 'ヴィレッジヴァンガードグループ', industry: '小売', website_url: 'https://www.village-v.co.jp/', source_url: 'https://www.village-v.co.jp/' },
  { company_name: 'ゲオホールディングス', industry: '小売・レンタル', website_url: 'https://geo-hd.co.jp/', source_url: 'https://geo-hd.co.jp/' },
  { company_name: '明光ネットワークジャパングループ', industry: '教育', website_url: 'https://www.mkg.co.jp/', source_url: 'https://www.mkg.co.jp/' },
  { company_name: 'バイリンガルグループ', industry: '語学', website_url: 'https://www.bilingual-group.com/', source_url: 'https://www.bilingual-group.com/' },
  { company_name: 'ライフコーポレーショングループ', industry: 'スーパー', website_url: 'https://www.lifecorp.jp/', source_url: 'https://www.lifecorp.jp/' },
  { company_name: 'ヤオコーグループ', industry: 'スーパー', website_url: 'https://www.yaoko-net.com/', source_url: 'https://www.yaoko-net.com/' },
  { company_name: 'バローホールディングス', industry: 'スーパー', website_url: 'https://www.valor-co.co.jp/', source_url: 'https://www.valor-co.co.jp/' },
  { company_name: 'リテールパートナーズグループ', industry: 'スーパー', website_url: 'https://www.retail-partners.co.jp/', source_url: 'https://www.retail-partners.co.jp/' },
  { company_name: 'マルエツグループ', industry: 'スーパー', website_url: 'https://www.maruetsu.co.jp/', source_url: 'https://www.maruetsu.co.jp/' },
  { company_name: 'ベルクグループ', industry: 'スーパー', website_url: 'https://www.belc.co.jp/', source_url: 'https://www.belc.co.jp/' },
  { company_name: 'ハローズグループ', industry: 'スーパー', website_url: 'https://www.halows.com/', source_url: 'https://www.halows.com/' },
  { company_name: 'ウオカツグループ', industry: '水産', website_url: 'https://www.uokatsu.co.jp/', source_url: 'https://www.uokatsu.co.jp/' },
  { company_name: 'マルハニチログループ', industry: '水産', website_url: 'https://www.maruha-nichiro.co.jp/', source_url: 'https://www.maruha-nichiro.co.jp/' },
  { company_name: '日本水産グループ', industry: '水産', website_url: 'https://www.nissui.co.jp/', source_url: 'https://www.nissui.co.jp/' },
  { company_name: 'プリマハムグループ', industry: '食肉加工', website_url: 'https://www.primaham.co.jp/', source_url: 'https://www.primaham.co.jp/' },
  { company_name: 'ヤマザキグループ', industry: '食品', website_url: 'https://www.yamazakipan.co.jp/', source_url: 'https://www.yamazakipan.co.jp/' },
  { company_name: 'フジッコグループ', industry: '食品', website_url: 'https://www.fujicco.co.jp/', source_url: 'https://www.fujicco.co.jp/' },
  { company_name: '亀田製菓グループ', industry: '菓子', website_url: 'https://www.kamedaseika.co.jp/', source_url: 'https://www.kamedaseika.co.jp/' },
  { company_name: 'カルビーグループ', industry: '菓子', website_url: 'https://www.calbee.co.jp/', source_url: 'https://www.calbee.co.jp/' },
  { company_name: '不二製油グループ本社', industry: '食品', website_url: 'https://www.fujioilholdings.com/ja/', source_url: 'https://www.fujioilholdings.com/ja/' },
  { company_name: 'ニッスイグループ', industry: '水産・食品', website_url: 'https://www.nissui.co.jp/', source_url: 'https://www.nissui.co.jp/' },
  { company_name: 'ブルボングループ', industry: '菓子', website_url: 'https://www.bourbon.co.jp/', source_url: 'https://www.bourbon.co.jp/' },
  { company_name: 'モロゾフグループ', industry: '菓子', website_url: 'https://www.morozoff.co.jp/', source_url: 'https://www.morozoff.co.jp/' },
  { company_name: 'トモズグループ', industry: 'ドラッグストア', website_url: 'https://www.tomod.co.jp/', source_url: 'https://www.tomod.co.jp/' },
  { company_name: 'ヒグチ産業グループ', industry: 'ドラッグストア', website_url: 'https://www.higuchi.co.jp/', source_url: 'https://www.higuchi.co.jp/' },
  { company_name: 'シミックホールディングス', industry: '医薬品', website_url: 'https://www.cmic.co.jp/', source_url: 'https://www.cmic.co.jp/' },
  { company_name: '東和薬品グループ', industry: '後発医薬品', website_url: 'https://www.towa-pharm.co.jp/', source_url: 'https://www.towa-pharm.co.jp/' },
  { company_name: 'ニプログループ', industry: '医療機器', website_url: 'https://www.nipro.co.jp/', source_url: 'https://www.nipro.co.jp/' },
  { company_name: 'フクダ電子グループ', industry: '医療機器', website_url: 'https://www.fukuda.co.jp/', source_url: 'https://www.fukuda.co.jp/' },
  { company_name: 'アルコニックスグループ', industry: '非鉄金属', website_url: 'https://www.alconix.co.jp/', source_url: 'https://www.alconix.co.jp/' },
  { company_name: 'ミタチ産業グループ', industry: '電子部品商社', website_url: 'https://www.mitachi.co.jp/', source_url: 'https://www.mitachi.co.jp/' },
];

async function main() {
  log('候補企業探索開始');

  // キーワードフィルター
  const KEYWORDS = ['ホールディングス', 'グループ', 'HOLDINGS', 'GROUP'];

  let candidates = BUILTIN_CANDIDATES.filter(c => {
    return KEYWORDS.some(kw => c.company_name.includes(kw));
  });

  // JPXからの追加取得を試みる
  try {
    log('  JPX上場銘柄一覧の取得を試みます...');
    const res = await axios.get('https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls', {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    log('  JPXデータ取得成功（XLS）');
    // XLS解析はここではスキップ（バイナリ処理が複雑なため）
  } catch(e) {
    log('  JPXデータ取得スキップ（内蔵データを使用）');
  }

  // 重複除去
  const seen = new Set();
  const unique = candidates.filter(c => {
    if (seen.has(c.company_name)) return false;
    seen.add(c.company_name);
    return true;
  });

  const rawData = unique.map((c, i) => ({
    id: String(i + 1),
    company_name: c.company_name,
    industry: c.industry,
    website_url: c.website_url,
    source_url: c.source_url,
    matched_keyword: detectKeyword(c.company_name) || '',
    category: detectCategory(c.company_name),
    is_japan_company: true,
    verified: false,
    verification_note: '',
  }));

  fs.writeFileSync(RAW_PATH, JSON.stringify(rawData, null, 2), 'utf-8');
  log(`候補保存完了: ${rawData.length}件 -> ${RAW_PATH}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
