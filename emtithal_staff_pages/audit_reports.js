const db = window.db;
let allReports = [];
let selectedReport = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);

function getReportCriterionNumber(raw) {
  return String(raw?.number || raw?.criterionNumber || raw?.criterion || '').trim();
}

const OFFICIAL_EXTENSION_NAMES = {
  '4': 'المعيار 4 - فحص المسافات',
  '11': 'المعيار 11 - الختم الرقمي',
  '23': 'المعيار 23 - زر التبديل'
};

function getReportExtensionName(raw) {
  const critNum = getReportCriterionNumber(raw);
  const officialName = OFFICIAL_EXTENSION_NAMES[critNum] || (critNum ? `المعيار ${critNum}` : 'إضافة فحص امتثال');
  const rawName = String(raw?.extensionDisplayName || raw?.extensionName || raw?.apiName || '').trim();
  const brandOnly = /^(إمتثال|امتثال|Emtithal)$/i.test(rawName);

  if (OFFICIAL_EXTENSION_NAMES[critNum] || raw?.extensionKind === 'criterion-23-switch' || !rawName || brandOnly) {
    return officialName;
  }

  return rawName;
}

// 55 criteria mock list
const STANDARDS_LIST = [
  { num: 4, name: "المسافات والتخطيط", type: "أساسات" },
  // Adding just a few mock ones for demonstration
  { num: 1, name: "الألوان والتباين", type: "أساسات" },
  { num: 8, name: "الخطوط والطباعة", type: "أساسات" },
  { num: 18, name: "حقول الإدخال", type: "عناصر" },
  { num: 22, name: "القوائم المنسدلة", type: "عناصر" },
  { num: 55, name: "إمكانية الوصول", type: "التجربة" }
];

async function loadReports() {
  // Check auth
  const stored = localStorage.getItem('sb_session');
  if (!stored) {
    window.location.href = '../home/emtithal_public_home.html';
    return;
  }
  let session;
  try {
    session = JSON.parse(stored);
  } catch {
    localStorage.removeItem('sb_session');
    window.location.href = '../home/emtithal_public_home.html';
    return;
  }
  if (session.expires_at && Date.now() / 1000 > session.expires_at) {
    localStorage.removeItem('sb_session');
    window.location.href = '../home/emtithal_public_home.html';
    return;
  }

  const currentUserId = session.user.id;

  // جلب ملف التعريف للمستخدم الحالي
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('*')
    .eq('id', currentUserId)
    .single();

  if (profileError || !profile) {
    console.warn('Profile validation failed:', profileError?.message);
    localStorage.removeItem('sb_session');
    await db.auth.signOut();
    window.location.href = '../home/emtithal_public_home.html';
    return;
  }

  const nameEl = document.getElementById('current-user-name');
  if (nameEl) nameEl.textContent = profile.name;

  // Fetch from reports_summary
  const { data, error } = await db
    .from('reports_summary')
    .select(`
      id,
      score,
      report_date,
      platform_url,
      raw_report_data
    `)
    .order('report_date', { ascending: false });

  if (error) {
    console.error(error);
    showToast('تعذّر تحميل التقارير الآلية.');
    return;
  }

  allReports = data.map(row => {
    const raw = row.raw_report_data || {};
    return {
      id: row.id,
      url: row.platform_url || '—',
      apiName: getReportExtensionName(raw),
      date: row.report_date ? new Date(row.report_date).toLocaleString('ar-SA') : '—',
      score: row.score || 0,
      criterionNum: getReportCriterionNumber(raw) || '—',
      criterionName: raw.title || raw.criterionTitle || raw.criterionNameAr || raw.criterionName || 'تقرير غير معروف',
      status: raw.status || (row.score === 100 ? 'Passed' : 'Failed'),
      raw: raw
    };
  });

  renderTable();
}

