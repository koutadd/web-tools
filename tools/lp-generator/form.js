// lp-generator/form.js

const API_ENDPOINT = '/api/lp-analyze';

const form      = document.getElementById('lpForm');
const submitBtn = document.getElementById('submitBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar  = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');

// ── Validation ────────────────────────────────────────────────────

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function showError(fieldId, errorId) {
  document.getElementById(fieldId)?.classList.add('error');
  document.getElementById(errorId)?.classList.add('field-error--visible');
}

function clearError(fieldId, errorId) {
  document.getElementById(fieldId)?.classList.remove('error');
  document.getElementById(errorId)?.classList.remove('field-error--visible');
}

// ── Progress simulation ───────────────────────────────────────────

const STEPS = [
  { pct: 10, label: 'Playwright でブラウザを起動中…' },
  { pct: 25, label: 'ページに移動してレンダリング待機中…' },
  { pct: 45, label: 'スクリーンショットを撮影中…' },
  { pct: 60, label: 'DOM 構造・テキストを抽出中…' },
  { pct: 75, label: 'Claude にデータを送信中…' },
  { pct: 90, label: 'Next.js コードを生成中…' },
  { pct: 97, label: 'もうすぐ完了します…' },
];

let progressTimer = null;

function startProgress() {
  progressWrap.classList.add('is-active');
  submitBtn.style.display = 'none';
  let stepIndex = 0;

  function tick() {
    if (stepIndex >= STEPS.length) return;
    const step = STEPS[stepIndex++];
    progressBar.style.width = step.pct + '%';
    progressLabel.textContent = step.label;
    const delay = stepIndex < 3 ? 2500 : stepIndex < 5 ? 4000 : 8000;
    progressTimer = setTimeout(tick, delay);
  }
  tick();
}

function stopProgress() {
  if (progressTimer) clearTimeout(progressTimer);
  progressBar.style.width = '100%';
  progressLabel.textContent = 'コード生成完了！リダイレクト中…';
}

// ── Toast ─────────────────────────────────────────────────────────

function showToast(message) {
  const el = document.createElement('div');
  el.className = 'submit-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add('submit-toast--in'))
  );
}

// ── Submit ────────────────────────────────────────────────────────

async function submitLpAnalyze(url) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }

  const { id } = await res.json();
  return id;
}

// ── Event listener ────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = form.lpUrl.value.trim();

  if (!isValidUrl(url)) {
    showError('lpUrl', 'lpUrlError');
    return;
  }
  clearError('lpUrl', 'lpUrlError');

  startProgress();

  try {
    const id = await submitLpAnalyze(url);
    stopProgress();
    showToast('生成完了！レポートページへ移動します…');
    await new Promise(r => setTimeout(r, 1200));
    window.location.href = `report.html?id=${id}`;
  } catch (err) {
    console.error(err);
    if (progressTimer) clearTimeout(progressTimer);
    progressWrap.classList.remove('is-active');
    submitBtn.style.display = '';
    submitBtn.textContent = '解析して Next.js コードを生成する →';
    submitBtn.classList.remove('btn--loading');
    alert(`エラーが発生しました: ${err.message}\nURLが正しいか確認して再度お試しください。`);
  }
});

form.lpUrl.addEventListener('input', () => {
  form.lpUrl.classList.remove('error');
  document.getElementById('lpUrlError')?.classList.remove('field-error--visible');
});
