/* ===== Configuration =====
   If you want to post to Google Forms, set GOOGLE_FORM_ACTION and GOOGLE_FORM_MAP.
   Example:
   const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/FORM_ID/formResponse";
   const GOOGLE_FORM_MAP = { name: "entry.111111111", email: "entry.222222222", ... };
*/
const GOOGLE_FORM_ACTION = ""; // leave empty for local-only behavior
const GOOGLE_FORM_MAP = {};    // map your field names to Google entry IDs

const STORAGE_KEY = 'evs_responses';

// helpers
function loadResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse stored responses', e);
    return [];
  }
}
function saveResponses(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

function getCheckedValues(nodeList, limit = Infinity) {
  return Array.from(nodeList).filter(i => i.checked).slice(0, limit).map(i => i.value);
}

function renderResponses() {
  const area = document.getElementById('responsesArea');
  const data = loadResponses();
  if (!data || data.length === 0) {
    area.innerHTML = '<p class="muted">No responses yet — submit the survey to see them listed here.</p>';
    return;
  }

  const columns = ["timestamp","name","email","age","gender","occupation","own","brand","plan","concerns","incentives","env","usage","features","comments"];
  const tbl = document.createElement('table');
  const thead = document.createElement('thead');
  const thr = document.createElement('tr');
  for (const c of columns) {
    const th = document.createElement('th');
    th.textContent = c;
    thr.appendChild(th);
  }
  thead.appendChild(thr);
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of data.slice().reverse()) {
    const tr = document.createElement('tr');
    for (const c of columns) {
      const td = document.createElement('td');
      td.textContent = row[c] ?? '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);

  area.innerHTML = '';
  area.appendChild(tbl);
}

// Form submit handling
document.getElementById('evForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const form = e.target;
  const msgEl = document.getElementById('formMsg');

  const name = (form.name.value || '').trim();
  const email = (form.email.value || '').trim();
  const age = form.age.value;
  const gender = form.gender.value;
  const occupation = (form.occupation.value || '').trim();
  const own = form.own.value;
  const brand = (form.brand.value || '').trim();
  const plan = form.plan.value;
  const concerns = getCheckedValues(form.querySelectorAll('input[name="concern"]')).join('; ');
  const incentives = form.incentives.value;
  const env = form.env.value;
  const usage = form.usage.value;
  const features = getCheckedValues(form.querySelectorAll('input[name="feature"]'), 3).join('; ');
  const comments = (form.comments.value || '').trim();

  if (!name || !email || !age || !gender || !occupation || !own || !plan || !incentives || !env || !usage) {
    msgEl.textContent = 'Please complete all required fields (highlighted).';
    msgEl.className = 'muted';
    return;
  }

  const record = {
    timestamp: new Date().toISOString(),
    name, email, age, gender, occupation, own, brand, plan,
    concerns, incentives, env, usage, features, comments
  };

  const all = loadResponses();
  all.push(record);
  saveResponses(all);

  document.getElementById('afterActions').classList.remove('hidden');
  document.getElementById('thanksMsg').textContent = 'Thank you — your response has been recorded.';
  form.reset();
  msgEl.textContent = '';

  renderResponses();

  // Optional: POST to Google Form (best-effort, no-cors)
  if (GOOGLE_FORM_ACTION && Object.keys(GOOGLE_FORM_MAP).length) {
    try {
      const formData = new FormData();
      for (const key in GOOGLE_FORM_MAP) {
        const entryKey = GOOGLE_FORM_MAP[key];
        formData.append(entryKey, record[key] ?? '');
      }
      fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: formData })
        .catch(err => console.warn('Google Form POST failed (no-cors may hide error):', err));
    } catch (err) {
      console.warn('Google Form mapping skipped due to error', err);
    }
  }
});

// Download CSV
document.getElementById('downloadCsv').addEventListener('click', function () {
  const rows = loadResponses();
  if (!rows || rows.length === 0) {
    alert('No responses to download.');
    return;
  }
  const csv = toCSV(rows);
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0,19).replace(/:/g,'-');
  a.download = `evs_responses_${date}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Clear stored responses
document.getElementById('clearLocal').addEventListener('click', function () {
  if (!confirm('Clear all stored responses from this browser? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderResponses();
  document.getElementById('afterActions').classList.add('hidden');
});

// Smooth nav scrolling
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', (ev) => {
    ev.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  });
});

// Focus first input on load and render existing responses
window.addEventListener('load', () => {
  const first = document.querySelector('#survey select[required], #survey input[required], #survey textarea[required]');
  first && first.focus();
  renderResponses();
});