function renderTable() {
  const query = ($('#searchInput').value || '').trim().toLowerCase();
  
  const filtered = allReports.filter(r => 
    !query || 
    r.url.toLowerCase().includes(query) || 
    r.apiName.toLowerCase().includes(query) ||
    String(r.criterionName).toLowerCase().includes(query)
  );

  const tbody = $('#tableBody');
  if (!filtered.length) {
    tbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="7">
          <div class="empty-state-box">
            <span data-icon="search"></span>
            <span>لا توجد تقارير مطابقة لجهة حكومية.</span>
          </div>
        </td>
      </tr>
    `;
    paintIcons(tbody);
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr class="report-row" onclick="window.open('../home/report_page.html?id=${encodeURIComponent(String(item.id))}', '_blank')">
      <td style="white-space: nowrap;"><span class="mono" dir="ltr">#${escapeHTML(String(item.id).split('-')[0])}</span></td>
      <td><span class="mono" dir="ltr">${escapeHTML(item.url)}</span></td>
      <td>${escapeHTML(item.apiName)}</td>
      <td class="mono" style="white-space: nowrap;">${escapeHTML(item.date)}</td>
      <td>
        <div style="font-weight:600">معيار ${escapeHTML(item.criterionNum)}</div>
        <div style="font-size:12px;color:var(--neutral-500)">${escapeHTML(item.criterionName)}</div>
      </td>
      <td><span class="score-badge ${getScoreClass(item.score)}">${escapeHTML(item.score)}%</span></td>
      <td>${getStatusBadge(item.status)}</td>
    </tr>
  `).join('');
  
  paintIcons(tbody);
}

function getScoreClass(score) {
  if (score >= 90) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
}

function getStatusBadge(status) {
  if (status === 'Passed' || status === 'Full') return `<span class="badge success"><span class="dot"></span>ممتثل بالكامل</span>`;
  if (status === 'Failed') return `<span class="badge danger"><span class="dot"></span>غير ممتثل</span>`;
  return `<span class="badge warning"><span class="dot"></span>امتثال جزئي</span>`;
}

function openModal(id) {
  selectedReport = allReports.find(r => r.id === id);
  if (!selectedReport) return;

  $('#modal-subtitle').textContent = `#${selectedReport.id}`;
  $('#modal-url').textContent = selectedReport.url;
  $('#modal-date').textContent = selectedReport.date;

  const listContainer = $('#modal-criteria-list');
  
  // Render the 55 criteria logic
  const renderedCriteria = STANDARDS_LIST.map(std => {
    // Is this the one that was audited?
    const isAudited = String(std.num) === String(selectedReport.criterionNum);
    
    if (isAudited) {
      return `
        <div class="criterion-item" style="border-color:var(--brand-500); border-width:2px;">
          <div class="criterion-info">
            <div class="criterion-title">المعيار ${std.num}: ${std.name} <span class="badge success" style="margin-right:8px;font-size:10px;">تم الفحص</span></div>
            <div class="criterion-meta">${std.type}</div>
          </div>
          <div class="criterion-actions">
            <span class="score-badge ${getScoreClass(selectedReport.score)}">${selectedReport.score}%</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="criterion-item missing">
          <div class="criterion-info">
            <div class="criterion-title" style="color:var(--neutral-500)">المعيار ${std.num}: ${std.name}</div>
            <div class="criterion-meta">${std.type}</div>
          </div>
          <div class="criterion-actions">
            <span class="badge neutral">لم يتم فحصها</span>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.open('#', '_blank')">احصل على الإضافة</button>
          </div>
        </div>
      `;
    }
  }).join('');

  const othersMsg = `
    <div style="text-align:center; padding:12px; color:var(--neutral-500); font-size:12px;">
      يوجد 48 معياراً إضافياً غير معروضة في هذه القائمة التجريبية...
    </div>
  `;

  listContainer.innerHTML = renderedCriteria + othersMsg;

  $('#report-modal').classList.add('open');
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-modal]')) {
    $('#report-modal').classList.remove('open');
  }
  if (e.target === $('#report-modal')) {
    $('#report-modal').classList.remove('open');
  }
});

$('#searchInput').addEventListener('input', renderTable);

function showToast(message) {
  const toast = $('#toast');
  $('#toast-msg').textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const icons = {
  "search": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  "x": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  "activity": '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  "check": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
};

function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = icons[el.getAttribute('data-icon')] || '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  paintIcons();
  loadReports();
});
