/**
 * ═══════════════════════════════════════════════════════
 *  Portfolio — Main Application Logic (Astro)
 *  Handles: Data Fetching → Skeleton Swap → Reveal Animations
 * ═══════════════════════════════════════════════════════
 */

import { API, IMG_BASE_URL } from './api.js';

const PAGE_BOOT_TIMEOUT_MS = 1600;
const IMAGE_BOOT_TIMEOUT_MS = 1200;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================
// BOOT — Entry Point
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  const terminalLines = [
    { text: "iceiy@devops-server:~$ ping -c 3 folio.iceiy.com", delay: 200 },
    { text: "PING folio.iceiy.com (104.21.19.200) 56(84) bytes of data.", delay: 50 },
    { text: "64 bytes from 104.21.19.200: icmp_seq=1 ttl=56 time=12.4 ms", delay: 100 },
    { text: "iceiy@devops-server:~$ initializing core_vitals... OK", delay: 150 },
    { text: "iceiy@devops-server:~$ fetching_portfolio_api --live...", delay: 200 },
  ];

  const terminalOutput = document.getElementById('terminal-output');
  const terminalCursor = document.getElementById('terminal-cursor');

  // Terminal Typing Animation Promise
  const runTerminalAnimation = async () => {
    if (!terminalOutput) return;
    for (const line of terminalLines) {
      await delay(line.delay);
      const div = document.createElement('div');
      div.className = 'terminal-line';
      div.textContent = line.text;
      terminalOutput.insertBefore(div, terminalCursor);
    }
  };

  try {
    // 1) Fetch data concurrently in the background (DO NOT block the preloader on this)
    const allDataReady = Promise.all([
      loadPersonalInfo(),
      loadSkills(),
      loadProjects(),
      loadCertificates(),
      loadSocialLinks(),
    ]);
    allDataReady.catch(error => console.error('Portfolio background load error:', error));

    // 2) Run terminal animation ONLY. Do not wait for allDataReady!
    await runTerminalAnimation();

    // Final terminal sequence
    if (terminalOutput) {
      const div = document.createElement('div');
      div.className = 'terminal-line success';
      div.textContent = "[SUCCESS] Core systems online. Launching UI...";
      terminalOutput.insertBefore(div, terminalCursor);
      await delay(400);
    }

  } catch (err) {
    console.error('Portfolio load error:', err);
  } finally {
    // 2) Hide preloader immediately, SHOW website instantly (NO image wait for FCP boost)
    const preloader = document.getElementById('preloader');
    const main = document.getElementById('main-content');
    if (main) main.classList.add('loaded');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => preloader.remove(), 600);
    }

    // 3) Init Scroll Reveal — AFTER DOM is hydrated
    initScrollReveal();
  }
});

// =============================================
// Scroll Reveal — IntersectionObserver
// =============================================
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll('[class*="reveal-"]').forEach(el => observer.observe(el));
}

// =============================================
// Skeleton Helpers
// =============================================

/** Hide skeleton element(s), show real element(s) */
function swapSkeleton(skeletonId, realId) {
  const skel = document.getElementById(skeletonId);
  const real = document.getElementById(realId);
  if (skel) skel.style.display = 'none';
  if (real) real.style.display = '';
}

// =============================================
// Load More / Pagination Helpers
// =============================================
const PAGE_SIZE = 4;

/** Observe newly injected reveal elements */
function observeNewReveals(container) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('active'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  container.querySelectorAll('[class*="reveal-"]:not(.active)').forEach(el => obs.observe(el));
}

