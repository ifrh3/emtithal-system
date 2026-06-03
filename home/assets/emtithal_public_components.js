/*
  Emtithal Public Components JS
  Handles dynamic injection of SVG sprites, header navigation, mobile panel, footer, login modal, and toast alerts.
  Exposes the global showToast(message) helper.
*/

// --- Initialize Global Supabase Client ---
const EMTITHAL_SUPABASE_URL  = 'https://wsexgnphxcuceyqquhzv.supabase.co';
const EMTITHAL_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXhnbnBoeGN1Y2V5cXF1aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTU3NTMsImV4cCI6MjA5NDc5MTc1M30.0u9VgV4sPMs-PSdsBkc0cgW4yc-9wTXQkbbaKmfJ3QA';
const EMTITHAL_SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

function loadSupabaseSdk() {
  if (window.supabase) return Promise.resolve(window.supabase);
  if (window.__emtithalSupabaseLoad) return window.__emtithalSupabaseLoad;

  window.__emtithalSupabaseLoad = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = EMTITHAL_SUPABASE_CDN;
    script.async = true;
    script.onload = () => resolve(window.supabase);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__emtithalSupabaseLoad;
}

async function ensureEmtithalSupabaseClient() {
  if (window.db) return window.db;
  if (!window.supabase) await loadSupabaseSdk();
  if (!window.supabase) throw new Error('Supabase SDK failed to load.');
  window.db = window.supabase.createClient(EMTITHAL_SUPABASE_URL, EMTITHAL_SUPABASE_ANON);
  return window.db;
}

window.ensureEmtithalSupabaseClient = ensureEmtithalSupabaseClient;
ensureEmtithalSupabaseClient().catch((error) => {
  console.warn('Supabase client initialization failed:', error.message);
});

// --- Component HTML Templates ---

const svgSprites = `
<svg aria-hidden="true" height="0" width="0" style="position:absolute; display:none;">
  <defs>
    <symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="M13 6l-6 6 6 6M8 12h9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/></symbol>
    <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v10M8 10l4 4 4-4M5 20h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M16 16l4 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.7"/></symbol>
    <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9"/></symbol>
    <symbol id="i-arrow-down" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7 7 7-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path></symbol>
    <symbol id="i-arrow-up" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path></symbol>
  </defs>
</svg>
`;

const headerHTML = `
<header class="site-header">
  <div class="container nav-inner">
    <a class="brand" href="emtithal_public_home.html" aria-label="إمتثال">
      <img class="brand-logo" src="assets/emtithal-logo-nav.png" alt="شعار إمتثال">
    </a>

    <nav class="nav-links" aria-label="التنقل الرئيسي">
      <a href="emtithal_public_home.html" data-nav-link="emtithal_public_home.html">الرئيسية</a>
      <a href="Extentions page.html" data-nav-link="extentions page.html">الإضافات</a>
      <a href="emtithal_about_us.html" data-nav-link="emtithal_about_us.html">من نحن</a>
    </nav>

    <div class="nav-actions">
      <button class="menu-toggle" type="button" aria-label="فتح القائمة" aria-expanded="false" id="menuToggle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>
        </svg>
      </button>
    </div>
  </div>
  <div class="mobile-panel" id="mobilePanel">
    <div class="container">
      <nav class="nav-links" aria-label="التنقل في الجوال">
        <a href="emtithal_public_home.html" data-nav-link="emtithal_public_home.html">الرئيسية</a>
        <a href="Extentions page.html" data-nav-link="extentions page.html">الإضافات</a>
        <a href="emtithal_about_us.html" data-nav-link="emtithal_about_us.html">من نحن</a>
      </nav>
    </div>
  </div>
</header>
`;

