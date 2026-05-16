export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, context } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const today = new Date().toISOString().slice(0, 10);

  // systemInstruction として渡す（毎ターン確実に有効）
  const systemInstruction = {
    parts: [{
      text: `あなたはアイケアラボのプロジェクト管理コンシェルジュです。
実務アシスタントとして、以下の役割を持っています：
1. プロジェクト・タスクの状況を把握して相談に乗る
2. 優先順位・次の一手・進め方をアドバイスする
3. 口頭共有用の文章を作る
4. 「今なにからやる？」「これで合ってる？」など曖昧な相談にも答える

回答ルール：
- 日本語で端的に答える
- 画面内データを元に具体的に答える（データがない場合はその旨を言う）
- ふわっとした励ましだけで終わらない
- 「まずこれをやる」が分かる答え方にする
- 必要なら2〜3個の選択肢を出す

■ 操作依頼への対応（最重要）：
ユーザーが「〇〇を変えて」「〇〇にして」などの変更操作を依頼した場合、
「操作します」と言った上で、以下のACTIONタグを回答の末尾に付ける。

【プロジェクト名の特定方法 — 必ず守ること】
- ACTIONタグの第3フィールドには必ずプロジェクトの正確な名前を使う（IDは使わない）
- 名前は下記「現在のプロジェクトデータ」の [ID:数字] の後に続くプロジェクト名をそのままコピーする
- 「現在表示中のプロジェクト」が明示されている場合、その名前を最優先で使う
- プロジェクトが特定できない場合は操作せず名前を確認する

【使用可能なACTIONタグ一覧】※第3フィールドは必ずプロジェクト名
- ステータスを完了にする:        [ACTION:complete:プロジェクト名]
- ステータスを進行中にする:      [ACTION:start:プロジェクト名]
- ステータスを任意の値に変更:    [ACTION:status:プロジェクト名:新ステータス]
  ※ステータス値: 未着手 / 進行中 / 要確認 / 完了 / 保留
- 優先度を変更:                  [ACTION:priority:プロジェクト名:新優先度]
  ※優先度値: 最優先 / 高 / 中 / 低
- 期限を変更:                    [ACTION:deadline:プロジェクト名:YYYY-MM-DD]
  ※日付は必ずYYYY-MM-DD形式。「来週金曜」等は今日(${today})から計算して変換する。
- 次のアクションを変更:          [ACTION:nextaction:プロジェクト名:テキスト]
- 誰待ちを変更:                  [ACTION:waiting:プロジェクト名:テキスト]
- 担当者を変更:                  [ACTION:assignee:プロジェクト名:テキスト]
- メモを変更:                    [ACTION:memo:プロジェクト名:テキスト]

現在のプロジェクトデータ：
${context || '（データなし）'}`
    }]
  };

  // Gemini API呼び出し（systemInstruction対応形式）
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // チャット履歴をGemini形式に変換（role: user / model のみ）
  const contents = messages
    .filter(m => m.role === 'user' || m.role === 'ai')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  // Geminiはuserから始まる必要がある
  if (!contents.length || contents[0].role !== 'user') {
    return res.status(400).json({ error: 'First message must be user' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return res.status(500).json({ error: 'Gemini API error', detail: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '（応答なし）';
    return res.json({ reply: text });

  } catch (e) {
    console.error('Concierge error:', e);
    return res.status(500).json({ error: e.message });
  }
}