/** Create or update a Load More button */
function setupLoadMoreBtn(btnId, parentEl, allItems, renderFn, bindFn) {
  let shown = parseInt(sessionStorage.getItem(btnId) || PAGE_SIZE, 10);
  if (shown > allItems.length) shown = allItems.length;
  if (shown < PAGE_SIZE) shown = PAGE_SIZE;

  // Render first page
  parentEl.innerHTML = allItems.slice(0, shown).map((item, i) => renderFn(item, i)).join('');
  if (bindFn) bindFn();
  observeNewReveals(parentEl);

  // No need for button if all items fit
  if (allItems.length <= shown) return;

  // Create button
  const remaining = allItems.length - shown;
  const btn = document.createElement('button');
  btn.id = btnId;
  btn.className = 'load-more-btn';
  btn.innerHTML = `<i class="ri-arrow-down-line"></i> Load More <span class="load-more-count">(${remaining} remaining)</span>`;
  parentEl.parentElement.appendChild(btn);

  btn.addEventListener('click', () => {
    const nextBatch = allItems.slice(shown, shown + PAGE_SIZE);
    // Render with correct global index for color cycling
    const html = nextBatch.map((item, i) => renderFn(item, shown + i)).join('');

    // Insert before the button placeholder — append to grid
    parentEl.insertAdjacentHTML('beforeend', html);
    shown += nextBatch.length;
    sessionStorage.setItem(btnId, shown);

    if (bindFn) bindFn();
    observeNewReveals(parentEl);

    // Update or hide button
    const left = allItems.length - shown;
    if (left <= 0) {
      btn.remove();
    } else {
      btn.querySelector('.load-more-count').textContent = `(${left} remaining)`;
    }
  });
}

// =============================================
// 1. Personal Info
// =============================================
async function loadPersonalInfo() {
  try {
    const response = await API.getPersonalInfo();
    const info = response.data || response;

    // Name
    const nameEl = document.getElementById('profile-name');
    if (nameEl) {
      nameEl.textContent = info.full_name || info.name || 'Mohamed Emad Ali';
    }

    // Job Title
    const profEl = document.getElementById('profile-profession');
    if (profEl) {
      profEl.textContent = info.job_title || info.title || 'DevOps & Network Engineer';
    }

    // Bio
    const bioEl = document.getElementById('profile-bio');
    if (bioEl && info.bio) {
      bioEl.textContent = info.bio;
      bioEl.style.display = 'block';
    }

    // Theme Color
    if (info.theme_color) applyThemeColor(info.theme_color);

    // Profile Image
    const imgEl = document.getElementById('profile-img');
    if (imgEl && info.profile_image) {
      const imgSrc = info.profile_image.startsWith('http')
        ? info.profile_image
        : `${IMG_BASE_URL}/${info.profile_image}`;
      imgEl.src = imgSrc;
      const modalImg = document.getElementById('modalProfileImage');
      if (modalImg) modalImg.src = imgSrc;
    }

    // Stats
    const yearsEl = document.getElementById('years-exp');
    const projEl = document.getElementById('completed-projects');
    const clientsEl = document.getElementById('satisfied-clients');
    if (yearsEl) yearsEl.textContent = info.years_experience || 0;
    if (projEl) projEl.textContent = `+${info.completed_projects || 0}`;
    if (clientsEl) clientsEl.textContent = info.satisfied_customers || 0;

    // CV Buttons
    setupCvButton('cv-web-btn', info.cv_web_url, info.cv_web_btn_text, 'Download Web CV');
    setupCvButton('cv-network-btn', info.cv_network_url, info.cv_network_btn_text, 'Download Network CV');

    // WhatsApp Float
    if (info.phone) injectWhatsAppFloat(info.phone);

    // HireMe section dynamic links
    setupHireMeLinks(info);

    // Swap skeletons → real elements
    swapSkeleton('skeleton-avatar-wrap', 'real-avatar-wrap');
    swapSkeleton('skeleton-profile-text', null);
    if (nameEl) nameEl.style.display = '';
    if (profEl) profEl.style.display = '';
    swapSkeleton('skeleton-stats', 'real-stats');
    swapSkeleton('skeleton-btns', 'real-btns');

  } catch (err) {
    console.error('Failed to load personal info:', err);
    revealPersonalInfoFallback();
  }
}

