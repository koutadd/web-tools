/**
 * lib/freee-api.js — freee API クライアント
 * ドキュメント: https://developer.freee.co.jp/reference/accounting/reference
 */

const BASE = 'https://api.freee.co.jp/api/1';

export class FreeeClient {
  constructor(accessToken, companyId) {
    this.token = accessToken;
    this.companyId = Number(companyId);
  }

  async get(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
  }

  /** 勘定科目一覧を取得してname→idのマップを返す */
  async getAccountItemMap() {
    const data = await this.get(`/account_items?company_id=${this.companyId}`);
    const map = {};
    for (const item of data.account_items || []) {
      map[item.name] = item.id;
    }
    return map;
  }

  /** 税区分コード一覧 */
  async getTaxCodes() {
    const data = await this.get(`/taxes/codes?company_id=${this.companyId}`);
    return data.taxes || [];
  }

  /**
   * 経費取引を登録する
   * @param {Object} param
   * @param {string} param.date - 'YYYY-MM-DD'
   * @param {string} param.description - 摘要
   * @param {number} param.amount - 金額（税込）
   * @param {number} param.accountItemId - 勘定科目ID
   * @param {string} param.cardSource - クレカ名（補助科目として摘要に追加）
   */
  async createExpense({ date, description, amount, accountItemId, cardSource }) {
    const body = {
      company_id: this.companyId,
      issue_date: date,
      due_date: date,
      type: 'expense',          // 支出
      partner_name: description,
      ref_number: '',
      details: [{
        account_item_id: accountItemId,
        tax_code: 1,            // 課税仕入れ（10%）
        item_id: null,
        description: `${description}【${cardSource}】`,
        amount: amount,
        vat: Math.floor(amount - amount / 1.1), // 内税計算
      }],
      payments: [{
        date: date,
        from_walletable_type: 'credit_card',
        from_walletable_id: null,
        amount: amount,
      }],
    };

    return this.post(`/deals`, body);
  }
}
