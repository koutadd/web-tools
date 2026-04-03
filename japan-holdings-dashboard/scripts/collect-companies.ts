import * as fs from 'fs';
import * as path from 'path';

interface Company {
  id: string;
  company_name: string;
  company_name_kana: string;
  category: 'holding' | 'group';
  industry: string;
  note: string;
  website_url: string;
  source_url: string;
  is_japan_company: boolean;
  ranking_priority: number;
  collected_at: string;
}

const companies: Company[] = [
  {
    id: "1",
    company_name: "ソフトバンクグループ",
    company_name_kana: "そふとばんくぐるーぷ",
    category: "group",
    industry: "通信・投資",
    note: "孫正義氏が創業した日本最大級のテクノロジー投資持株会社",
    website_url: "https://www.softbank.jp/corp/",
    source_url: "https://www.softbank.jp/corp/",
    is_japan_company: true,
    ranking_priority: 1,
    collected_at: new Date().toISOString()
  },
  {
    id: "2",
    company_name: "三菱UFJフィナンシャル・グループ",
    company_name_kana: "みつびしゆーえふじぇいふぁいなんしゃるぐるーぷ",
    category: "group",
    industry: "金融・銀行",
    note: "日本最大の金融グループ",
    website_url: "https://www.mufg.jp/",
    source_url: "https://www.mufg.jp/",
    is_japan_company: true,
    ranking_priority: 2,
    collected_at: new Date().toISOString()
  },
  {
    id: "3",
    company_name: "トヨタ自動車",
    company_name_kana: "とよたじどうしゃ",
    category: "group",
    industry: "自動車",
    note: "世界最大級の自動車メーカー、トヨタグループの中核",
    website_url: "https://global.toyota/jp/",
    source_url: "https://global.toyota/jp/",
    is_japan_company: true,
    ranking_priority: 3,
    collected_at: new Date().toISOString()
  },
  {
    id: "4",
    company_name: "NTTホールディングス",
    company_name_kana: "えぬてぃーてぃーほーるでぃんぐす",
    category: "holding",
    industry: "通信",
    note: "日本電信電話グループの持株会社",
    website_url: "https://www.ntt.com/",
    source_url: "https://www.ntt.com/",
    is_japan_company: true,
    ranking_priority: 4,
    collected_at: new Date().toISOString()
  },
  {
    id: "5",
    company_name: "三井住友フィナンシャルグループ",
    company_name_kana: "みついすみともふぁいなんしゃるぐるーぷ",
    category: "group",
    industry: "金融・銀行",
    note: "三井住友銀行を中核とする金融グループ",
    website_url: "https://www.smfg.co.jp/",
    source_url: "https://www.smfg.co.jp/",
    is_japan_company: true,
    ranking_priority: 5,
    collected_at: new Date().toISOString()
  },
  {
    id: "6",
    company_name: "みずほフィナンシャルグループ",
    company_name_kana: "みずほふぁいなんしゃるぐるーぷ",
    category: "group",
    industry: "金融・銀行",
    note: "みずほ銀行を中核とする金融グループ",
    website_url: "https://www.mizuho-fg.co.jp/",
    source_url: "https://www.mizuho-fg.co.jp/",
    is_japan_company: true,
    ranking_priority: 6,
    collected_at: new Date().toISOString()
  },
  {
    id: "7",
    company_name: "日立製作所グループ",
    company_name_kana: "ひたちせいさくしょぐるーぷ",
    category: "group",
    industry: "電機・製造",
    note: "インフラ・デジタル事業を中核とする総合電機グループ",
    website_url: "https://www.hitachi.co.jp/",
    source_url: "https://www.hitachi.co.jp/",
    is_japan_company: true,
    ranking_priority: 7,
    collected_at: new Date().toISOString()
  },
  {
    id: "8",
    company_name: "パナソニックホールディングス",
    company_name_kana: "ぱなそにっくほーるでぃんぐす",
    category: "holding",
    industry: "電機・家電",
    note: "総合電機メーカー。2022年に持株会社体制へ移行",
    website_url: "https://holdings.panasonic/jp/",
    source_url: "https://holdings.panasonic/jp/",
    is_japan_company: true,
    ranking_priority: 8,
    collected_at: new Date().toISOString()
  },
  {
    id: "9",
    company_name: "ソニーグループ",
    company_name_kana: "そにーぐるーぷ",
    category: "group",
    industry: "電機・エンタメ",
    note: "エレクトロニクス・エンタテインメントの多国籍コングロマリット",
    website_url: "https://www.sony.com/ja/",
    source_url: "https://www.sony.com/ja/",
    is_japan_company: true,
    ranking_priority: 9,
    collected_at: new Date().toISOString()
  },
  {
    id: "10",
    company_name: "三菱商事グループ",
    company_name_kana: "みつびししょうじぐるーぷ",
    category: "group",
    industry: "総合商社",
    note: "日本最大の総合商社グループ",
    website_url: "https://www.mitsubishicorp.com/jp/ja/",
    source_url: "https://www.mitsubishicorp.com/jp/ja/",
    is_japan_company: true,
    ranking_priority: 10,
    collected_at: new Date().toISOString()
  },
  {
    id: "11",
    company_name: "伊藤忠商事グループ",
    company_name_kana: "いとうちゅうしょうじぐるーぷ",
    category: "group",
    industry: "総合商社",
    note: "繊維・食料・金属等幅広い事業を持つ総合商社",
    website_url: "https://www.itochu.co.jp/ja/",
    source_url: "https://www.itochu.co.jp/ja/",
    is_japan_company: true,
    ranking_priority: 11,
    collected_at: new Date().toISOString()
  },
  {
    id: "12",
    company_name: "住友グループ",
    company_name_kana: "すみともぐるーぷ",
    category: "group",
    industry: "総合",
    note: "住友商事・住友金属等から構成される財閥系グループ",
    website_url: "https://www.sumitomo.gr.jp/",
    source_url: "https://www.sumitomo.gr.jp/",
    is_japan_company: true,
    ranking_priority: 12,
    collected_at: new Date().toISOString()
  },
  {
    id: "13",
    company_name: "セブン&アイ・ホールディングス",
    company_name_kana: "せぶんあんどあいほーるでぃんぐす",
    category: "holding",
    industry: "小売・流通",
    note: "セブン-イレブン・イトーヨーカドー等を傘下に持つ",
    website_url: "https://www.7andi.com/",
    source_url: "https://www.7andi.com/",
    is_japan_company: true,
    ranking_priority: 13,
    collected_at: new Date().toISOString()
  },
  {
    id: "14",
    company_name: "イオングループ",
    company_name_kana: "いおんぐるーぷ",
    category: "group",
    industry: "小売・流通",
    note: "日本最大の流通グループ。イオン・マックスバリュ等を傘下に持つ",
    website_url: "https://www.aeon.info/",
    source_url: "https://www.aeon.info/",
    is_japan_company: true,
    ranking_priority: 14,
    collected_at: new Date().toISOString()
  },
  {
    id: "15",
    company_name: "富士通グループ",
    company_name_kana: "ふじつうぐるーぷ",
    category: "group",
    industry: "IT・情報通信",
    note: "日本最大のITサービスグループ",
    website_url: "https://www.fujitsu.com/jp/",
    source_url: "https://www.fujitsu.com/jp/",
    is_japan_company: true,
    ranking_priority: 15,
    collected_at: new Date().toISOString()
  },
  {
    id: "16",
    company_name: "NEC（日本電気）グループ",
    company_name_kana: "にっぽんでんきぐるーぷ",
    category: "group",
    industry: "IT・電機",
    note: "IT・通信インフラを手がける総合電機グループ",
    website_url: "https://jpn.nec.com/",
    source_url: "https://jpn.nec.com/",
    is_japan_company: true,
    ranking_priority: 16,
    collected_at: new Date().toISOString()
  },
  {
    id: "17",
    company_name: "武田薬品工業グループ",
    company_name_kana: "たけだやっぴんこうぎょうぐるーぷ",
    category: "group",
    industry: "製薬",
    note: "日本最大の製薬グループ",
    website_url: "https://www.takeda.com/ja-jp/",
    source_url: "https://www.takeda.com/ja-jp/",
    is_japan_company: true,
    ranking_priority: 17,
    collected_at: new Date().toISOString()
  },
  {
    id: "18",
    company_name: "オリックスグループ",
    company_name_kana: "おりっくすぐるーぷ",
    category: "group",
    industry: "金融・リース",
    note: "リース・金融・不動産など多角経営の総合金融グループ",
    website_url: "https://www.orix.co.jp/grp/",
    source_url: "https://www.orix.co.jp/grp/",
    is_japan_company: true,
    ranking_priority: 18,
    collected_at: new Date().toISOString()
  },
  {
    id: "19",
    company_name: "楽天グループ",
    company_name_kana: "らくてんぐるーぷ",
    category: "group",
    industry: "EC・IT・通信",
    note: "EC・金融・通信を展開するインターネット総合グループ",
    website_url: "https://global.rakuten.com/corp/",
    source_url: "https://global.rakuten.com/corp/",
    is_japan_company: true,
    ranking_priority: 19,
    collected_at: new Date().toISOString()
  },
  {
    id: "20",
    company_name: "JFEホールディングス",
    company_name_kana: "じぇいえふいーほーるでぃんぐす",
    category: "holding",
    industry: "鉄鋼",
    note: "川崎製鉄とNKKが合併して設立した鉄鋼持株会社",
    website_url: "https://www.jfe-holdings.co.jp/",
    source_url: "https://www.jfe-holdings.co.jp/",
    is_japan_company: true,
    ranking_priority: 20,
    collected_at: new Date().toISOString()
  },
  {
    id: "21",
    company_name: "日本郵政グループ",
    company_name_kana: "にほんゆうせいぐるーぷ",
    category: "group",
    industry: "郵便・物流・金融",
    note: "郵便・ゆうちょ銀行・かんぽ生命を傘下に持つ",
    website_url: "https://www.japanpost.jp/",
    source_url: "https://www.japanpost.jp/",
    is_japan_company: true,
    ranking_priority: 21,
    collected_at: new Date().toISOString()
  },
  {
    id: "22",
    company_name: "ENEOSホールディングス",
    company_name_kana: "えねおすほーるでぃんぐす",
    category: "holding",
    industry: "石油・エネルギー",
    note: "日本最大の石油精製・販売グループ",
    website_url: "https://www.hd.eneos.co.jp/",
    source_url: "https://www.hd.eneos.co.jp/",
    is_japan_company: true,
    ranking_priority: 22,
    collected_at: new Date().toISOString()
  },
  {
    id: "23",
    company_name: "日本製鉄グループ",
    company_name_kana: "にほんせいてつぐるーぷ",
    category: "group",
    industry: "鉄鋼",
    note: "日本最大の鉄鋼メーカーグループ",
    website_url: "https://www.nipponsteel.com/",
    source_url: "https://www.nipponsteel.com/",
    is_japan_company: true,
    ranking_priority: 23,
    collected_at: new Date().toISOString()
  },
  {
    id: "24",
    company_name: "東京電力ホールディングス",
    company_name_kana: "とうきょうでんりょくほーるでぃんぐす",
    category: "holding",
    industry: "電力",
    note: "日本最大の電力会社グループ",
    website_url: "https://www.tepco.co.jp/",
    source_url: "https://www.tepco.co.jp/",
    is_japan_company: true,
    ranking_priority: 24,
    collected_at: new Date().toISOString()
  },
  {
    id: "25",
    company_name: "関西電力グループ",
    company_name_kana: "かんさいでんりょくぐるーぷ",
    category: "group",
    industry: "電力",
    note: "関西圏を中心とする電力・エネルギーグループ",
    website_url: "https://www.kepco.co.jp/",
    source_url: "https://www.kepco.co.jp/",
    is_japan_company: true,
    ranking_priority: 25,
    collected_at: new Date().toISOString()
  },
  {
    id: "26",
    company_name: "丸紅グループ",
    company_name_kana: "まるべにぐるーぷ",
    category: "group",
    industry: "総合商社",
    note: "食料・電力・インフラ等を手がける総合商社グループ",
    website_url: "https://www.marubeni.com/jp/",
    source_url: "https://www.marubeni.com/jp/",
    is_japan_company: true,
    ranking_priority: 26,
    collected_at: new Date().toISOString()
  },
  {
    id: "27",
    company_name: "住友商事グループ",
    company_name_kana: "すみともしょうじぐるーぷ",
    category: "group",
    industry: "総合商社",
    note: "金属・インフラ・メディア等に強みを持つ総合商社",
    website_url: "https://www.sumitomocorp.com/ja/jp/",
    source_url: "https://www.sumitomocorp.com/ja/jp/",
    is_japan_company: true,
    ranking_priority: 27,
    collected_at: new Date().toISOString()
  },
  {
    id: "28",
    company_name: "三井物産グループ",
    company_name_kana: "みついぶっさんぐるーぷ",
    category: "group",
    industry: "総合商社",
    note: "エネルギー・鉄鋼・化学等に強みを持つ総合商社",
    website_url: "https://www.mitsui.com/jp/ja/",
    source_url: "https://www.mitsui.com/jp/ja/",
    is_japan_company: true,
    ranking_priority: 28,
    collected_at: new Date().toISOString()
  },
  {
    id: "29",
    company_name: "三菱電機グループ",
    company_name_kana: "みつびしでんきぐるーぷ",
    category: "group",
    industry: "電機・製造",
    note: "FA・空調・社会システム等に強みを持つ総合電機グループ",
    website_url: "https://www.mitsubishielectric.co.jp/",
    source_url: "https://www.mitsubishielectric.co.jp/",
    is_japan_company: true,
    ranking_priority: 29,
    collected_at: new Date().toISOString()
  },
  {
    id: "30",
    company_name: "キリンホールディングス",
    company_name_kana: "きりんほーるでぃんぐす",
    category: "holding",
    industry: "食品・飲料",
    note: "ビール・飲料・医薬品事業を展開する持株会社",
    website_url: "https://www.kirinholdings.com/jp/",
    source_url: "https://www.kirinholdings.com/jp/",
    is_japan_company: true,
    ranking_priority: 30,
    collected_at: new Date().toISOString()
  },
  {
    id: "31",
    company_name: "アサヒグループホールディングス",
    company_name_kana: "あさひぐるーぷほーるでぃんぐす",
    category: "holding",
    industry: "食品・飲料",
    note: "アサヒビール・カルピス等を傘下に持つ飲料持株会社",
    website_url: "https://www.asahigroup-holdings.com/",
    source_url: "https://www.asahigroup-holdings.com/",
    is_japan_company: true,
    ranking_priority: 31,
    collected_at: new Date().toISOString()
  },
  {
    id: "32",
    company_name: "サントリーホールディングス",
    company_name_kana: "さんとりーほーるでぃんぐす",
    category: "holding",
    industry: "食品・飲料",
    note: "ウイスキー・ビール・清涼飲料を展開する飲料グループ持株会社",
    website_url: "https://www.suntory.co.jp/",
    source_url: "https://www.suntory.co.jp/",
    is_japan_company: true,
    ranking_priority: 32,
    collected_at: new Date().toISOString()
  },
  {
    id: "33",
    company_name: "日清食品ホールディングス",
    company_name_kana: "にっしんしょくひんほーるでぃんぐす",
    category: "holding",
    industry: "食品",
    note: "カップヌードル等を展開するインスタント食品持株会社",
    website_url: "https://www.nissin.com/jp/",
    source_url: "https://www.nissin.com/jp/",
    is_japan_company: true,
    ranking_priority: 33,
    collected_at: new Date().toISOString()
  },
  {
    id: "34",
    company_name: "ホンダグループ",
    company_name_kana: "ほんだぐるーぷ",
    category: "group",
    industry: "自動車・二輪",
    note: "四輪・二輪・航空機エンジン等を手がける総合輸送機グループ",
    website_url: "https://www.honda.co.jp/",
    source_url: "https://www.honda.co.jp/",
    is_japan_company: true,
    ranking_priority: 34,
    collected_at: new Date().toISOString()
  },
  {
    id: "35",
    company_name: "日産自動車グループ",
    company_name_kana: "にっさんじどうしゃぐるーぷ",
    category: "group",
    industry: "自動車",
    note: "ルノー・三菱自動車とのアライアンスを組む自動車グループ",
    website_url: "https://www.nissan-global.com/JP/",
    source_url: "https://www.nissan-global.com/JP/",
    is_japan_company: true,
    ranking_priority: 35,
    collected_at: new Date().toISOString()
  },
  {
    id: "36",
    company_name: "デンソーグループ",
    company_name_kana: "でんそーぐるーぷ",
    category: "group",
    industry: "自動車部品",
    note: "トヨタ系の世界最大級の自動車部品グループ",
    website_url: "https://www.denso.com/jp/ja/",
    source_url: "https://www.denso.com/jp/ja/",
    is_japan_company: true,
    ranking_priority: 36,
    collected_at: new Date().toISOString()
  },
  {
    id: "37",
    company_name: "リクルートホールディングス",
    company_name_kana: "りくるーとほーるでぃんぐす",
    category: "holding",
    industry: "HR・メディア・IT",
    note: "求人・不動産・旅行・結婚等多様な情報メディアを持つ持株会社",
    website_url: "https://recruit-holdings.com/ja/",
    source_url: "https://recruit-holdings.com/ja/",
    is_japan_company: true,
    ranking_priority: 37,
    collected_at: new Date().toISOString()
  },
  {
    id: "38",
    company_name: "電通グループ",
    company_name_kana: "でんつうぐるーぷ",
    category: "group",
    industry: "広告・マーケティング",
    note: "日本最大の広告代理店を中核とする国際広告グループ",
    website_url: "https://www.group.dentsu.com/jp/",
    source_url: "https://www.group.dentsu.com/jp/",
    is_japan_company: true,
    ranking_priority: 38,
    collected_at: new Date().toISOString()
  },
  {
    id: "39",
    company_name: "野村ホールディングス",
    company_name_kana: "のむらほーるでぃんぐす",
    category: "holding",
    industry: "証券・金融",
    note: "日本最大の証券会社グループの持株会社",
    website_url: "https://www.nomura.co.jp/",
    source_url: "https://www.nomura.co.jp/",
    is_japan_company: true,
    ranking_priority: 39,
    collected_at: new Date().toISOString()
  },
  {
    id: "40",
    company_name: "大和証券グループ本社",
    company_name_kana: "だいわしょうけんぐるーぷほんしゃ",
    category: "group",
    industry: "証券・金融",
    note: "大和証券を中核とする証券金融グループ",
    website_url: "https://www.daiwa-grp.jp/",
    source_url: "https://www.daiwa-grp.jp/",
    is_japan_company: true,
    ranking_priority: 40,
    collected_at: new Date().toISOString()
  },
  {
    id: "41",
    company_name: "東京ガスグループ",
    company_name_kana: "とうきょうがすぐるーぷ",
    category: "group",
    industry: "ガス・エネルギー",
    note: "都市ガス最大手を中核とするエネルギーグループ",
    website_url: "https://www.tokyo-gas.co.jp/",
    source_url: "https://www.tokyo-gas.co.jp/",
    is_japan_company: true,
    ranking_priority: 41,
    collected_at: new Date().toISOString()
  },
  {
    id: "42",
    company_name: "大阪ガスグループ",
    company_name_kana: "おおさかがすぐるーぷ",
    category: "group",
    industry: "ガス・エネルギー",
    note: "関西圏最大のガスグループ。Daigasグループとも呼ばれる",
    website_url: "https://www.osakagas.co.jp/",
    source_url: "https://www.osakagas.co.jp/",
    is_japan_company: true,
    ranking_priority: 42,
    collected_at: new Date().toISOString()
  },
  {
    id: "43",
    company_name: "ANAホールディングス",
    company_name_kana: "えーえぬえーほーるでぃんぐす",
    category: "holding",
    industry: "航空・運輸",
    note: "全日本空輸を傘下に持つ航空グループ持株会社",
    website_url: "https://www.ana.co.jp/group/",
    source_url: "https://www.ana.co.jp/group/",
    is_japan_company: true,
    ranking_priority: 43,
    collected_at: new Date().toISOString()
  },
  {
    id: "44",
    company_name: "JALグループ",
    company_name_kana: "じゃるぐるーぷ",
    category: "group",
    industry: "航空・運輸",
    note: "日本航空を中核とする航空グループ",
    website_url: "https://www.jal.com/ja/",
    source_url: "https://www.jal.com/ja/",
    is_japan_company: true,
    ranking_priority: 44,
    collected_at: new Date().toISOString()
  },
  {
    id: "45",
    company_name: "JR東日本グループ",
    company_name_kana: "じぇいあーるひがしにほんぐるーぷ",
    category: "group",
    industry: "鉄道・交通",
    note: "東日本旅客鉄道を中核とする交通・流通グループ",
    website_url: "https://www.jreast.co.jp/",
    source_url: "https://www.jreast.co.jp/",
    is_japan_company: true,
    ranking_priority: 45,
    collected_at: new Date().toISOString()
  },
  {
    id: "46",
    company_name: "住友不動産グループ",
    company_name_kana: "すみともふどうさんぐるーぷ",
    category: "group",
    industry: "不動産",
    note: "オフィスビル・マンション等を展開する大手不動産グループ",
    website_url: "https://www.sumitomo-rd.co.jp/",
    source_url: "https://www.sumitomo-rd.co.jp/",
    is_japan_company: true,
    ranking_priority: 46,
    collected_at: new Date().toISOString()
  },
  {
    id: "47",
    company_name: "三井不動産グループ",
    company_name_kana: "みついふどうさんぐるーぷ",
    category: "group",
    industry: "不動産",
    note: "商業施設・オフィス・住宅等を展開する大手不動産グループ",
    website_url: "https://www.mitsuifudosan.co.jp/",
    source_url: "https://www.mitsuifudosan.co.jp/",
    is_japan_company: true,
    ranking_priority: 47,
    collected_at: new Date().toISOString()
  },
  {
    id: "48",
    company_name: "SOMPOホールディングス",
    company_name_kana: "そんぽほーるでぃんぐす",
    category: "holding",
    industry: "保険",
    note: "損害保険ジャパン等を傘下に持つ保険持株会社",
    website_url: "https://www.sompo-hd.com/",
    source_url: "https://www.sompo-hd.com/",
    is_japan_company: true,
    ranking_priority: 48,
    collected_at: new Date().toISOString()
  },
  {
    id: "49",
    company_name: "東京海上ホールディングス",
    company_name_kana: "とうきょうかいじょうほーるでぃんぐす",
    category: "holding",
    industry: "保険",
    note: "東京海上日動火災保険等を傘下に持つ保険持株会社",
    website_url: "https://www.tokiomarinehd.com/",
    source_url: "https://www.tokiomarinehd.com/",
    is_japan_company: true,
    ranking_priority: 49,
    collected_at: new Date().toISOString()
  },
  {
    id: "50",
    company_name: "MS&ADインシュアランスグループホールディングス",
    company_name_kana: "えむえすあんどえーでぃいんしゅあらんすぐるーぷほーるでぃんぐす",
    category: "holding",
    industry: "保険",
    note: "三井住友海上・あいおいニッセイ同和等を傘下に持つ",
    website_url: "https://www.ms-ad-hd.com/",
    source_url: "https://www.ms-ad-hd.com/",
    is_japan_company: true,
    ranking_priority: 50,
    collected_at: new Date().toISOString()
  }
];

// Ensure output directories exist
const dataDir = path.join(process.cwd(), 'data');
const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Sort by ranking_priority
const sorted = [...companies].sort((a, b) => a.ranking_priority - b.ranking_priority);

// Save JSON
const outputPath = path.join(dataDir, 'companies.json');
fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), 'utf-8');

// Log
const logPath = path.join(logsDir, 'collect.log');
const logMessage = `[${new Date().toISOString()}] 収集完了: ${sorted.length}件のデータを ${outputPath} に保存しました\n`;
fs.appendFileSync(logPath, logMessage, 'utf-8');

console.log(`収集完了: ${sorted.length}件`);
console.log(`保存先: ${outputPath}`);