function revealPersonalInfoFallback() {
  const nameEl = document.getElementById('profile-name');
  const profEl = document.getElementById('profile-profession');
  const yearsEl = document.getElementById('years-exp');
  const projEl = document.getElementById('completed-projects');
  const clientsEl = document.getElementById('satisfied-clients');
  const avatarWrap = document.getElementById('real-avatar-wrap');

  if (nameEl) {
    nameEl.textContent = nameEl.textContent || 'Mohamed Emad Ali';
    nameEl.style.display = '';
  }
  if (profEl) {
    profEl.textContent = profEl.textContent || 'DevOps & Network Engineer';
    profEl.style.display = '';
  }
  if (yearsEl) yearsEl.textContent = yearsEl.textContent || '0';
  if (projEl) projEl.textContent = projEl.textContent || '+0';
  if (clientsEl) clientsEl.textContent = clientsEl.textContent || '0';

  if (avatarWrap && !avatarWrap.querySelector('.avatar-fallback')) {
    avatarWrap.innerHTML = '<div class="avatar-fallback">ME</div>';
  }

  setupCvButton('cv-web-btn', null, null, 'Download Web CV');
  setupCvButton('cv-network-btn', null, null, 'Download Network CV');

  swapSkeleton('skeleton-avatar-wrap', 'real-avatar-wrap');
  swapSkeleton('skeleton-profile-text', null);
  swapSkeleton('skeleton-stats', 'real-stats');
  swapSkeleton('skeleton-btns', 'real-btns');
}

function setupCvButton(id, url, labelFromDb, fallbackLabel) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (url) {
    const src = url.startsWith('http') ? url : `${IMG_BASE_URL}/${url}`;
    btn.href = src;
    const label = (labelFromDb && labelFromDb.trim()) ? labelFromDb.trim() : fallbackLabel;
    btn.innerHTML = `${label} <i class="ri-download-line"></i>`;
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
  }
}

function injectWhatsAppFloat(phone) {
  if (document.getElementById('whatsapp-float')) return;
  const btn = document.createElement('a');
  btn.id = 'whatsapp-float';
  btn.href = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.title = 'WhatsApp';
  btn.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    width:56px;height:56px;border-radius:50%;
    background:#25D366;display:flex;align-items:center;
    justify-content:center;box-shadow:0 4px 16px rgba(37,211,102,0.4);
    transition:transform 0.2s;
  `;
  btn.innerHTML = '<i class="ri-whatsapp-line" style="font-size:28px;color:#fff;"></i>';
  btn.onmouseenter = () => (btn.style.transform = 'scale(1.1)');
  btn.onmouseleave = () => (btn.style.transform = 'scale(1)');
  document.body.appendChild(btn);
}

function setupHireMeLinks(info) {
  const waBtn = document.getElementById('hire-whatsapp-btn');
  const mailBtn = document.getElementById('hire-email-btn');
  if (waBtn && info.phone) {
    waBtn.href = `https://wa.me/${info.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi Mohamed, I have a project inquiry.')}`;
    waBtn.target = '_blank';
  }
  if (mailBtn && info.email) {
    mailBtn.href = `mailto:${info.email}?subject=${encodeURIComponent('Project Inquiry')}&body=${encodeURIComponent('Hi Mohamed, I would like to discuss a project.')}`;
  }
}

// =============================================
// 2. Social Links
// =============================================
async function loadSocialLinks() {
  try {
    const response = await API.getSocialLinks();
    const links = response.data || [];
    const container = document.getElementById('socials-container');
    if (!container) return;

    container.innerHTML = links.map(link =>
      `<a href="${link.url}" target="_blank" rel="noopener" class="link" aria-label="${link.platform}" title="${link.platform}">
         <i class="${getIconClass(link.platform)}"></i>
       </a>`
    ).join('');

    // Swap skeleton → real
    swapSkeleton('skeleton-socials', 'socials-container');

  } catch (err) {
    console.error('Failed to load social links:', err);
    const container = document.getElementById('socials-container');
    if (container) container.innerHTML = '';
    swapSkeleton('skeleton-socials', 'socials-container');
  }
}