const footerHTML = `
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
          <a href="emtithal_public_home.html#platforms">المنصات</a>
          <a href="Extentions%20page.html">الإضافات</a>
          <a href="emtithal_about_us.html">من نحن</a>
          <a href="#" data-login-modal-open>دخول فريق العمل</a>
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

const loginModalHTML = `
<dialog class="login-dialog" id="loginModal" aria-labelledby="loginModalTitle" aria-describedby="loginModalDesc">
  <section class="login-modal-card" role="document">
    <div class="login-modal-head">
      <span class="login-modal-icon" aria-hidden="true">
        <svg><use href="#i-lock"/></svg>
      </span>
      <div>
        <span class="login-modal-kicker">خاص بفريق العمل</span>
        <h2 class="login-modal-title" id="loginModalTitle">تسجيل الدخول</h2>
        <p class="login-modal-desc" id="loginModalDesc">أدخل بياناتك للوصول إلى لوحة إمتثال.</p>
      </div>
      <button class="login-modal-close" type="button" data-login-modal-close aria-label="إغلاق نافذة تسجيل الدخول">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" stroke-width="1.8"/>
        </svg>
      </button>
    </div>

    <div class="login-modal-body">
      <p class="login-modal-notice">
        <span aria-hidden="true">i</span>
        <span>ملاحظة: تسجيل الدخول متاح فقط لفريق عمل إمتثال المصرّح لهم.</span>
      </p>

      <form class="login-modal-form" id="loginModalForm" novalidate>
        <div class="login-modal-field">
          <label class="login-modal-label" for="loginModalEmail">البريد الإلكتروني</label>
          <input class="login-modal-input" id="loginModalEmail" name="email" type="email" inputmode="email" autocomplete="email" placeholder="example@email.com" aria-describedby="loginModalEmailError">
          <span class="login-modal-error" id="loginModalEmailError" aria-live="polite"></span>
        </div>

        <div class="login-modal-field">
          <label class="login-modal-label" for="loginModalPassword">كلمة المرور</label>
          <input class="login-modal-input" id="loginModalPassword" name="password" type="password" autocomplete="current-password" placeholder="أدخل كلمة المرور" aria-describedby="loginModalPasswordError">
          <span class="login-modal-error" id="loginModalPasswordError" aria-live="polite"></span>
        </div>

        <div class="login-modal-row">
          <label class="login-modal-check" for="loginModalRemember">
            <input id="loginModalRemember" name="remember" type="checkbox">
            <span>تذكرني</span>
          </label>
          <a class="login-modal-forgot" href="#" id="loginModalForgot">نسيت كلمة المرور؟</a>
        </div>

        <button class="btn btn-primary login-modal-submit" type="submit">تسجيل الدخول</button>
      </form>

      <div class="login-modal-status success" id="loginModalSuccess" role="status" aria-live="polite" hidden>
        <svg aria-hidden="true"><use href="#i-check"/></svg>
        <span>بيانات الدخول مكتملة. جاري توجيهك...</span>
      </div>

      <div class="login-modal-status danger" id="loginModalError" role="alert" aria-live="assertive" hidden>
        <span aria-hidden="true">!</span>
        <span id="loginModalErrorText">يرجى استكمال الحقول المطلوبة للمتابعة.</span>
      </div>
    </div>
  </section>
</dialog>
`;

const toastHTML = `
<div class="toast" id="toast" role="status" aria-live="polite">
  <svg aria-hidden="true"><use href="#i-check"/></svg>
  <span id="toastText">تم تنفيذ الإجراء.</span>
