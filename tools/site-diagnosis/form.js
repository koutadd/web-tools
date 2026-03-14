// site-diagnosis/form.js

const API_ENDPOINT = '/api/diagnosis';

const form = document.getElementById('diagnosisForm');
const submitBtn = document.getElementById('submitBtn');

// ── Validation ─────────────────────────────────────────────────────────────

function showError(fieldId, errorId) {
  document.getElementById(fieldId)?.classList.add('error');
  document.getElementById(errorId)?.classList.add('field-error--visible');
}

function clearError(fieldId, errorId) {
  document.getElementById(fieldId)?.classList.remove('error');
  document.getElementById(errorId)?.classList.remove('field-error--visible');
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(data) {
  let valid = true;

  if (!data.businessName.trim()) {
    showError('shopName', 'shopNameError'); valid = false;
  } else {
    clearError('shopName', 'shopNameError');
  }

  if (!isValidUrl(data.websiteUrl)) {
    showError('siteUrl', 'siteUrlError'); valid = false;
  } else {
    clearError('siteUrl', 'siteUrlError');
  }

  if (!data.industry) {
    showError('industry', 'industryError'); valid = false;
  } else {
    clearError('industry', 'industryError');
  }

  if (!data.goal) {
    showError('goal', 'goalError'); valid = false;
  } else {
    clearError('goal', 'goalError');
  }

  if (!isValidEmail(data.email)) {
    showError('email', 'emailError'); valid = false;
  } else {
    clearError('email', 'emailError');
  }

  return valid;
}

// ── Collect ────────────────────────────────────────────────────────────────

function collectFormData() {
  const problems = Array.from(
    form.querySelectorAll('input[name="concerns"]:checked')
  ).map(el => el.value);

  return {
    businessName: form.shopName.value,
    websiteUrl: form.siteUrl.value,
    industry: form.industry.value,
    goal: form.goal.value,
    problems,
    email: form.email.value,
  };
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(message) {
  const el = document.createElement('div');
  el.className = 'submit-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  document.body.appendChild(el);
  // double rAF ensures the initial opacity:0 state is painted before transition
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add('submit-toast--in'))
  );
}

// ── Submit ─────────────────────────────────────────────────────────────────

async function submitDiagnosis(data) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Extract reportId and cache diagnosis data in sessionStorage
  let reportId = Date.now().toString(36);
  try {
    const json = await res.json();
    if (json.id) {
      reportId = json.id;
      sessionStorage.setItem(`diagnosis_${reportId}`, JSON.stringify(json));
    }
  } catch { /* backend returned non-JSON — use fallback */ }

  showToast('診断を受け付けました。結果ページへ移動します…');

  await new Promise(r => setTimeout(r, 1800));
  window.location.href = `report.html?id=${reportId}`;
}

// ── Event listeners ────────────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = collectFormData();
  if (!validateForm(data)) return;

  submitBtn.textContent = '分析中…';
  submitBtn.classList.add('btn--loading');

  try {
    await submitDiagnosis(data);
  } catch (err) {
    console.error(err);
    alert('送信に失敗しました。もう一度お試しください。');
    submitBtn.textContent = '無料で診断する';
    submitBtn.classList.remove('btn--loading');
  }
});

form.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', () => {
    el.classList.remove('error');
    document.getElementById(el.id + 'Error')?.classList.remove('field-error--visible');
  });
});
