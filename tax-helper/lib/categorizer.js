/**
 * lib/categorizer.js — Claude API で経費仕分け
 * 送信データ: 利用日, 店名, 金額のみ（個人情報なし）
 */
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// freeeの勘定科目（個人事業主用）
const ACCOUNT_ITEMS = [
  '旅費交通費',    // 電車・バス・タクシー・飛行機・Suica等
  '通信費',        // スマホ・ネット回線・ドメイン・サーバー代
  'ソフトウェア',  // Adobe・Figma・GitHub等サブスク（10万円未満）
  '消耗品費',      // 文具・ケーブル・小物（10万円未満の備品）
  '新聞図書費',    // 書籍・雑誌・オンライン学習
  '接待交際費',    // 飲食・贈答（仕事関係）
  '広告宣伝費',    // 広告・PR費用
  '外注費',        // フリーランスへの発注・外注
  '地代家賃',      // 事務所家賃・コワーキング
  '水道光熱費',    // 電気・水道・ガス（事業割合分）
  '雑費',          // 上記に当てはまらない少額経費
  '対象外',        // 経費にならないもの（プライベート支出）
];

/**
 * 明細リストをバッチでClaude APIに送り、仕分け結果を返す
 * @param {Array<{date, description, amount, source}>} transactions
 * @returns {Array<{...transaction, isBusiness, accountItem, memo}>}
 */
export async function categorize(transactions) {
  const BATCH_SIZE = 30; // 1回のAPIコールで処理する件数
  const results = [];

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    console.log(`  仕分け中... ${i + 1}〜${Math.min(i + BATCH_SIZE, transactions.length)} 件目`);

    const txList = batch.map((t, idx) =>
      `${idx + 1}. 日付:${t.date} 店名:${t.description} 金額:${t.amount}円`
    ).join('\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `あなたは日本の個人事業主（フリーランス・クリエイター系）の確定申告アシスタントです。
以下のクレジットカード明細を見て、各取引が「事業経費」かどうか判定し、勘定科目を選んでください。

判定基準:
- 交通費（Suica/PASMO/えきねっと/新幹線/バス等）→ 旅費交通費
- ソフトウェアサブスク（Adobe/Figma/GitHub/Notion/ChatGPT/AWS等）→ ソフトウェア
- ドメイン/サーバー/ネット回線 → 通信費
- スマートフォン代（事業割合分）→ 通信費
- 書籍/Udemy/Kindle等 → 新聞図書費
- コワーキングスペース → 地代家賃
- 飲食店（仕事関係は経費、プライベートは対象外）→ 不明な場合は接待交際費
- コンビニ・スーパー・ドラッグストア → 基本は対象外（消耗品の可能性あり）
- Amazon（内容不明）→ 消耗品費（要確認フラグ）
- 趣味・娯楽・衣服 → 対象外

勘定科目の選択肢: ${ACCOUNT_ITEMS.join(', ')}

明細:
${txList}

回答はJSON配列で返してください（他のテキスト不要）:
[
  {"idx": 1, "isBusiness": true, "accountItem": "旅費交通費", "memo": ""},
  {"idx": 2, "isBusiness": false, "accountItem": "対象外", "memo": "プライベート"},
  ...
]`,
      }],
    });

    const text = message.content[0].text.trim();
    let parsed;
    try {
      // コードブロックを除去
      const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsed = JSON.parse(json);
    } catch {
      console.error('⚠️ JSON解析失敗、スキップします:', text.slice(0, 200));
      parsed = batch.map((_, idx) => ({ idx: idx + 1, isBusiness: false, accountItem: '対象外', memo: '解析失敗' }));
    }

    for (let j = 0; j < batch.length; j++) {
      const r = parsed.find(p => p.idx === j + 1) || { isBusiness: false, accountItem: '対象外', memo: '不明' };
      results.push({ ...batch[j], isBusiness: r.isBusiness, accountItem: r.accountItem, memo: r.memo || '' });
    }
  }

  return results;
}
