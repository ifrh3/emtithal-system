/**
 * Emtithal Shared Components & Global Setup
 * Injects Navbar, Footer, and sets up Supabase and global helpers.
 */

// 1. Supabase Initialization & Helper functions
const SUPABASE_URL = 'https://wsexgnphxcuceyqquhzv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXhnbnBoeGN1Y2V5cXF1aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTU3NTMsImV4cCI6MjA5NDc5MTc1M30.0u9VgV4sPMs-PSdsBkc0cgW4yc-9wTXQkbbaKmfJ3QA';

if (window.supabase) {
  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

// Global selector helper
window.$ = (selector) => document.querySelector(selector);

// 2. Component Injection
function injectEmtithalComponents() {
  const path = window.location.pathname;
  let activeId = 'home';
  if (path.endsWith('imtithal-dashboard.html')) {
    activeId = 'dashboard';
  } else if (path.endsWith('reports_page.html')) {
    activeId = 'reports';
  }

  const activeClass = (id) => activeId === id ? 'class="active"' : '';

  // --- Inject Header ---
  const headerContainer = document.getElementById('emtithal-header');
  if (headerContainer) {
    const userAreaHTML = `
      <div class="emtithal-user-chip" aria-label="المستخدم الحالي">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.7a7 7 0 0 1 10 0"/></svg>
        <span id="current-user-name">...</span>
      </div>
    `;

    headerContainer.innerHTML = `
      <header class="emtithal-site-header">
        <div class="emtithal-nav-container emtithal-nav-inner">
          <a class="emtithal-brand" href="emtithal_staff_home.html" aria-label="إمتثال - الرئيسية">
            <img class="emtithal-brand-logo" src="assets/emtithal-logo-nav.png" alt="شعار إمتثال">
          </a>

          <nav class="emtithal-nav-links" aria-label="التنقل الداخلي لفريق العمل">
            <a href="emtithal_staff_home.html" ${activeClass('home')}>الرئيسية</a>
            <a href="imtithal-dashboard.html" ${activeClass('dashboard')}>لوحة التحكم</a>
            <a href="reports_page.html" ${activeClass('reports')}>البلاغات</a>
          </nav>

          <div class="emtithal-nav-actions">
            ${userAreaHTML}
            <button class="btn btn-secondary btn-small" id="sign-out-btn" type="button" style="margin-inline-start: 8px;">تسجيل الخروج</button>
            <button class="emtithal-menu-toggle" id="menuToggle" type="button" aria-label="فتح القائمة" aria-expanded="false" aria-controls="mobilePanel">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="emtithal-mobile-panel" id="mobilePanel">
          <div class="emtithal-nav-container">
            <nav class="emtithal-nav-links" aria-label="التنقل في الجوال لفريق العمل">
              <a href="emtithal_staff_home.html" ${activeClass('home')}>الرئيسية</a>
              <a href="imtithal-dashboard.html" ${activeClass('dashboard')}>لوحة التحكم</a>
              <a href="reports_page.html" ${activeClass('reports')}>البلاغات</a>
            </nav>
          </div>
        </div>
      </header>
    `;
    initMobileMenu();
  }

  // --- Inject Footer ---
  const footerContainer = document.getElementById('emtithal-footer');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer class="emtithal-global-footer">
        <div class="emtithal-container">
          <div class="emtithal-footer-main">
            <div class="emtithal-footer-brand">
              <img class="emtithal-footer-logo" src="assets/emtithal-logo.png" alt="شعار إمتثال">
              <p class="emtithal-footer-title">إمتثال</p>
              <p class="emtithal-footer-text">
                منصة تساعد على فحص امتثال المواقع الحكومية لكود المنصات السعودي، وتعرض النتائج بصورة واضحة قابلة للمراجعة والتحسين.
              </p>
            </div>

            <nav class="emtithal-footer-section" aria-label="روابط الفوتر">
              <span class="emtithal-footer-heading">روابط سريعة</span>
              <div class="emtithal-footer-links">
                <a href="emtithal_staff_home.html">الرئيسية</a>
                <a href="imtithal-dashboard.html">لوحة التحكم</a>
                <a href="reports_page.html">البلاغات</a>
              </div>
            </nav>

            <div class="emtithal-footer-section">
              <span class="emtithal-footer-heading">حسابات التواصل</span>
              <div class="emtithal-social-links" aria-label="حسابات تواصل اجتماعي تجريبية">
                <a class="emtithal-social-link" href="https://x.com/emtithal_demo" target="_blank" rel="noopener noreferrer" aria-label="حساب إمتثال التجريبي على X">X</a>
                <a class="emtithal-social-link" href="https://www.linkedin.com/company/imtithal-demo" target="_blank" rel="noopener noreferrer" aria-label="حساب إمتثال التجريبي على لينكدإن">in</a>
                <a class="emtithal-social-link" href="https://www.instagram.com/imtithal_demo/" target="_blank" rel="noopener noreferrer" aria-label="حساب إمتثال التجريبي على إنستغرام">IG</a>
              </div>
            </div>
          </div>

          <div class="emtithal-footer-bottom">
            <span>© 2026 إمتثال. جميع الحقوق محفوظة.</span>
            <span>حسابات التواصل والبيانات المعروضة لأغراض النموذج فقط.</span>
          </div>
        </div>
      </footer>
    `;
  }
}

// 3. Mobile Navigation Event Binding
function initMobileMenu() {
  const emtithalMenuToggle = document.getElementById('menuToggle');
  const emtithalMobilePanel = document.getElementById('mobilePanel');
  if (emtithalMenuToggle && emtithalMobilePanel) {
    emtithalMenuToggle.addEventListener('click', () => {
      const isOpen = emtithalMobilePanel.classList.toggle('open');
      emtithalMenuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    });
    emtithalMobilePanel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        emtithalMobilePanel.classList.remove('open');
        emtithalMenuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }
}

// 4. Global Sign-Out Logic
document.addEventListener('click', async (e) => {
  if (e.target.id === 'sign-out-btn' || e.target.closest('#sign-out-btn')) {
    localStorage.removeItem('sb_session');
    if (window.db && window.db.auth) {
      await window.db.auth.signOut();
    }
    window.location.href = '../home/emtithal_public_home.html';
  }
});

// Run injection as soon as script is parsed (if elements exist) or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectEmtithalComponents);
} else {
  injectEmtithalComponents();
}