</div>
`;

// --- Global Functions ---

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }
}
window.showToast = showToast;

// --- Helper Functions ---

function highlightActiveLinks() {
  const currentPath = window.location.pathname.toLowerCase();
  const currentHref = window.location.href.toLowerCase();
  const navLinks = document.querySelectorAll('[data-nav-link]');

  navLinks.forEach(link => {
    const attrVal = link.getAttribute('data-nav-link').toLowerCase();
    
    // Exact path matches or URL containing page filename
    const isExactMatch = currentPath.endsWith(attrVal) || currentHref.endsWith(attrVal);
    
    // Match decoded URI characters to handle space in file names, e.g. "Extentions page.html"
    const decodedHref = decodeURIComponent(currentHref);
    const decodedPath = decodeURIComponent(currentPath);
    const isDecodedMatch = decodedPath.endsWith(attrVal) || decodedHref.endsWith(attrVal);

    // Fallback for homepage
    const isHome = attrVal.includes('emtithal_public_home.html');
    const isPathHome = currentPath === '/' || currentPath.endsWith('/') || currentPath === '' || currentPath.endsWith('index.html');
    const isHomeSectionPage = decodedPath.endsWith('report_page.html') || decodedPath.endsWith('report_page.html/');

    if (isExactMatch || isDecodedMatch || (isHome && (isPathHome || isHomeSectionPage))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function bindEvents() {
  // Mobile Hamburger menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobilePanel = document.getElementById('mobilePanel');

  if (menuToggle && mobilePanel) {
    // Prevent duplicate handlers if script is re-run
    const newMenuToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);

    newMenuToggle.addEventListener('click', () => {
      const isOpen = mobilePanel.classList.toggle('open');
      newMenuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    });

    mobilePanel.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobilePanel.classList.remove('open');
        newMenuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });

    // Close when clicking outside the menu
    document.addEventListener('click', (e) => {
      if (mobilePanel.classList.contains('open')) {
        if (!mobilePanel.contains(e.target) && !newMenuToggle.contains(e.target)) {
          mobilePanel.classList.remove('open');
          newMenuToggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('menu-open');
        }
      }
    });
  }

  // Global fix: Allow 'Space' key to click <a> tags that look like buttons or are skip links
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.keyCode === 32) {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'A') {
        e.preventDefault(); // Prevent page scroll
        activeEl.click();
      }
    }
  });

  // Login Modal Handling
  // --- Login Form Validation ---
  const loginForm = document.getElementById('loginModalForm');
  const loginEmail = document.getElementById('loginModalEmail');
  const loginPassword = document.getElementById('loginModalPassword');
  const loginEmailError = document.getElementById('loginModalEmailError');
  const loginPasswordError = document.getElementById('loginModalPasswordError');
  const loginDialog = document.getElementById('loginModal');
  const openLoginLinks = document.querySelectorAll('[data-login-modal-open]');
  const closeLoginButton = document.querySelector('[data-login-modal-close]');
  const loginSuccess = document.getElementById('loginModalSuccess');
  const loginError = document.getElementById('loginModalError');
  const loginErrorText = document.getElementById('loginModalErrorText');

  const loginForgot = document.getElementById('loginModalForgot');

  if (loginDialog) {
    function openLoginModal(event) {
      if (event) event.preventDefault();
      
      // Close mobile panel if open
      if (mobilePanel && mobilePanel.classList.contains('open')) {
        mobilePanel.classList.remove('open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }

      // Reset form
      if (loginForm) loginForm.reset();
      [loginEmail, loginPassword].forEach(input => {
        if (input) {
          input.classList.remove('is-error');
          input.removeAttribute('aria-invalid');
        }
      });
      if (loginEmailError) loginEmailError.textContent = '';
      if (loginPasswordError) loginPasswordError.textContent = '';
      if (loginSuccess) loginSuccess.hidden = true;
      if (loginError) loginError.hidden = true;

      if (typeof loginDialog.showModal === 'function') {
        loginDialog.showModal();
      } else {
        loginDialog.setAttribute('open', '');
      }
      window.requestAnimationFrame(() => loginEmail?.focus());
    }

    function closeLoginModal() {
      if (typeof loginDialog.close === 'function') {
        loginDialog.close();
      } else {
        loginDialog.removeAttribute('open');
      }
    }

    openLoginLinks.forEach(link => {
      link.addEventListener('click', openLoginModal);
    });

    closeLoginButton?.addEventListener('click', closeLoginModal);

    loginDialog.addEventListener('click', event => {
      const rect = loginDialog.getBoundingClientRect();
      const isBackdropClick = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (isBackdropClick) closeLoginModal();
    });

    if (loginForm) {
      function setLoginFieldError(input, errorElement, message) {
        if (input && errorElement) {
          input.classList.add('is-error');
          input.setAttribute('aria-invalid', 'true');
          errorElement.textContent = message;
        }
      }

      function clearLoginFieldError(input, errorElement) {
        if (input && errorElement) {
          input.classList.remove('is-error');
          input.removeAttribute('aria-invalid');
          errorElement.textContent = '';
        }
      }

      function validateLoginField(input, errorElement, message) {
        if (!input || !input.value.trim()) {
          setLoginFieldError(input, errorElement, message);
          return false;
        }
        clearLoginFieldError(input, errorElement);
        return true;
      }

      [loginEmail, loginPassword].forEach(input => {
        input?.addEventListener('input', () => {
          if (input.value.trim()) {
            clearLoginFieldError(input, input === loginEmail ? loginEmailError : loginPasswordError);
          }
          if (loginSuccess) loginSuccess.hidden = true;
          if (loginError) loginError.hidden = true;
        });
      });

      if (loginForgot) {
        loginForgot.addEventListener('click', event => {
          event.preventDefault();
          showToast('ميزة استعادة كلمة المرور غير مفعلة حالياً. الرجاء مراجعة مدير النظام.');
        });
      }

      loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        const isEmailValid = validateLoginField(loginEmail, loginEmailError, 'يرجى إدخال البريد الإلكتروني.');
        const isPasswordValid = validateLoginField(loginPassword, loginPasswordError, 'يرجى إدخال كلمة المرور.');
        if (!isEmailValid || !isPasswordValid) return;

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'جاري الدخول...';

        let authClient;
        try {
          authClient = await ensureEmtithalSupabaseClient();
        } catch (loadError) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          if (loginSuccess) loginSuccess.hidden = true;
          if (loginError) {
            loginError.hidden = false;
            loginErrorText.textContent = 'تعذر الاتصال بخدمة التحقق من الدخول. يرجى التحقق من اتصال الإنترنت وتحميل مكتبة Supabase.';
          }
          return;
        }

        try {
          const { data, error } = await authClient.auth.signInWithPassword({
            email: loginEmail.value.trim(),
            password: loginPassword.value
          });

          if (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            if (loginSuccess) loginSuccess.hidden = true;
            if (loginError) {
              loginError.hidden = false;
              loginErrorText.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
            }
          } else {
            localStorage.setItem('sb_session', JSON.stringify(data.session));
            if (loginSuccess) loginSuccess.hidden = false;
            if (loginError) loginError.hidden = true;
            setTimeout(() => {
              window.location.href = '../emtithal_staff_pages/emtithal_staff_home.html';
            }, 800);
          }
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          if (loginSuccess) loginSuccess.hidden = true;
          if (loginError) {
            loginError.hidden = false;
            loginErrorText.textContent = 'حدث خطأ أثناء الاتصال: ' + err.message;
          }
        }
      });
    }
  }
}

// --- Initialization ---

function initEmtithalPublicComponents() {
  // 1. Inject SVG Sprites into body (before any other rendering)
  if (!document.getElementById('i-arrow-left')) {
    const div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = svgSprites;
    document.body.prepend(div.firstElementChild);
  }

  // 2. Inject Header navigation
  const headerContainer = document.getElementById('emtithal-header');
  if (headerContainer) {
    headerContainer.innerHTML = headerHTML;
  }

  // 3. Inject Global Footer
  const footerContainer = document.getElementById('emtithal-footer');
  if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
  }

  // 4. Inject Dialog & Toast components if not already in document
  if (!document.getElementById('loginModal')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = loginModalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
  }

  if (!document.getElementById('toast')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = toastHTML;
    document.body.appendChild(tempDiv.firstElementChild);
  }

  // 5. Apply active page styles
  highlightActiveLinks();

  // 6. Bind interactions (menus, validation, modal, login auth)
  bindEvents();
}

// Auto-run when DOM is parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEmtithalPublicComponents);
} else {
  initEmtithalPublicComponents();
}