// =============================================
// 3. Skills — grouped by category
// =============================================
async function loadSkills() {
  try {
    const response = await API.getSkills();
    const skills = response.data || [];
    const container = document.getElementById('skills-container');
    if (!container) return;

    if (skills.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No skills added yet.</p>';
      return;
    }

    // Group by category
    const groups = {};
    skills.forEach(s => {
      const cat = (s.category && s.category.name) ? s.category.name : 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });

    container.innerHTML = Object.entries(groups).map(([catName, catSkills]) => `
      <div class="skill-category-container">
        <div class="skill-category-divider">
          <div class="skill-category-badge">${catName}</div>
        </div>
        <div class="row g-4">
          ${catSkills.map((skill, i) => {
            const brand = getSkillBrand(skill.name);
            return `
              <div class="col-md-6 col-lg-4 mb-3">
                <div class="skill-card reveal-scale" style="border-color:${brand.color}33;box-shadow:0 8px 30px ${brand.color}15;">
                  <div class="skill-card-inner" style="margin-bottom:0;">
                    <div class="skill-icon-box" style="background:${brand.color}18;border:1px solid ${brand.color}44;">
                      <i class="${brand.icon}" style="color:${brand.color};"></i>
                    </div>
                    <div class="skill-info">
                      <h3 class="skill-name" style="color:${brand.color};">${skill.name}</h3>
                      <p class="skill-desc">${skill.description || ''}</p>
                    </div>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Trigger animations for newly added skills
    observeNewReveals(container);

  } catch (err) {
    console.error('Failed to load skills:', err);
  }
}

// =============================================
// 4. Projects
// =============================================
async function loadProjects() {
  try {
    const response = await API.getProjects();
    const projects = (response.data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    if (projects.length === 0) {
      grid.innerHTML = '<p class="text-center text-muted py-4">No projects yet.</p>';
      return;
    }

    const colors = ['', 'glass-purple', 'glass-emerald', 'glass-rose', 'glass-amber'];

    function renderProject(p, i) {
      const cc = colors[i % colors.length];
      const imgSrc = p.image_url
        ? (p.image_url.startsWith('http') ? p.image_url : `${IMG_BASE_URL}/${p.image_url}`)
        : '';
      const liveBtn = (p.live_link || p.link)
        ? `<a href="${p.live_link || p.link}" class="btn-view-source flex-grow-1" target="_blank" rel="noopener"><i class="ri-global-line"></i> Live Demo</a>` : '';
      const ghBtn = p.github_link
        ? `<a href="${p.github_link}" class="btn-view-source flex-grow-1" style="background:rgba(255,255,255,0.1);color:#fff!important;border:1px solid rgba(255,255,255,0.2);" target="_blank" rel="noopener"><i class="ri-github-line"></i> Code</a>` : '';
      const isActive = (p.is_active === true || p.is_active === 1 || p.is_active === '1');
      const statusHtml = isActive
        ? '<span class="status-badge" style="background:var(--accent);color:#000;border:none;">● Active</span>'
        : '<span class="status-badge status-inactive">○ Inactive</span>';
      const catName = p.category ? p.category.name : 'Project';

      return `
        <div class="col-md-6 col-lg-6 mb-4">
          <div class="card h-100 border-0 ${cc} reveal-up">
            ${statusHtml}
            <div class="position-relative overflow-hidden project-img-container"
                 style="border-radius:20px 20px 0 0;cursor:pointer;"
                 onclick="window.__openProjectPreview('${imgSrc}')">
              <span class="category-badge-overlay" style="background:var(--accent);color:#000;">${catName}</span>
              ${imgSrc ? `<img src="${imgSrc}" loading="lazy" decoding="async" width="600" height="280" class="card-img-top" alt="${p.title}" style="height:280px;aspect-ratio:16/9;background:var(--glass-bg);object-fit:cover;transition:0.5s;">` : ''}
              <div class="image-overlay-hint">
                <i class="ri-zoom-in-line"></i><span>Preview Image</span>
              </div>
            </div>
            <div class="card-body d-flex flex-column p-4">
              <h3 class="card-title mb-3" style="font-size:1.5rem;">${p.title}</h3>
              <p class="card-text small flex-grow-1">${p.description || ''}</p>
              <div class="d-flex gap-2 mt-4">${liveBtn}${ghBtn}</div>
            </div>
          </div>
        </div>`;
    }

    setupLoadMoreBtn('load-more-projects', grid, projects, renderProject, null);

  } catch (err) {
    console.error('Failed to load projects:', err);
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="data-error">
            <i class="ri-wifi-off-line"></i>
            <p>Projects could not be loaded right now.</p>
          </div>
        </div>`;
    }
  }
}

// Global: Project image preview
window.__openProjectPreview = function (imgSrc) {
  const el = document.getElementById('projectModalImage');
  if (el) {
    el.src = imgSrc;
    new bootstrap.Modal(document.getElementById('projectImageModal')).show();
  }
};

// =============================================
// 5. Certificates
// =============================================
async function loadCertificates() {
  try {
    const response = await API.getCertificates();
    const certs = response.data || [];

    const webGrid = document.getElementById('cert-grid-web');
    const netGrid = document.getElementById('cert-grid-net');
    const netTabLi = document.getElementById('cert-tab-net-li');

    const WEB_CAT_ID = 1;
    const NET_CAT_ID = 2;
    const isWebCert = c => {
      if (c.category_id === WEB_CAT_ID) return true;
      const n = (c.category && c.category.name ? c.category.name : '').toLowerCase();
      return n.includes('web') || n.includes('program') || n.includes('develop');
    };
    const isNetCert = c => {
      if (c.category_id === NET_CAT_ID) return true;
      const n = (c.category && c.category.name ? c.category.name : '').toLowerCase();
      return n.includes('cyber') || n.includes('network') || n.includes('security');
    };

    const webCerts = certs.filter(c => isWebCert(c));
    const netCerts = certs.filter(c => isNetCert(c) && !isWebCert(c));
    const otherCerts = certs.filter(c => !isWebCert(c) && !isNetCert(c));
    const webAll = [...webCerts, ...otherCerts];

    if (netTabLi) netTabLi.style.display = netCerts.length === 0 ? 'none' : '';

    const variants = [
      { cls: '', accent: '#06b6d4' },
      { cls: 'glass-purple', accent: '#a78bfa' },
      { cls: 'glass-emerald', accent: '#34d399' },
      { cls: 'glass-rose', accent: '#fb7185' },
      { cls: 'glass-amber', accent: '#fbbf24' },
    ];

    function buildCert(cert, idx) {
      const v = variants[idx % variants.length];
      const imgSrc = cert.image_url
        ? (cert.image_url.startsWith('http') ? cert.image_url : `${IMG_BASE_URL}/${cert.image_url}`)
        : '';
      const fileSrc = cert.file_url
        ? (cert.file_url.startsWith('http') ? cert.file_url : `${IMG_BASE_URL}/${cert.file_url}`)
        : '';
      const catName = cert.category ? cert.category.name : '';

      return `
        <div class="col-md-6 col-lg-4 certificate-item">
          <div class="card certificate-card h-100 border-0 ${v.cls} reveal-right" style="--cert-accent:${v.accent};">
            ${imgSrc ? `
              <div class="position-relative overflow-hidden" style="border-radius:20px 20px 0 0;">
                <img src="${imgSrc}" loading="lazy" decoding="async" width="400" height="200" class="card-img-top certificate-img" alt="${cert.title}"
                     style="height:200px;aspect-ratio:16/9;background:var(--glass-bg);object-fit:cover;cursor:pointer;"
                     data-bs-toggle="modal" data-bs-target="#certificateModal" data-img="${imgSrc}" data-pdf="${fileSrc}">
                ${catName ? `<span class="category-badge-overlay" style="background:${v.accent}cc;color:#000;">${catName}</span>` : ''}
              </div>
            ` : (catName ? `<div class="p-3 text-center"><span class="badge" style="background:${v.accent}33;color:${v.accent};border:1px solid ${v.accent}44;padding:0.5rem 1.2rem;border-radius:30px;">${catName}</span></div>` : '')}
            <div class="card-body d-flex flex-column text-center p-4">
              <h3 class="card-title h5 fw-bold mb-2" style="color:#fff;">${cert.title}</h3>
              ${cert.issuer ? `<p class="small mb-1" style="color:var(--txt-muted);"><i class="ri-building-line me-1" style="color:${v.accent};"></i>${cert.issuer}</p>` : ''}
              ${cert.date_acquired ? `<p class="small mb-3" style="color:var(--txt-muted);"><i class="ri-calendar-line me-1" style="color:${v.accent};"></i>${cert.date_acquired}</p>` : ''}
              <div class="mt-auto">
                ${fileSrc ? `<a href="${fileSrc}" class="cert-view-btn" style="background:${v.accent};box-shadow:0 8px 25px ${v.accent}55;color:#000;" target="_blank" rel="noopener"><i class="ri-file-text-line"></i> View Certificate</a>` : ''}
              </div>
            </div>
          </div>
        </div>`;
    }

    // Bind cert modal click handler (reusable)
    function bindCertModals() {
      document.querySelectorAll('[data-bs-target="#certificateModal"]').forEach(el => {
        if (el.dataset._bound) return; // skip already bound
        el.dataset._bound = '1';
        el.addEventListener('click', () => {
          const modalImg = document.getElementById('modalImage');
          if (modalImg) modalImg.src = el.dataset.img || '';
        });
      });
    }

    if (webGrid) {
      if (webAll.length === 0) {
        webGrid.innerHTML = '<div class="col-12 text-center text-muted py-4">No programming certificates yet.</div>';
      } else {
        setupLoadMoreBtn('load-more-cert-web', webGrid, webAll, buildCert, bindCertModals);
      }
    }
    if (netGrid) {
      if (netCerts.length === 0) {
        netGrid.innerHTML = '';
      } else {
        setupLoadMoreBtn('load-more-cert-net', netGrid, netCerts, buildCert, bindCertModals);
      }
    }

  } catch (err) {
    console.error('Failed to load certificates:', err);
  }
}

// =============================================
// Theme Color — Dynamic CSS Variables
// =============================================
function applyThemeColor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.4)`);
  root.style.setProperty('--accent-glow-01', `rgba(${r},${g},${b},0.1)`);
  root.style.setProperty('--accent-glow-012', `rgba(${r},${g},${b},0.12)`);
  root.style.setProperty('--accent-glow-02', `rgba(${r},${g},${b},0.2)`);
  root.style.setProperty('--accent-glow-03', `rgba(${r},${g},${b},0.3)`);
  root.style.setProperty('--accent-glow-04', `rgba(${r},${g},${b},0.4)`);
  root.style.setProperty('--accent-glow-045', `rgba(${r},${g},${b},0.45)`);
  root.style.setProperty('--accent-glow-05', `rgba(${r},${g},${b},0.5)`);
  root.style.setProperty('--accent-glow-08', `rgba(${r},${g},${b},0.8)`);
  root.style.setProperty('--glass-border', `rgba(${r},${g},${b},0.2)`);
  localStorage.setItem('theme_accent', hex);
}

// =============================================
// Helper: Skill Brand Icon + Color
// =============================================
function getSkillBrand(name) {
  const n = (name || '').toLowerCase().trim();
  const map = [
    { keys: ['php'], icon: 'ri-code-s-slash-line', color: '#8892be' },
    { keys: ['javascript', 'js'], icon: 'ri-javascript-line', color: '#f7df1e' },
    { keys: ['typescript', 'ts'], icon: 'ri-file-code-line', color: '#3178c6' },
    { keys: ['python'], icon: 'ri-terminal-box-line', color: '#3d8fcc' },
    { keys: ['html'], icon: 'ri-html5-line', color: '#e44d26' },
    { keys: ['css'], icon: 'ri-css3-line', color: '#1572b6' },
    { keys: ['java'], icon: 'ri-cup-line', color: '#f89820' },
    { keys: ['c#', 'csharp'], icon: 'ri-code-line', color: '#9b4f96' },
    { keys: ['c++', 'cpp'], icon: 'ri-code-line', color: '#00599c' },
    { keys: ['go', 'golang'], icon: 'ri-code-box-line', color: '#00add8' },
    { keys: ['rust'], icon: 'ri-code-s-fill-line', color: '#ce412b' },
    { keys: ['swift'], icon: 'ri-code-s-slash-line', color: '#fa7343' },
    { keys: ['kotlin'], icon: 'ri-code-box-line', color: '#7f52ff' },
    { keys: ['laravel'], icon: 'ri-fire-line', color: '#ff2d20' },
    { keys: ['vue'], icon: 'ri-vuejs-line', color: '#42b883' },
    { keys: ['react'], icon: 'ri-reactjs-line', color: '#61dafb' },
    { keys: ['angular'], icon: 'ri-angularjs-line', color: '#dd1b16' },
    { keys: ['next'], icon: 'ri-next-js-line', color: '#ffffff' },
    { keys: ['nuxt'], icon: 'ri-nuxt-js-line', color: '#00dc82' },
    { keys: ['svelte'], icon: 'ri-svelte-line', color: '#ff3e00' },
    { keys: ['django'], icon: 'ri-server-line', color: '#0c4b33' },
    { keys: ['flask'], icon: 'ri-flask-line', color: '#ffffff' },
    { keys: ['express'], icon: 'ri-server-2-line', color: '#ffffff' },
    { keys: ['node', 'nodejs'], icon: 'ri-nodejs-line', color: '#68a063' },
    { keys: ['spring'], icon: 'ri-leaf-line', color: '#6db33f' },
    { keys: ['fastapi'], icon: 'ri-speed-up-line', color: '#009688' },
    { keys: ['mysql'], icon: 'ri-database-2-line', color: '#4479a1' },
    { keys: ['postgresql', 'postgres'], icon: 'ri-database-line', color: '#336791' },
    { keys: ['mongodb'], icon: 'ri-database-fill', color: '#4db33d' },
    { keys: ['redis'], icon: 'ri-server-fill-line', color: '#dc382d' },
    { keys: ['sqlite'], icon: 'ri-database-line', color: '#003b57' },
    { keys: ['docker'], icon: 'ri-ship-2-line', color: '#2496ed' },
    { keys: ['kubernetes', 'k8s'], icon: 'ri-ship-line', color: '#326ce5' },
    { keys: ['git'], icon: 'ri-git-branch-line', color: '#f05032' },
    { keys: ['github'], icon: 'ri-github-line', color: '#ffffff' },
    { keys: ['linux'], icon: 'ri-terminal-line', color: '#fcc624' },
    { keys: ['aws'], icon: 'ri-cloud-line', color: '#ff9900' },
    { keys: ['azure'], icon: 'ri-cloud-fill', color: '#0078d4' },
    { keys: ['gcp', 'google cloud'], icon: 'ri-cloud-line', color: '#4285f4' },
    { keys: ['figma'], icon: 'ri-pen-nib-line', color: '#a259ff' },
    { keys: ['photoshop'], icon: 'ri-image-edit-line', color: '#31a8ff' },
    { keys: ['illustrator'], icon: 'ri-image-line', color: '#ff9a00' },
  ];
  for (const entry of map) {
    if (entry.keys.some(k => n.includes(k))) return { icon: entry.icon, color: entry.color };
  }
  return { icon: 'ri-code-s-slash-line', color: '#06b6d4' };
}

// =============================================
// Helper: Platform → Icon Class
// =============================================
function getIconClass(platform) {
  const p = (platform || '').toLowerCase();
  if (p.includes('linkedin')) return 'ri-linkedin-box-line';
  if (p.includes('github')) return 'ri-github-line';
  if (p.includes('twitter') || p.includes(' x')) return 'ri-twitter-x-line';
  if (p.includes('facebook')) return 'ri-facebook-line';
  if (p.includes('instagram')) return 'ri-instagram-line';
  if (p.includes('mail') || p.includes('gmail')) return 'ri-mail-line';
  if (p.includes('whatsapp')) return 'ri-whatsapp-line';
  if (p.includes('youtube')) return 'ri-youtube-line';
  if (p.includes('tiktok')) return 'ri-tiktok-line';
  if (p.includes('telegram')) return 'ri-telegram-line';
  return 'ri-link';
}
