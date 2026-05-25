/* -------------------------------------------------------
   main.js – shared behaviour for every page
   Header and footer are embedded here as template strings
   so the site works when opened directly from disk (file://)
   as well as when served from a web server.
   ------------------------------------------------------- */

/* ── 1. Shared HTML snippets ── */
const HEADER_HTML = `
<header class="site-header">
  <div class="container header-inner">

    <div class="brand">
      <a href="index.html" class="brand-link" aria-label="Go to homepage">
        <img src="assets/img/owl-only.svg" alt="Owl logo" class="logo" />
        <div class="brand-text">
          <span class="brand-line primary">Dr. Sruthi</span>
          <span class="brand-line secondary">Prasood</span>
          <span class="brand-line secondary">Usha, Ph.D.</span>
        </div>
      </a>
    </div>

    <nav class="nav" aria-label="Primary">
      <a href="index.html"        data-page="index">Home</a>
      <a href="about.html"        data-page="about">About</a>
      <a href="publications.html" data-page="publications">Publications</a>
      <a href="projects.html"     data-page="projects">Projects</a>
      <a href="team.html"         data-page="team">Team</a>
      <a href="cv.html"           data-page="cv">CV</a>
    </nav>

  </div>
</header>`;

const FOOTER_HTML = `
<footer class="site-footer">
  <div class="container footer-inner">

    <div class="footer-logos" aria-label="Affiliations and funding institutions">
      <img src="assets/img/dfg_logo.png"      alt="Deutsche Forschungsgemeinschaft" />
      <img src="assets/img/uni_kiel_logo.png" alt="Kiel University – Christian-Albrechts-Universität zu Kiel" />
      <img src="assets/img/humboldt_logo.png" alt="Alexander von Humboldt Foundation" />
      <img src="assets/img/iitm_logo.png"     alt="Indian Institute of Technology Madras" />
      <img src="assets/img/iitd_logo.png"     alt="Indian Institute of Technology Delhi" />
    </div>

    <div class="footer-text">
      © Dr. Sruthi Prasood Usha
    </div>

  </div>
</footer>`;

/* ── 2. Inject header and footer ── */
function injectPartial(id, html) {
  const el = document.getElementById(id);
  if (el) el.outerHTML = html;
}

/* ── 3. Highlight the active nav link ── */
function markActiveNav() {
  const filename = window.location.pathname.split('/').pop() || 'index.html';
  const pageKey = filename.replace('.html', '') || 'index';

  document.querySelectorAll('.nav a[data-page]').forEach(link => {
    if (link.dataset.page === pageKey) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ── Run ── */
injectPartial('site-header', HEADER_HTML);
injectPartial('site-footer', FOOTER_HTML);
markActiveNav();
